export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { checkRateLimit, envEnabled } from "@/lib/rateLimit";
import { isAllowlisted } from "@/lib/allowlist";
import { getTokenRow } from "@/lib/google/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const RATE_LIMIT_ON = envEnabled(process.env.RATE_LIMIT_ENABLED, true);

  // Capture cookie mutations to apply to final response
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
    const resp = NextResponse.json({ connected: false }, { status: 401 });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }
  if (!isAllowlisted(user.email)) {
    const resp = NextResponse.json({ connected: false }, { status: 403 });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }

  // Rate limit per-user
  const rate = RATE_LIMIT_ON ? checkRateLimit(`gmail:status:${user.id}`, 60, 5 * 60 * 1000) : { allowed: true, remaining: 0, reset: Date.now() + 5 * 60 * 1000 };
  const limitHeaders: HeadersInit = RATE_LIMIT_ON
    ? {
        "X-RateLimit-Limit": "60",
        "X-RateLimit-Remaining": String(Math.max(0, rate.remaining)),
        "X-RateLimit-Reset": String(Math.floor(rate.reset / 1000)),
      }
    : {};

  if (RATE_LIMIT_ON && !rate.allowed) {
    const resp = NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: { ...limitHeaders } });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }

  try {
    const row = await getTokenRow(supabase as any, user.id);
    const resp = NextResponse.json(
      { connected: !!row, email: row?.email ?? null },
      { status: 200, headers: { ...limitHeaders } }
    );
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  } catch (e: any) {
    const resp = NextResponse.json({ connected: false, error: "failed" }, { status: 500, headers: { ...limitHeaders } });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }
}
