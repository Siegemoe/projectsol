export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { envEnabled } from "@/lib/rateLimit";
import { isAllowlisted } from "@/lib/allowlist";
import {
  buildOAuthClient,
  gmailFromOAuth,
  upsertTokenRow,
  fetchGmailProfileEmail,
} from "@/lib/google/auth";

function enabled(): boolean {
  return envEnabled(process.env.ENABLE_GMAIL, true);
}

function isSafeNext(next: string | null | undefined): next is string {
  if (!next) return false;
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  if (next.includes("://")) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cookieNext = req.cookies.get("gmail_oauth_next")?.value || null;
  const requestedNext = url.searchParams.get("next") || cookieNext || "/app/chat?email=1";
  const safeNext = isSafeNext(requestedNext) ? requestedNext : "/app/chat?email=1";

  // Must be enabled
  if (!enabled()) {
    return NextResponse.redirect(new URL(safeNext, url.origin), 303);
  }

  // Gather Supabase cookie operations so we can apply to our redirects
  const cookieOps: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          cookieOps.push({ name, value, options });
        },
        remove: (name: string, options: CookieOptions) => {
          cookieOps.push({ name, value: "", options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signin = new URL("/signin", url.origin);
    signin.searchParams.set("next", safeNext);
    const redirect = NextResponse.redirect(signin, 303);
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }

  if (!isAllowlisted(user.email)) {
    const notInvited = new URL("/not-invited", url.origin);
    const redirect = NextResponse.redirect(notInvited, 303);
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = req.cookies.get("gmail_oauth_state")?.value;
  if (!code || !state || !stateCookie || state !== stateCookie) {
    const redirect = NextResponse.redirect(new URL(safeNext + (safeNext.includes("?") ? "&" : "?") + "error=oauth_state", url.origin), 303);
    // clear state + next cookies
    redirect.cookies.set({
      name: "gmail_oauth_state",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: url.protocol === "https:",
    });
    redirect.cookies.set({
      name: "gmail_oauth_next",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: url.protocol === "https:",
    });
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }

  try {
    const oauth = buildOAuthClient();
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);

    // Fetch profile email
    const gmail = gmailFromOAuth(oauth);
    const email = await fetchGmailProfileEmail(gmail);

    await upsertTokenRow({
      supabase,
      userId: user.id,
      email: email ?? user.email ?? null,
      accessToken: tokens.access_token ?? null,
      refreshTokenPlain: tokens.refresh_token ?? null,
      scope: typeof tokens.scope === "string" ? tokens.scope : null,
      expiryDateMs: typeof tokens.expiry_date === "number" ? tokens.expiry_date : null,
    });

    const redirectUrl = new URL(safeNext, url.origin);
    const redirect = NextResponse.redirect(redirectUrl, 303);

    // Clear state + next cookies
    redirect.cookies.set({
      name: "gmail_oauth_state",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: url.protocol === "https:",
    });
    redirect.cookies.set({
      name: "gmail_oauth_next",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: url.protocol === "https:",
    });

    // Apply supabase cookie ops
    for (const op of cookieOps) {
      redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    }
    return redirect;
  } catch (e) {
    console.error("Gmail OAuth callback error:", e);
    const redirectUrl = new URL(safeNext, url.origin);
    redirectUrl.searchParams.set("error", "oauth_error");
    const redirect = NextResponse.redirect(redirectUrl, 303);
    // Clear state cookie
    redirect.cookies.set({
      name: "gmail_oauth_state",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: url.protocol === "https:",
    });
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }
}
