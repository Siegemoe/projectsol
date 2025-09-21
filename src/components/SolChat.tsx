"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useStreamedChat } from "@/hooks/useStreamedChat";
import { coerceFolder } from "@/lib/sanitize";
import TimelineRail, { type TimelineItem } from "@/components/chat/TimelineRail";
import {
  getMessages,
  saveMessages,
  appendMessage,
  updateLastAssistantMessage,
  genId,
  type StoredMessage,
} from "@/hooks/useChatStore";

const LazyEmailWindow = dynamic(
  () => import("@/app/app/tools/email/components/EmailWindow"),
  { ssr: false }
);

type Role = "user" | "assistant";
type Message = { role: Role; content: string };
type Folder = "inbox" | "pinned" | "drafts" | "sent" | "trash";

const INITIAL_GREETING =
  "Hey — I'm Sol. Ask me anything. I use a memory-first approach to help with real work.";

interface SolChatProps {
  title?: string;
  apiPath?: string;
  /**
   * When false, hides the Email tool and disables the email overlay behavior.
   * Useful when embedding SolChat inside the Email tool as the right-side pane.
   */
  emailToolEnabled?: boolean;
  /**
   * Optional: current thread ID. When provided, messages are loaded/saved
   * from a local store so history persists. When absent, chat is ephemeral.
   */
  threadId?: string;
}

