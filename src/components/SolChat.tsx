"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
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
  emailToolEnabled?: boolean;
  uiVariant?: "chatApp" | "default";
  threadId?: string;
}

export default function SolChat({
  title = "Sol",
  apiPath = "/api/sol-chat",
  emailToolEnabled = true,
  uiVariant = "default",
  threadId,
}: SolChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Email overlay state (used only if emailToolEnabled)
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailFolder, setEmailFolder] = useState<Folder>("inbox");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { startStream } = useStreamedChat(apiPath);
  const [timelinePage, setTimelinePage] = useState(0);

  // Positioning for right-side rail and composer portal alignment
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [railOffset, setRailOffset] = useState<{ top: number; right: number; bottom: number }>({
    top: 72,
    right: 16,
    bottom: 96,
  });
  const [composerBox, setComposerBox] = useState<{ left: number; width: number; bottom: number }>({
    left: 0,
    width: 0,
    bottom: 0,
  });
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPad, setScrollPad] = useState(128);
  const [mounted, setMounted] = useState(false);
  const [pinnedToBottom, setPinnedToBottom] = useState(true);
  const autoStickNextRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Keep messages scrolled to bottom when they change (only if user is pinned or after sending)
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;

    const nearBottom = sc.scrollHeight - (sc.scrollTop + sc.clientHeight) < 48;
    const shouldStick = autoStickNextRef.current || pinnedToBottom || nearBottom;

    if (shouldStick) {
      sc.scrollTop = sc.scrollHeight;
      autoStickNextRef.current = false;
      setPinnedToBottom(true);
    }
  }, [messages, loading, pinnedToBottom]);

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
        const rawFolder = (url.searchParams.get("folder") || "").toLowerCase();
        const allowedFolders: Folder[] = ["inbox", "pinned", "drafts", "sent", "trash"];
        if (rawFolder && allowedFolders.includes(rawFolder as Folder)) {
          setEmailFolder(rawFolder as Folder);
        }
        setEmailOpen(true);
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

  // Broadcast overlay open/close state
  useEffect(() => {
    if (!emailToolEnabled) return;
    try {
      window.dispatchEvent(
        new CustomEvent("sol:email-open-changed", { detail: { open: emailOpen } } as any)
      );
    } catch {}
  }, [emailOpen, emailToolEnabled]);

  // Measure chat column to align rail and composer portal
  useEffect(() => {
    function measure() {
      const el = rootRef.current;
      let top = 72;
      let right = 16;

      if (el) {
        const rect = el.getBoundingClientRect();
        top = Math.max(56, Math.round(rect.top) + 8);
        setComposerBox({
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          bottom: 0,
        });
      }
      right = 12;
      const h = composerRef.current ? composerRef.current.offsetHeight : 96;
      setScrollPad(h + 8);
      setRailOffset({ top, right, bottom: h + 8 });
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true } as any);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure as any);
    };
  }, []);

  // Observe composer height changes to adjust bottom padding and rail offset
  useEffect(() => {
    if (!mounted) return;
    const el = composerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      setScrollPad(h + 8);
      setRailOffset((prev) => ({ ...prev, bottom: h + 8 }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

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

    const model =
      (typeof window !== "undefined" && localStorage.getItem("app:model")) ||
      "deepseek/deepseek-chat";
    const temperature = 0.3;
    const system: string | undefined = undefined;

    autoStickNextRef.current = true;
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
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => {
        const sc = scrollRef.current;
        if (!sc) return;
        // If wheel happens outside the scroller, forward it to the scroller
        if (!sc.contains(e.target as Node)) {
          sc.scrollBy({ top: e.deltaY, behavior: "auto" });
          e.preventDefault();
        }
      }}
    >
      {/* Scrollable messages area (extra bottom padding so fixed composer won't overlap) */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const sc = e.currentTarget;
          const atBottom = sc.scrollHeight - (sc.scrollTop + sc.clientHeight) < 48;
          setPinnedToBottom(atBottom);
        }}
        className="flex-1 min-h-0 overflow-y-scroll overscroll-auto touch-pan-y pl-3 pr-8 md:pr-14 pt-4 chat-scroll [scrollbar-gutter:stable]"
        style={{ paddingBottom: scrollPad }}
      >
        <div className="mx-auto flex max-w-[720px] lg:max-w-[860px] xl:max-w-[960px] 2xl:max-w-[1100px] flex-col gap-3">
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
                      : "rounded-2xl px-3 py-2 bg-[color:var(--bg-elev-2)] text-text",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3 py-2 text-sm text-text bg-[color:var(--bg-elev-2)]">
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer rendered via portal to hug viewport bottom and align with chat column */}
      {mounted
        ? createPortal(
            <div
              ref={composerRef}
              className="bg-[color:var(--panel-bg)] px-3 py-3 backdrop-blur supports-[backdrop-filter]:backdrop-saturate-125 z-50"
              style={{
                position: "fixed",
                left: composerBox.left,
                width: composerBox.width,
                bottom: 0,
              }}
            >
              <form onSubmit={sendMessage} className="mx-auto max-w-[720px] lg:max-w-[860px] xl:max-w-[960px] 2xl:max-w-[1100px]">
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
            </div>,
            document.body
          )
        : null}

      {/* Jump to latest button (fixed, aligned to chat column) */}
      {mounted && uiVariant === "chatApp" && !pinnedToBottom
        ? createPortal(
            <div
              className="z-50"
              style={{
                position: "fixed",
                left: composerBox.left + composerBox.width - 160,
                bottom: (railOffset.bottom || 88) + 56,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const sc = scrollRef.current;
                  if (sc) {
                    sc.scrollTop = sc.scrollHeight;
                    setPinnedToBottom(true);
                  }
                }}
                className="rounded-full px-3 py-1.5 text-xs bg-[color:var(--bg-elev-2)] text-text shadow-hairline hover:bg-[color:var(--bg)] transition"
              >
                Jump to latest
              </button>
            </div>,
            document.body
          )
        : null}

      {/* Bottom fade overlay under composer */}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none z-40 bg-gradient-to-b from-transparent to-[color:var(--panel-bg)] opacity-95"
              style={{
                position: "fixed",
                left: composerBox.left,
                width: composerBox.width,
                bottom: railOffset.bottom,
                height: 64,
              }}
            />,
            document.body
          )
        : null}

      {/* Right-side timeline rail rendered in a portal */}
      {mounted
        ? createPortal(
            <TimelineRail
              items={timelineItems}
              page={timelinePage}
              onPageChange={setTimelinePage}
              onJumpTo={jumpTo}
              topOffset={railOffset.top}
              rightOffset={railOffset.right}
              bottomOffset={railOffset.bottom}
            />,
            document.body
          )
        : null}

      {/* Email overlay panel (slides in from the left) */}
      {emailToolEnabled && (
        <div
          className={[
            "absolute inset-0 z-20 bg-bg transition-transform duration-300",
            emailOpen ? "pointer-events-auto translate-x-0 ease-out" : "pointer-events-none -translate-x-full ease-in",
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
