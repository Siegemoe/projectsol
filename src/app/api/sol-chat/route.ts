export const runtime = "edge";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit, envEnabled } from "@/lib/rateLimit";
import { isAllowlisted } from "@/lib/allowlist";

type Role = "user" | "assistant";
type ChatMessage = { role: Role; content: string };

const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 10_000;
const MAX_TOTAL_CHARS = 50_000;

function parseAllowedModels(): Set<string> {
  const raw = process.env.OPENROUTER_ALLOWED_MODELS;
  if (raw) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return new Set(parts);
  }
  // default allowlist
  return new Set(["deepseek/deepseek-chat"]);
}

function validateTemperature(value: any, fallback = 0.3) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n)) {
    return Math.min(2, Math.max(0, n));
  }
  return fallback;
}

function validateMessagesPayload(payload: any):
  | { ok: true; messages: ChatMessage[]; totalChars: number }
  | { ok: false; status: number; error: string } {
  if (!Array.isArray(payload) || payload.length === 0) {
    return { ok: false, status: 400, error: "messages must be a non-empty array" };
  }
  if (payload.length > MAX_MESSAGES) {
    return { ok: false, status: 413, error: `too many messages (>${MAX_MESSAGES})` };
  }

  let totalChars = 0;
  const result: ChatMessage[] = [];

  for (const m of payload) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string" || m.content.length === 0) {
      return { ok: false, status: 400, error: "invalid message format" };
    }
    if (m.content.length > MAX_CONTENT_CHARS) {
      return { ok: false, status: 413, error: `message too large (>${MAX_CONTENT_CHARS} chars)` };
    }
    totalChars += m.content.length;
    result.push({ role: m.role, content: m.content });
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return { ok: false, status: 413, error: `request too large (>${MAX_TOTAL_CHARS} chars)` };
  }

  return { ok: true, messages: result, totalChars };
}

async function getSupabaseUser() {
  try {
    const c = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => c.get(name)?.value,
          // No-ops for set/remove in Edge streaming context
          set: () => {},
          remove: () => {},
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  return ip || "anonymous";
}

function jsonError(error: string, status: number, headers?: Record<string, string>) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function POST(req: Request) {
  // Parse and validate JSON
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { messages, model, temperature, system } = body ?? {};

  // Default: require auth for this API (can be disabled explicitly via REQUIRE_AUTH_FOR_API=0)
  const REQUIRE_AUTH = envEnabled(process.env.REQUIRE_AUTH_FOR_API, true);
  let userId: string | null = null;
  if (REQUIRE_AUTH) {
    const user = await getSupabaseUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    if (!isAllowlisted(user.email)) {
      return jsonError("Forbidden", 403);
    }
    userId = user.id;
  }

  // Rate limiting (enabled by default, can be disabled with RATE_LIMIT_ENABLED=0)
  const RATE_LIMIT_ON = envEnabled(process.env.RATE_LIMIT_ENABLED, true);
  const ip = getClientIp(req);
  const rateKey = userId ? `uid:${userId}` : `ip:${ip}`;
  const { allowed, remaining, reset } = RATE_LIMIT_ON ? checkRateLimit(rateKey, 30, 5 * 60 * 1000) : { allowed: true, remaining: 0, reset: Date.now() + 5 * 60 * 1000 };

  const commonLimitHeaders: Record<string, string> = RATE_LIMIT_ON
    ? {
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": String(Math.max(0, remaining)),
        "X-RateLimit-Reset": String(Math.floor(reset / 1000)), // epoch seconds
      }
    : {};

  if (RATE_LIMIT_ON && !allowed) {
    return jsonError("Too Many Requests", 429, {
      "Retry-After": "60",
      ...commonLimitHeaders,
    });
  }

  // Check API key
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "your-openrouter-api-key-here") {
    return jsonError("OpenRouter API key not configured. Add your API key to .env.local: OPENROUTER_API_KEY=sk-or-your-key", 500, commonLimitHeaders);
  }

  // Validate model
  const allow = parseAllowedModels();
  const selectedModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : Array.from(allow)[0];
  if (!allow.has(selectedModel)) {
    return jsonError("Model not allowed", 400, commonLimitHeaders);
  }

  // Validate messages
  const msgCheck = validateMessagesPayload(messages);
  if (!msgCheck.ok) {
    return jsonError(msgCheck.error, msgCheck.status, commonLimitHeaders);
  }

  const safeTemperature = validateTemperature(temperature, 0.3);

  // Optional system prompt (capped length)
  const systemStr = typeof system === "string" ? system : undefined;
  const safeSystem = systemStr && systemStr.length > 5000 ? systemStr.slice(0, 5000) : systemStr;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "Sol",
      },
      body: JSON.stringify({
        model: selectedModel,
        temperature: safeTemperature,
        stream: true,
        messages: [
          ...(safeSystem ? [{ role: "system", content: safeSystem }] : []),
          ...msgCheck.messages,
        ],
      }),
    });

    if (!r.ok || !r.body) {
      // Do not leak upstream error bodies
      const requestId = r.headers.get("x-request-id") || r.headers.get("x-openrouter-id") || undefined;
      const errorBody = {
        error: "Upstream error",
        status: r.status,
        ...(requestId ? { requestId } : {}),
      };
      return new Response(JSON.stringify(errorBody), {
        status: r.status,
        headers: { "Content-Type": "application/json", ...commonLimitHeaders },
      });
    }

    // Pass-through streaming response (SSE)
    return new Response(r.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...commonLimitHeaders,
      },
    });
  } catch (err: any) {
    return jsonError(err?.message || "Request failed", 400, commonLimitHeaders);
  }
}
