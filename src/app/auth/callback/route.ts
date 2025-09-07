import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // Prepare a redirect response that we'll return after exchanging the code; we attach cookies to this response
  const res = NextResponse.redirect(new URL(safeNext, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const code = url.searchParams.get("code");
  if (!code) {
    const signinUrl = new URL("/signin", url.origin);
    signinUrl.searchParams.set("error", "Missing OAuth code");
    signinUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(signinUrl);
  }
  // Exchange the auth code present in the URL for a session and set auth cookies
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // On error, return to /signin and surface a minimal error plus the intended next for retry
    const signinUrl = new URL("/signin", url.origin);
    signinUrl.searchParams.set("error", error.message ?? "OAuth error");
    signinUrl.searchParams.set("next", safeNext);
    return NextResponse.redirect(signinUrl);
  }

  // On success, continue to the original destination
  return res;
}
