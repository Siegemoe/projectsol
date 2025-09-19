export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { envEnabled } from "@/lib/rateLimit";
import { isAllowlisted } from "@/lib/allowlist";
import { buildOAuthClient, generateState } from "@/lib/google/auth";

const GMAIL_SCOPE_READONLY = "https://www.googleapis.com/auth/gmail.readonly";

function enabled(): boolean {
  return envEnabled(process.env.ENABLE_GMAIL, true);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const backTo = url.searchParams.get("next") || "/app/settings?tab=connections";

  // Must be enabled via env
  if (!enabled()) {
    const res = NextResponse.redirect(new URL(backTo, url.origin), 303);
    res.headers.set("X-Gmail", "disabled");
    return res;
  }

  // Capture cookie mutations so they can be applied to the redirect response
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

  // Require authenticated + allowlisted user
  if (!user) {
    const signinUrl = new URL("/signin", url.origin);
    signinUrl.searchParams.set("next", backTo);
    const redirect = NextResponse.redirect(signinUrl, 303);
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }
  if (!isAllowlisted(user.email)) {
    const notInvited = new URL("/not-invited", url.origin);
    const redirect = NextResponse.redirect(notInvited, 303);
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }

  // Build Google OAuth consent URL
  const oauth = buildOAuthClient();
  const state = generateState();

  // Persist state in a short-lived HttpOnly cookie for CSRF protection
  const stateCookieOpts: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  };

  const authUrl = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [GMAIL_SCOPE_READONLY],
    state,
  });

  const redirect = NextResponse.redirect(authUrl, 303);
  // Apply any Supabase cookie mutations
  for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
  // Set our state cookie
  redirect.cookies.set({ name: "gmail_oauth_state", value: state, ...stateCookieOpts });
  return redirect;
}
