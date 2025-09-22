"use client";

import React, { useEffect, useRef, useState } from "react";
import { useStreamedChat } from "@/hooks/useStreamedChat";
import {
  getMessages,
  saveMessages,
  appendMessage,
  updateLastAssistantMessage,
  genId,
  type StoredMessage,
} from "@/hooks/useChatStore";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

const INITIAL_GREETING =
  "Hey — I'm Sol. Ask me anything. I use a memory-first approach to help with real work.";

interface SolChatProps {
  title?: string;
  apiPath?: string;
  threadId?: string;
}

export default function SolChat({
  title = "Sol",
  apiPath = "/api/sol-chat",
  threadId,
}: SolChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { startStream } = useStreamedChat(apiPath);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const sc = scrollRef.current;
    if (sc) {
      sc.scrollTop = sc.scrollHeight;
    }
  }, [messages, loading]);

  // Load messages for a given thread
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
  }, [threadId]);

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

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[90%] whitespace-pre-wrap text-sm leading-relaxed rounded-2xl px-4 py-2",
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2 text-sm text-gray-600 bg-gray-100">
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-4 flex-shrink-0">
        <form onSubmit={sendMessage} className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={`Ask ${title}`}
              className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none min-h-[40px] max-h-[120px]"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
