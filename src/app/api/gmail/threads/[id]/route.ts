export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { checkRateLimit, envEnabled } from "@/lib/rateLimit";
import { isAllowlisted } from "@/lib/allowlist";
import { getUserOAuthClient, gmailFromOAuth, mapGmailThreadToThread } from "@/lib/google/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");
  const RATE_LIMIT_ON = envEnabled(process.env.RATE_LIMIT_ENABLED, true);

  const c = await cookies();
  // Capture cookie mutations to apply to final response
  const cookieOps: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => c.get(name)?.value,
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
    const resp = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }
  if (!isAllowlisted(user.email)) {
    const resp = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }

  // Rate limit per-user
  const rate = RATE_LIMIT_ON ? checkRateLimit(`gmail:thread:${user.id}`, 60, 5 * 60 * 1000) : { allowed: true, remaining: 0, reset: Date.now() + 5 * 60 * 1000 };
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
    const client = await getUserOAuthClient(supabase as any, user.id);
    if (!client) {
      const resp = NextResponse.json({ error: "Not connected" }, { status: 404, headers: { ...limitHeaders } });
      for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
      return resp;
    }
    const gmail = gmailFromOAuth(client.oauth);
    const thr = await gmail.users.threads.get({ userId: "me", id });
    const mapped = mapGmailThreadToThread(thr.data, "inbox"); // folder inference: default inbox for Phase 1
    if (!mapped) {
      const resp = NextResponse.json({ error: "Not found" }, { status: 404, headers: { ...limitHeaders } });
      for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
      return resp;
    }
    const resp = NextResponse.json(mapped, { status: 200, headers: { ...limitHeaders } });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  } catch (e: any) {
    const resp = NextResponse.json({ error: "Failed to fetch thread" }, { status: 500, headers: { ...limitHeaders } });
    for (const op of cookieOps) resp.cookies.set({ name: op.name, value: op.value, ...op.options });
    return resp;
  }
}
