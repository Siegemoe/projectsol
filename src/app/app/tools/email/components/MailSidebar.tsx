"use client";

import { Inbox, Pin, FileText, Send, Trash2, Archive, MoreHorizontal, NotebookText, Calendar, Settings, Home } from "lucide-react";
import type { Thread } from "../types";
import { useMemo } from "react";

type Folder = Thread["folder"];

type Props = {
  activeFolder: Folder;
  onChangeFolder: (f: Folder) => void;
  unreadCount: number;
  pinnedCount: number;
};

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  disabled?: boolean;
};

function Item({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-text"
          : "hover:bg-[color:var(--bg-elev-2)] text-text-dim hover:text-text",
        item.disabled ? "opacity-60 pointer-events-none" : ""
      )}
    >
      <Icon className="h-4 w-4 text-text-dim group-hover:text-text" />
      <span className="flex-1 text-left">{item.label}</span>
      {typeof item.count === "number" ? (
        <span className="ml-auto inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-[color:var(--bg-elev-2)] px-1.5 py-0.5 text-[10px] text-text-dim shadow-hairline">
          {item.count}
        </span>
      ) : null}
    </button>
  );
}

function isValidFolder(key: string): key is Folder {
  return (
    key === "inbox" ||
    key === "pinned" ||
    key === "drafts" ||
    key === "sent" ||
    key === "trash"
  );
}

export default function MailSidebar({ activeFolder, onChangeFolder, unreadCount, pinnedCount }: Props) {
  const top: NavItem[] = useMemo(
    () => [
      { key: "home", label: "Home Screen", icon: Home, disabled: true },
      { key: "inbox", label: "Inbox", icon: Inbox, count: unreadCount },
      { key: "pinned", label: "Pins", icon: Pin, count: pinnedCount },
      { key: "drafts", label: "Drafts", icon: FileText },
      { key: "sent", label: "Sent", icon: Send },
      { key: "trash", label: "Trash", icon: Trash2 },
    ],
    [unreadCount, pinnedCount]
  );

  const folders: NavItem[] = [
    { key: "archive", label: "Archive", icon: Archive, disabled: true },
    { key: "more", label: "More", icon: MoreHorizontal, disabled: true },
  ];

  const footer: { label: string; icon: React.ComponentType<{ className?: string }>; disabled?: boolean }[] = [
    { label: "Meeting Notes", icon: NotebookText, disabled: true },
    { label: "Calendar", icon: Calendar, disabled: true },
    { label: "Settings", icon: Settings, disabled: true },
  ];

  return (
    <aside className="hidden w-60 shrink-0 bg-bg-1 lg:flex lg:flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 scroll-hover">
        <section className="mb-5">
          <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Mail</div>
          <div className="space-y-1">
            {top.map((i) => (
              <Item
                key={i.key}
                item={i}
                active={i.key !== "home" && i.key === activeFolder}
                onClick={() => {
                  if (isValidFolder(i.key)) {
                    onChangeFolder(i.key);
                  }
                }}
              />
            ))}
          </div>
        </section>

        <section className="mb-5">
          <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Folders</div>
          <div className="space-y-1">
            {folders.map((i) => (
              <Item key={i.key} item={i} />
            ))}
          </div>
        </section>
      </div>

      <div className="px-2 py-3 bg-[color:var(--panel-bg)] backdrop-blur supports-[backdrop-filter]:backdrop-saturate-125">
        <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Shortcuts</div>
        <div className="space-y-1">
          {footer.map((f) => (
            <button
              key={f.label}
              disabled={f.disabled}
              className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-text-dim hover:bg-[color:var(--bg-elev-2)] hover:text-text disabled:opacity-60"
            >
              <f.icon className="h-4 w-4 text-text-dim group-hover:text-text" />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// Local utility (avoids adding dep)
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
