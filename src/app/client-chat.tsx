"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ClientChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!input.trim()) return;
    setError(null);
    const next = [...messages, { role: "user", content: input } as Msg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setMessages([...next, { role: "assistant", content: data.content } as Msg]);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-800 p-3">
        {messages.length === 0 && (
          <div className="text-sm text-neutral-400">
            Ask anything. This hits <code>/api/chat</code> which proxies GPT-5.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="mb-2">
            <span className="mr-2 rounded bg-neutral-800 px-2 py-0.5 text-xs uppercase text-neutral-300">
              {m.role}
            </span>
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          onClick={send}
          disabled={loading}
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
