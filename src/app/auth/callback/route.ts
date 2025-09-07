import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Validates that a "next" value is a safe, internal path to avoid open redirects
function isSafeNext(next: string | null | undefined): next is string {
  if (!next) return false;
  // Must start with a single slash, not double-slash, and not contain a scheme
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  if (next.includes("://")) return false;
  return true;
}

// Handles the OAuth callback from Supabase. Exchanges the code for a session and redirects back.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const requestedNext = url.searchParams.get("next");
  const safeNext = isSafeNext(requestedNext) ? requestedNext : "/app";

  // Capture cookie mutations so we can apply them to whichever response we return
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

  const code = url.searchParams.get("code");
  if (!code) {
    const signinUrl = new URL("/signin", url.origin);
    signinUrl.searchParams.set("error", "Missing OAuth code");
    signinUrl.searchParams.set("next", safeNext);
    const redirect = NextResponse.redirect(signinUrl, 303);
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }

  // Exchange the auth code present in the URL for a session and set auth cookies
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // On error, return to /signin and surface a minimal error plus the intended next for retry
    const signinUrl = new URL("/signin", url.origin);
    signinUrl.searchParams.set("error", error.message ?? "OAuth error");
    signinUrl.searchParams.set("next", safeNext);
    const redirect = NextResponse.redirect(signinUrl, 303);
    for (const op of cookieOps) redirect.cookies.set({ name: op.name, value: op.value, ...op.options });
    return redirect;
  }

  // On success, continue to the original destination
  const success = NextResponse.redirect(new URL(safeNext, url.origin), 303);
  for (const op of cookieOps) success.cookies.set({ name: op.name, value: op.value, ...op.options });
  return success;
}
