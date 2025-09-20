"use client";

import React, { useMemo, useState } from "react";
import { Star, Archive, Trash2, Plus } from "lucide-react";

export type ThreadMeta = {
  id: string;
  title: string;
  lastMessage: string;
  starred?: boolean;
  archived?: boolean;
};

type Props = {
  onSelect: (id: string) => void;
  activeId?: string | null;
};

const seed: ThreadMeta[] = [
  { id: "t1", title: "Project Alpha", lastMessage: "Kickoff notes", starred: true },
  { id: "t2", title: "Marketing Plan", lastMessage: "Budget draft" },
  { id: "t3", title: "Support - Lucas", lastMessage: "Issue #4831" },
  { id: "t4", title: "General", lastMessage: "Random thoughts" },
];

export default function ThreadsSidebar({ onSelect, activeId }: Props) {
  const [threads, setThreads] = useState<ThreadMeta[]>(seed);
  const [filter, setFilter] = useState<"all" | "starred" | "archived">("all");

  const list = useMemo(() => {
    let v = threads;
    if (filter === "starred") v = v.filter((t) => t.starred);
    if (filter === "archived") v = v.filter((t) => t.archived);
    return v;
  }, [threads, filter]);

  function toggleStar(id: string) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)));
  }
  function toggleArchive(id: string) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, archived: !t.archived } : t)));
  }
  function remove(id: string) {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }
  function addThread() {
    const n = {
      id: `t${Date.now()}`,
      title: "New Chat",
      lastMessage: "Start a conversation…",
    };
    setThreads((prev) => [n, ...prev]);
    onSelect(n.id);
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-900 bg-neutral-950/60">
      <div className="flex items-center justify-between border-b border-neutral-900 px-3 py-2">
        <div className="text-sm font-medium text-neutral-300">Threads</div>
        <button
          type="button"
          title="New chat"
          onClick={addThread}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4 text-neutral-300" />
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

      <div className="min-h-0 flex-1 overflow-y-auto p-2 scroll-hover">
        {list.length === 0 ? (
          <div className="p-3 text-center text-xs text-neutral-500">No threads</div>
        ) : (
          <ul className="space-y-1">
            {list.map((t) => {
              const active = t.id === activeId;
              return (
                <li key={t.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(t.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelect(t.id)}
                    className={[
                      "group flex cursor-pointer items-start justify-between rounded-lg border px-2 py-2",
                      active
                        ? "border-neutral-800 bg-neutral-900"
                        : "border-neutral-900 bg-neutral-900/40 hover:bg-neutral-900/60",
                    ].join(" ")}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate text-sm text-neutral-200">{t.title}</div>
                      <div className="truncate text-xs text-neutral-500">{t.lastMessage}</div>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <button
                        type="button"
                        title="Star"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(t.id);
                        }}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
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
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
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
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
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
    "rounded-md border px-2 py-1",
    active
      ? "border-neutral-800 bg-neutral-900 text-neutral-200"
      : "border-neutral-900 bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200",
  ].join(" ");
}
