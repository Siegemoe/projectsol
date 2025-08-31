export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, model, temperature = 0.3, system } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "Sol",
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: true,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...(Array.isArray(messages) ? messages : []),
        ],
      }),
    });

    if (!r.ok || !r.body) {
      const txt = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: `OpenRouter ${r.status}: ${txt}` }), {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pass-through streaming response (SSE)
    return new Response(r.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
