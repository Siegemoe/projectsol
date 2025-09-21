"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type Role = "user" | "assistant";

export type TimelineItem = {
  index: number; // absolute index into the full message list
  role: Role;
  preview: string; // short text snippet
};

type Props = {
  items: TimelineItem[]; // full list (we will page to 14 per view)
  page: number;
  onPageChange: (next: number) => void;
  onJumpTo: (absoluteIndex: number) => void;
  topOffset?: number; // px from top when fixed
  rightOffset?: number; // px from right when fixed
  bottomOffset?: number; // px from bottom to clear composer
};

const PAGE_SIZE = 14;

export default function TimelineRail({ items, page, onPageChange, onJumpTo, topOffset = 72, rightOffset = 16, bottomOffset = 96 }: Props) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(0, page), totalPages - 1);

  const start = clampedPage * PAGE_SIZE;
  const end = Math.min(items.length, start + PAGE_SIZE);
  const view = items.slice(start, end);

  function go(delta: number) {
    const next = Math.min(Math.max(0, clampedPage + delta), totalPages - 1);
    if (next !== clampedPage) onPageChange(next);
  }

  return (
    <div
      className="hidden md:flex fixed w-10 items-center justify-center pointer-events-none z-30"
      style={{ top: topOffset, bottom: bottomOffset, right: rightOffset }}
      aria-hidden={items.length === 0}
    >
      <div className="pointer-events-auto flex h-full w-8 flex-col items-center justify-between rounded-full bg-[color:var(--bg-elev-2)] shadow-hairline py-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={clampedPage === 0}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text disabled:opacity-40 hover:bg-[color:var(--bg)] transition-colors"
          title="Earlier"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <ul className="flex-1 w-full overflow-hidden px-3 py-2 gap-2 flex flex-col items-center">
          {view.map((t) => {
            const color =
              t.role === "user"
                ? "bg-[color:var(--accent)] shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
                : "bg-[color:var(--hairline)]";
            return (
              <li key={t.index} className="relative">
                <button
                  type="button"
                  onClick={() => onJumpTo(t.index)}
                  className={["group peer inline-flex h-2 w-2 items-center justify-center rounded-full transition-all hover:scale-110", color].join(" ")}
                  title={t.preview}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none text-[10px] text-text-dim opacity-0 group-hover:opacity-90 transition-opacity whitespace-nowrap max-w-32 overflow-hidden text-ellipsis">
                  {t.preview}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={clampedPage >= totalPages - 1}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text disabled:opacity-40 hover:bg-[color:var(--bg)] transition-colors"
          title="Later"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
