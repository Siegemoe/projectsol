"use client";

import { useMemo, useRef, useEffect } from "react";
import type { Thread, ThreadMessage } from "../types";
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

function SafeHtml({
  html,
  message,
}: {
  html: string;
  message: ThreadMessage;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              /* Basic dark theme styles */
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                background-color: #171717; /* neutral-900 */
                color: #d4d4d4; /* neutral-300 */
                padding: 0.5rem;
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
              }
              a { color: #a3a3a3; text-decoration: underline; }
              a:hover { color: #e5e5e5; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `);
      iframe.contentWindow.document.close();
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin" // allows styles, blocks scripts
      className="h-full w-full border-0"
      title={`Email from ${message.author.email}`}
      scrolling="auto"
    />
  );
}

export default function PreviewPane({ thread }: { thread: Thread | null }) {
  const message = thread?.messages?.[0];
  const body = message?.body ?? "";
  const bodyHtml = message?.bodyHtml ?? null;
  const formattedText = useMemo(() => formatEmailHtml(body), [body]);

  if (!thread || !message) {
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
      <div className="min-h-0 flex-1 overflow-hidden">
        {bodyHtml ? (
          <SafeHtml html={bodyHtml} message={message} />
        ) : (
          <div className="overflow-y-auto px-4 py-4 scroll-hover">
            <div
              className="text-sm leading-6 text-neutral-300 [&_a]:underline [&_a]:text-neutral-400 hover:[&_a]:text-neutral-300"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          </div>
        )}
      </div>

      {/* Attachments placeholder */}
      <div className="border-t border-neutral-900 bg-neutral-950">
        <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2 text-sm text-neutral-300">
          <Paperclip className="h-4 w-4 text-neutral-400" />
          Attachments
        </div>
        <div className="px-3 py-6 text-center text-xs text-neutral-500">No attachments</div>
      </div>
    </div>
  );
}
