"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  ThreadMeta,
  getThreads,
  onThreadsChanged,
  createThread,
  deleteThread,
  getMessages,
} from "@/hooks/useChatStore";

type Props = {
  onSelect: (id: string | null) => void;
  activeId?: string | null;
};

function snippet(text: string, words = 10): string {
  if (!text) return "";
  const arr = text.trim().split(/\s+/);
  const s = arr.slice(0, words).join(" ");
  return arr.length > words ? `${s}…` : s;
}

export default function ThreadsSidebar({ onSelect, activeId }: Props) {
  const [threads, setThreads] = useState<ThreadMeta[]>([]);

  // Load + subscribe to changes
  useEffect(() => {
    setThreads(getThreads());
    const off = onThreadsChanged(() => setThreads(getThreads()));
    return off;
  }, []);

  // Auto-select the newest thread if none is selected
  useEffect(() => {
    if (!activeId && threads.length > 0) {
      onSelect(threads[0].id);
    }
  }, [threads, activeId, onSelect]);

  function remove(id: string) {
    deleteThread(id);
    if (activeId === id) onSelect(null);
  }

  function addThread() {
    const n = createThread("New Chat");
    onSelect(n.id);
  }

  return (
    <aside className="h-full w-72 bg-gray-50 border-r flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
        <button
          type="button"
          title="New chat"
          onClick={addThread}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No threads yet</div>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => {
              const active = t.id === activeId;
              const msgs = getMessages(t.id);
              const lastMsg = msgs[msgs.length - 1];
              const lastText = lastMsg ? `${lastMsg.role === "user" ? "You" : "Sol"}: ${snippet(lastMsg.content)}` : "Empty";
              
              return (
                <li key={t.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(t.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelect(t.id)}
                    className={[
                      "group flex cursor-pointer items-start justify-between rounded-lg p-3 border transition-colors",
                      active
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="truncate text-sm font-medium text-gray-900">{t.title}</div>
                      <div className="truncate text-xs text-gray-500 mt-1">{lastText}</div>
                    </div>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(t.id);
                      }}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
