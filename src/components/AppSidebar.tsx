"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Route } from "next";
import {
  MessageSquarePlus,
  Search,
  BookText,
  Mail,
  Bot,
  Workflow,
  FolderPlus,
  Settings,
  LogOut,
  User2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  label: string;
  href?: Route;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
};

function Item({
  item,
  active,
}: {
  item: NavItem;
  active?: boolean;
}) {
  const Icon = item.icon;
  const className = [
    "group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
    active ? "bg-white/10 text-neutral-100" : "hover:bg-neutral-900 text-neutral-300",
    item.disabled ? "opacity-60 pointer-events-none" : "",
  ].join(" ");

  if (item.href) {
    return (
      <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
        {Icon ? <Icon className="h-4 w-4 text-neutral-400 group-hover:text-neutral-300" /> : null}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <button className={className} type="button" onClick={item.onClick}>
      {Icon ? <Icon className="h-4 w-4 text-neutral-400 group-hover:text-neutral-300" /> : null}
      <span>{item.label}</span>
    </button>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  const MODEL_KEY = "app:model";
  const [model, setModel] = useState<string>("sol-default");
  const COLLAPSE_KEY = "app:sidebarCollapsed";
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_KEY);
      if (saved) setModel(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODEL_KEY, model);
    } catch {}
  }, [model]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSE_KEY);
      if (v != null) setCollapsed(v === "1");
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  const top: NavItem[] = [
    { label: "New chat", href: "/app/chat" as Route, icon: MessageSquarePlus },
    { label: "Search chats", href: "/app/search" as Route, icon: Search },
    { label: "Library", href: "/app/library" as Route, icon: BookText },
  ];

  const tools: NavItem[] = [
    { label: "Email", href: "/app/tools/email" as Route, icon: Mail },
    { label: "Cline", href: "/app/tools/cline" as Route, icon: Bot },
    { label: "n8n", href: "/app/tools/n8n" as Route, icon: Workflow },
  ];

  const projects: NavItem[] = [
    { label: "New project", href: "/app/projects/new" as Route, icon: FolderPlus },
  ];

  const footerActions: NavItem[] = [
    { label: "Settings", href: "/app/settings" as Route, icon: Settings },
    { label: "Sign out", href: "/signout" as Route, icon: LogOut },
  ];

  function isActive(href?: string) {
    if (!href) return false;
    if (href === "/app/chat" && pathname?.startsWith("/app/chat")) return true;
    return pathname === href;
  }

  return (
    <aside className={`flex h-full ${collapsed ? "w-12" : "w-72"} flex-col bg-neutral-950`}>
      {/* Sticky brand/section */}
      <div className="sticky top-0 z-10 border-b border-neutral-900 bg-neutral-950/70 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/40">
        <div className="relative h-7 flex items-center justify-between">
          {!collapsed && (
            <div className="px-2 text-xs uppercase tracking-wide text-neutral-500">PROJECTSOL</div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute right-0 top-1/2 -translate-y-1/2 -right-3 z-20 inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800 shadow"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-neutral-300" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-neutral-300" />
            )}
          </button>
        </div>
        {!collapsed && (
          <div className="mt-2">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-neutral-500">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1 text-xs text-neutral-300 outline-none focus:outline-none"
            >
              <option value="sol-default">Sol default</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="claude-3.5-sonnet">claude-3.5-sonnet</option>
            </select>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className={`flex-1 space-y-6 overflow-y-auto px-2 py-4 scroll-hover ${collapsed ? "hidden" : ""}`}>
          <section>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Top</div>
            <div className="space-y-1">
              {top.map((item) => (
                <Item key={item.label} item={item} active={isActive(item.href)} />
              ))}
            </div>
          </section>

          <section>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Tools</div>
            <div className="space-y-1">
              {tools.map((item) => (
                <Item key={item.label} item={item} active={isActive(item.href)} />
              ))}
            </div>
          </section>

          <section>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Projects</div>
            <div className="space-y-1">
              {projects.map((item) => (
                <Item key={item.label} item={item} active={isActive(item.href)} />
              ))}
            </div>
          </section>

          <section>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Chats</div>
            <div className="px-2 text-xs text-neutral-500">No chats yet</div>
          </section>

          <section>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-neutral-500">Account</div>
            <div className="space-y-1">
              {footerActions.map((item) => (
                <Item key={item.label} item={item} active={isActive(item.href)} />
              ))}
            </div>
          </section>
        </nav>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t border-neutral-900 bg-neutral-950 px-3 py-3 ${collapsed ? "hidden" : ""}`}>
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-neutral-950 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900">
              <User2 className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-neutral-200">Profile</div>
              <div className="text-xs text-neutral-500">Signed in</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
