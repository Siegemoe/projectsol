"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useStreamedChat } from "@/hooks/useStreamedChat";
import { coerceFolder } from "@/lib/sanitize";

const LazyEmailWindow = dynamic(
  () => import("@/app/app/tools/email/components/EmailWindow"),
  { ssr: false }
);

type Role = "user" | "assistant";
type Message = { role: Role; content: string };
type Folder = "inbox" | "pinned" | "drafts" | "sent" | "trash";

interface SolChatProps {
  title?: string;
  apiPath?: string;
  /**
   * When false, hides the Email tool and disables the email overlay behavior.
   * Useful when embedding SolChat inside the Email tool as the right-side pane.
   */
  emailToolEnabled?: boolean;
}

export default function SolChat({
  title = "Sol",
  apiPath = "/api/sol-chat",
  emailToolEnabled = true,
}: SolChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey — I'm Sol. Ask me anything. I use a memory-first approach to help with real work.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Email overlay state (used only if emailToolEnabled)
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailFolder, setEmailFolder] = useState<Folder>("inbox");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { startStream } = useStreamedChat(apiPath);

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

  // Listen for global "sol:open-email" events dispatched by the AppSidebar
  useEffect(() => {
    if (!emailToolEnabled) return;
    const handler = (e: Event) => {
      const anyEvt = e as CustomEvent<{ open?: boolean; folder?: Folder }>;
      const detail = anyEvt?.detail || {};
      if (detail.folder)
        setEmailFolder(coerceFolder(typeof detail.folder === "string" ? detail.folder : null, "inbox"));
      if (detail.open === false) setEmailOpen(false);
      else setEmailOpen(true);
    };
    window.addEventListener("sol:open-email", handler as EventListener);
    return () => window.removeEventListener("sol:open-email", handler as EventListener);
  }, [emailToolEnabled]);

  // Support deep-linking via query params: ?email=1&folder=inbox
  useEffect(() => {
    if (!emailToolEnabled || typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const shouldOpen = url.searchParams.get("email");
      if (shouldOpen === "1") {
        const f = url.searchParams.get("folder");
        setEmailFolder(coerceFolder(f, "inbox"));
        setEmailOpen(true);
        // Clean the URL
        const params = new URLSearchParams(url.searchParams);
        params.delete("email");
        params.delete("folder");
        const next = url.pathname + (params.toString() ? `?${params.toString()}` : "");
        window.history.replaceState({}, "", next);
      }
    } catch {}
  }, [emailToolEnabled]);

  // Broadcast overlay open/close state to the sidebar so it can expand/collapse the Email menu
  useEffect(() => {
    if (!emailToolEnabled) return;
    try {
      window.dispatchEvent(
        new CustomEvent("sol:email-open-changed", { detail: { open: emailOpen } } as any)
      );
    } catch {}
  }, [emailOpen, emailToolEnabled]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Determine model from sidebar selection (localStorage), fallback to DeepSeek chat
    const model =
      (typeof window !== "undefined" && localStorage.getItem("app:model")) ||
      "deepseek/deepseek-chat";
    const temperature = 0.3;
    const system: string | undefined = undefined;

    const nextMessages = [...messages, { role: "user", content: trimmed } as Message];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Helper: append token to the last assistant message
    const appendToken = (token: string) => {
      setMessages((prev) => {
        const copy: Message[] = [...prev];
        if (copy.length === 0 || copy[copy.length - 1].role !== "assistant") {
          copy.push({ role: "assistant", content: token });
          return copy;
        }
        copy[copy.length - 1] = {
          role: "assistant",
          content: (copy[copy.length - 1].content || "") + token,
        };
        return copy;
      });
    };

    try {
      await startStream({
        messages: nextMessages,
        model,
        temperature,
        system,
        onOpen: () => {
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        },
        onToken: (token) => {
          appendToken(token);
        },
      });
    } catch (err: any) {
      // If streaming failed, append an error assistant message
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

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
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
              placeholder={`Ask ${title}`}
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
              {emailToolEnabled && (
                <button
                  type="button"
                  onClick={() => setEmailOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-1 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700"
                  aria-label="Open Email"
                  title="Email"
                >
                  Email
                </button>
              )}
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

      {/* Email overlay panel (slides in from the left) */}
      {emailToolEnabled && (
        <div
          className={[
            "pointer-events-auto absolute inset-0 z-20 bg-neutral-950 transition-transform duration-300",
            emailOpen ? "translate-x-0 ease-out" : "-translate-x-full ease-in",
          ].join(" ")}
          aria-hidden={!emailOpen}
        >
          {emailOpen && (
            <LazyEmailWindow
              embedded
              showSidebar={false}
              folder={emailFolder}
              onChangeFolder={setEmailFolder}
              onClose={() => setEmailOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