export default function SolChat({
  title = "Sol",
  apiPath = "/api/sol-chat",
  emailToolEnabled = true,
  threadId,
}: SolChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: INITIAL_GREETING,
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
  const messageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [timelinePage, setTimelinePage] = useState(0);

  // Layout refs for positioning the fixed TimelineRail
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [railOffset, setRailOffset] = useState<{ top: number; right: number; bottom: number }>({
    top: 72,
    right: 16,
    bottom: 96,
  });

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

  // Load messages for a given thread (persisted), or seed a greeting if empty
  useEffect(() => {
    if (!threadId) return;
    const stored = getMessages(threadId);
    if (stored.length > 0) {
      setMessages(stored.map((m) => ({ role: m.role as Role, content: m.content })));
    } else {
      const seed: StoredMessage = {
        id: genId(),
        role: "assistant",
        content: INITIAL_GREETING,
        createdAt: Date.now(),
      };
      saveMessages(threadId, [seed]);
      setMessages([{ role: "assistant", content: INITIAL_GREETING }]);
    }
    // reset timeline page to newest
    setTimelinePage(Math.max(0, Math.ceil((stored.length || 1) / 14) - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

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
        // Validate folder against allowed values before setting
        const rawFolder = (url.searchParams.get("folder") || "").toLowerCase();
        const allowedFolders: Folder[] = ["inbox", "pinned", "drafts", "sent", "trash"];
        if (rawFolder && allowedFolders.includes(rawFolder as Folder)) {
          setEmailFolder(rawFolder as Folder);
        }
        setEmailOpen(true);
        // Clean the URL (only after successful parsing/validation)
        const params = new URLSearchParams(url.searchParams);
        params.delete("email");
        params.delete("folder");
        const next = url.pathname + (params.toString() ? `?${params.toString()}` : "");
        window.history.replaceState({}, "", next);
      }
    } catch (err) {
      console.error("Failed to parse deep-linking email parameters:", err);
    }
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

  // Measure to position the TimelineRail so it aligns with the AppBar content (green line)
  useEffect(() => {
    function measure() {
      const el = rootRef.current;
      let top = 72;
      let right = 16;
      let bottom = 96;

      if (el) {
        const rect = el.getBoundingClientRect();
        // place slightly below the top of chat content to clear shadows
        top = Math.max(56, Math.round(rect.top) + 8);
      }

      // Align the right edge with the right edge of AppBar's max-width container
      const container = document.querySelector("header .max-w-7xl") as HTMLElement | null;
      if (container) {
        const c = container.getBoundingClientRect();
        const gutter = 8; // small gap from container edge
        right = Math.max(0, Math.round(window.innerWidth - c.right)) + gutter;
      }

      // Reserve space above the composer
      bottom = 88;

      setRailOffset({ top, right, bottom });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true } as any);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure as any);
    };
  }, []);

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

    // Add user message
    const nextMessages = [...messages, { role: "user", content: trimmed } as Message];
    setMessages(nextMessages);
    if (threadId) {
      const userStored: StoredMessage = {
        id: genId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      appendMessage(threadId, userStored);
    }

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
      if (threadId) {
        updateLastAssistantMessage(threadId, (curr) => ({
          ...curr,
          content: (curr.content || "") + token,
        }));
      }
    };

    try {
      await startStream({
        messages: nextMessages,
        model,
        temperature,
        system,
        onOpen: () => {
          // Seed assistant response
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
          if (threadId) {
            appendMessage(threadId, {
              id: genId(),
              role: "assistant",
              content: "",
              createdAt: Date.now(),
            });
          }
        },
        onToken: (token) => {
          appendToken(token);
        },
      });
    } catch (err: any) {
      // If streaming failed, append an error assistant message
      const errorContent =
        "I ran into an error reaching the model API. Please try again." +
        (err?.message ? `\n\nDetails: ${err.message}` : "");
      setMessages((prev) => [...prev, { role: "assistant", content: errorContent }]);
      if (threadId) {
        appendMessage(threadId, {
          id: genId(),
          role: "assistant",
          content: errorContent,
          createdAt: Date.now(),
        });
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Utilities for timeline rail
  function previewSnippet(text: string, maxWords = 10) {
    const parts = (text || "").trim().split(/\s+/);
    const s = parts.slice(0, maxWords).join(" ");
    return parts.length > maxWords ? `${s}…` : s;
  }
  const timelineItems: TimelineItem[] = messages.map((m, idx) => ({
    index: idx,
    role: m.role,
    preview: `${m.role === "user" ? "You" : title}: ${previewSnippet(m.content)}`,
  }));
  const jumpTo = (i: number) => {
    const node = messageRefs.current[i];
    if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div ref={rootRef} className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Scrollable messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pl-3 pr-8 md:pr-14 py-4 scroll-hover">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                ref={(el) => {
                  messageRefs.current[idx] = el;
                }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[90%] whitespace-pre-wrap text-[13px] leading-5",
                    isUser
                      ? "rounded-2xl px-3 py-2 bg-[color-mix(in_srgb,var(--accent)_18%,var(--bg-elev-2))] text-text"
                      : "rounded-2xl px-3 py-2 bg-[color:var(--bg-elev-2)] text-text shadow-hairline",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3 py-2 text-sm text-text bg-[color:var(--bg-elev-2)] shadow-hairline">
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer: sticky at bottom, Gemini-style bubble */}
      <div className="sticky bottom-0 mt-auto bg-[color:var(--panel-bg)] px-3 py-3 backdrop-blur supports-[backdrop-filter]:backdrop-saturate-125">
        <form onSubmit={sendMessage} className="mx-auto max-w-4xl">
          <div className="relative rounded-2xl bg-[color:var(--bg-elev-2)] p-2 pr-12 shadow-hairline">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={`Ask ${title}`}
              className="w-full resize-none bg-transparent text-[13px] leading-5 text-text outline-none placeholder:text-text-dim min-h-[36px] transition-[height] duration-200 ease-out"
            />
            <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
                aria-label="Add"
              >
                +
              </button>
              <span>Tools</span>
              {emailToolEnabled && (
                <button
                  type="button"
                  onClick={() => setEmailOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md bg-[color:var(--bg-elev-2)] px-2 py-1 text-text shadow-hairline"
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
              className="absolute right-2 bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--bg-elev-2)] text-text shadow-hairline disabled:opacity-60"
              aria-label="Send"
            >
              {"\u003e"}
            </button>
          </div>
        </form>
        <div className="mx-auto max-w-3xl px-1 pt-2 text-[11px] text-text-dim text-center">
          Sol can make mistakes, fact check her.
        </div>
      </div>

      {/* Right-side timeline rail (fixed, aligned with AppBar container) */}
      <TimelineRail
        items={timelineItems}
        page={timelinePage}
        onPageChange={setTimelinePage}
        onJumpTo={jumpTo}
        topOffset={railOffset.top}
        rightOffset={railOffset.right}
        bottomOffset={railOffset.bottom}
      />

      {/* Email overlay panel (slides in from the left) */}
      {emailToolEnabled && (
        <div
          className={[
            "pointer-events-auto absolute inset-0 z-20 bg-bg transition-transform duration-300",
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
