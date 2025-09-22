"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Star, Archive, Trash2, Plus } from "lucide-react";
import {
  ThreadMeta,
  getThreads,
  onThreadsChanged,
  createThread,
  updateThread,
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
  const [filter, setFilter] = useState<"all" | "starred" | "archived">("all");

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

  const list = useMemo(() => {
    let v = threads;
    if (filter === "starred") v = v.filter((t) => t.starred);
    if (filter === "archived") v = v.filter((t) => t.archived);
    return v;
  }, [threads, filter]);

  // Backfill lastPreview for legacy threads (without lastPreview) once
  useEffect(() => {
    const missing = threads.filter((t) => typeof t.lastPreview === "undefined");
    if (missing.length === 0) return;
    missing.forEach((t) => {
      const msgs = getMessages(t.id);
      const last = msgs[msgs.length - 1];
      const preview = last ? `${last.role === "user" ? "You" : "Sol"}: ${snippet(last.content)}` : "";
      updateThread(t.id, { lastPreview: preview });
    });
  }, [threads]);

  function toggleStar(id: string) {
    const t = threads.find((x) => x.id === id);
    updateThread(id, { starred: !t?.starred });
  }
  function toggleArchive(id: string) {
    const t = threads.find((x) => x.id === id);
    updateThread(id, { archived: !t?.archived });
  }
  function remove(id: string) {
    deleteThread(id);
    if (activeId === id) onSelect(null);
  }
  function addThread() {
    const n = createThread("New Chat");
    onSelect(n.id);
  }

  return (
    <aside className="panel rounded-none h-full min-w-[18rem] w-[18rem] shrink-0 flex flex-col bg-[color:var(--bg-elev-2)] z-30 text-[13px]">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm font-medium text-text">Chat History</div>
        <button
          type="button"
          title="New chat"
          onClick={addThread}
          className="inline-flex items-center gap-1 rounded-md bg-[color:var(--bg-elev-2)] px-2 py-1 text-sm text-text shadow-hairline"
        >
          <Plus className="h-4 w-4 text-neutral-300" />
          <span>New chat</span>
        </button>
      </div>
      <div className="flex items-center gap-2 p-2 text-xs">
        <button
          className={btn(filter === "all")}
          onClick={() => setFilter("all")}
          type="button"
        >
          All
        </button>
        <button
          className={btn(filter === "starred")}
          onClick={() => setFilter("starred")}
          type="button"
        >
          Starred
        </button>
        <button
          className={btn(filter === "archived")}
          onClick={() => setFilter("archived")}
          type="button"
        >
          Archived
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 scroll-hover">
        {list.length === 0 ? (
          <div className="p-3 text-center text-xs text-neutral-500">No threads yet</div>
        ) : (
          <ul className="space-y-1">
            {list.map((t) => {
              const active = t.id === activeId;
              const lastText = t.lastPreview ?? "";
              return (
                <li key={t.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(t.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelect(t.id)}
                    className={[
                      "group flex cursor-pointer items-start justify-between rounded-lg px-2 py-2 shadow-hairline",
                      active
                        ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-text"
                        : "bg-[color:var(--bg-elev-2)] text-text-dim hover:text-text",
                    ].join(" ")}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate text-sm text-text">{t.title}</div>
                      <div className="truncate text-xs text-text-dim">{lastText || "Empty"}</div>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <button
                        type="button"
                        title="Star"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(t.id);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
                      >
                        <Star className={`h-3.5 w-3.5 ${t.starred ? "text-[var(--accent)]" : "text-neutral-400"}`} />
                      </button>
                      <button
                        type="button"
                        title="Archive"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleArchive(t.id);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
                      >
                        <Archive className={`h-3.5 w-3.5 ${t.archived ? "text-[var(--accent)]" : "text-neutral-400"}`} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(t.id);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-neutral-400" />
                      </button>
                    </div>
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

function btn(active: boolean) {
  return [
    "rounded-md px-2 py-1",
    active
      ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-text"
      : "bg-[color:var(--bg-elev-2)] text-text-dim hover:text-text shadow-hairline",
  ].join(" ");
}
