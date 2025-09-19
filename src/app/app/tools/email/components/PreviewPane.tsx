"use client";

import { useMemo } from "react";
import type { Thread } from "../types";
import {
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import { formatEmailHtml } from "@/lib/sanitize";

function IconButton({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
    >
      <Icon className="h-4 w-4 text-neutral-300" />
    </button>
  );
}

export default function PreviewPane({ thread }: { thread: Thread | null }) {
  if (!thread) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-neutral-900 px-4 py-3">
          <div className="text-sm font-medium text-neutral-300">No conversation selected</div>
          <div className="text-xs text-neutral-500">Choose a message to read</div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-sm text-neutral-400">Select an email to preview</div>
            <div className="text-xs text-neutral-600">The message content will appear here</div>
          </div>
        </div>
      </div>
    );
  }

  const d = new Date(thread.receivedAt);
  const when = d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const body = thread.messages[0]?.body || "";
  const html = useMemo(() => formatEmailHtml(body), [body]);

  return (
    <div className="flex h-full flex-col bg-neutral-950">
      {/* Header */}
      <div className="space-y-2 border-b border-neutral-900 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-neutral-200">{thread.subject}</div>
            <div className="truncate text-xs text-neutral-500">{when}</div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="Reply" icon={Reply} />
            <IconButton label="Reply all" icon={ReplyAll} />
            <IconButton label="Forward" icon={Forward} />
            <IconButton label="More" icon={MoreHorizontal} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-neutral-200">
            {thread.sender.initials ?? "S"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm text-neutral-300">{thread.sender.name}</div>
            <div className="truncate text-xs text-neutral-500">{thread.sender.email}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scroll-hover">
        <div
          className="text-sm leading-6 text-neutral-300 [&_a]:underline [&_a]:text-neutral-400 hover:[&_a]:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Attachments placeholder */}
        <div className="mt-6 rounded-xl border border-neutral-900 bg-neutral-950">
          <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2 text-sm text-neutral-300">
            <Paperclip className="h-4 w-4 text-neutral-400" />
            Attachments
          </div>
          <div className="px-3 py-6 text-center text-xs text-neutral-500">No attachments</div>
        </div>
      </div>
    </div>
  );
}
