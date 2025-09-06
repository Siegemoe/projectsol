"use client";

import { Star, StarOff, CircleDot, ChevronRight } from "lucide-react";
import type { Thread, ThreadSection } from "../types";
import { Fragment } from "react";

export default function ThreadList({
  sections,
  selectedId,
  onSelect,
  onToggleUnread,
  onTogglePinned,
}: {
  sections: ThreadSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleUnread: (id: string) => void;
  onTogglePinned: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Fragment key={section.title}>
          <SectionHeader title={section.title} />

          {/* Optional pinned group row (if any thread is pinned in this section) */}
          {section.title === "Today" &&
          section.threads.some((t) => t.pinned && (t.labels?.length ?? 0) > 0) ? (
            <PinnedRow thread={section.threads.find((t) => t.pinned)!} />
          ) : null}

          <div className="divide-y divide-neutral-900 rounded-xl border border-neutral-900 bg-neutral-950/60">
            {section.threads
              .filter((t) => !t.pinned) // hide the special pinned-group placeholder row from main list
              .map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  selected={selectedId === thread.id}
                  onClick={() => onSelect(thread.id)}
                  onToggleUnread={() => onToggleUnread(thread.id)}
                  onTogglePinned={() => onTogglePinned(thread.id)}
                />
              ))}
            {section.threads.filter((t) => !t.pinned).length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-500">No messages</div>
            ) : null}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-2 pb-2 pt-3 sm:px-1">
      <div className="text-sm font-medium text-neutral-300">{title}</div>
      {/* Right-side subtle controls placeholder */}
      <div className="text-xs text-neutral-600"> </div>
    </div>
  );
}

function PinnedRow({ thread }: { thread: Thread }) {
  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950">
      <div className="flex items-center gap-2 bg-white/5 px-3 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900">
          <Star className="h-3.5 w-3.5 text-yellow-400" />
        </div>
        <div className="text-sm text-neutral-300">Pinned</div>
      </div>
      <div className="flex flex-wrap gap-2 px-3 py-2">
        {(thread.labels ?? []).map((label) => (
          <span
            key={label}
            className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  selected,
  onClick,
  onToggleUnread,
  onTogglePinned,
}: {
  thread: Thread;
  selected?: boolean;
  onClick: () => void;
  onToggleUnread: () => void;
  onTogglePinned: () => void;
}) {
  const d = new Date(thread.receivedAt);
  const time =
    isToday(d)
      ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div
      role="button"
      aria-pressed={!!selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={[
        "group flex w-full items-start gap-3 px-3 py-2 text-left transition",
        selected ? "bg-white/10" : "hover:bg-neutral-900/60",
      ].join(" ")}
    >
      {/* caret / collapse indicator (decorative) */}
      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-neutral-500">
        <ChevronRight className="h-3.5 w-3.5" />
      </div>

      {/* unread dot / avatar substitute */}
      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
        {thread.unread ? (
          <CircleDot className="h-3.5 w-3.5 text-blue-400" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
        )}
      </div>

      {/* Sender + subject/snippet */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm text-neutral-200">{thread.sender.name}</div>
          {thread.labels && thread.labels.length > 0 ? (
            <div className="hidden flex-wrap gap-1 md:flex">
              {thread.labels.slice(0, 3).map((l) => (
                <span
                  key={l}
                  className="truncate rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300"
                >
                  {l}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="truncate text-sm text-neutral-300">{thread.subject}</div>
        <div className="truncate text-xs text-neutral-500">{thread.snippet}</div>
      </div>

      {/* Right meta/actions */}
      <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
        <div className="text-xs text-neutral-500">{time}</div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            aria-label={thread.unread ? "Mark as read" : "Mark as unread"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleUnread();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
          >
            {thread.unread ? (
              <CircleDot className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
            )}
          </button>
          <button
            type="button"
            aria-label={thread.pinned ? "Unpin" : "Pin"}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinned();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
          >
            {thread.pinned ? (
              <Star className="h-3.5 w-3.5 text-yellow-400" />
            ) : (
              <StarOff className="h-3.5 w-3.5 text-neutral-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function isToday(d: Date) {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
