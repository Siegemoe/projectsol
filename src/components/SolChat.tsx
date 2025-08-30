"use client";

import React, { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

interface SolChatProps {
  title?: string;
  apiPath?: string;
}

export default function SolChat({ title = "Sol", apiPath = "/api/chat" }: SolChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey — I'm Sol. Ask me anything. I use a memory-first approach to help with real work.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep messages scrolled to bottom when they change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto resize textarea up to 5 lines
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = 20; // ~leading-5 for text-sm
    const maxRows = 5;
    const maxHeight = lineHeight * maxRows;
    const newHeight = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = `${newHeight}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed } as Message];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Request failed");
      }

      const data = await res.json();
      const content = String(data?.content ?? "").trim();
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I ran into an error reaching the model API. Please try again." +
            (err?.message ? `\n\nDetails: ${err.message}` : ""),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Scrollable messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] whitespace-pre-wrap text-sm",
                    isUser
                      ? "rounded-2xl px-3 py-2 bg-white text-neutral-900 shadow"
                      : "text-neutral-200",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer: sticky at bottom, Gemini-style bubble */}
      <div className="sticky bottom-0 mt-auto bg-neutral-950/60 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/30">
        <form onSubmit={sendMessage} className="mx-auto max-w-3xl">
          <div className="relative rounded-2xl bg-neutral-900 ring-1 ring-neutral-800 p-2 pr-12">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask Sol"
              className="w-full resize-none bg-transparent text-sm leading-5 text-neutral-100 outline-none placeholder:text-neutral-500 min-h-[36px]"
            />
            <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700"
                aria-label="Add"
              >
                +
              </button>
              <span>Tools</span>
            </div>
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="absolute right-2 bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 ring-1 ring-neutral-700 hover:bg-neutral-700 disabled:opacity-60"
              aria-label="Send"
            >
              {"\u003e"}
            </button>
          </div>
        </form>
        <div className="mx-auto max-w-3xl px-1 pt-2 text-[11px] text-neutral-500 text-center">
          Sol can make mistakes, fact check her.
        </div>
      </div>
    </div>
  );
}
