"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
  User2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Pin,
  FileText,
  Send,
  Trash2,
  NotebookText,
  Calendar,
} from "lucide-react";

type NavItem = {
  label: string;
  href?: Route;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
};

type UserInfo = {
  name: string;
  email: string | null;
  avatarUrl: string | null;
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

function SubItem({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "group flex w-full items-center gap-2 rounded-lg pl-8 pr-2 py-2 text-sm transition",
        "text-neutral-300 hover:bg-neutral-900",
        disabled ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
    >
      {Icon ? <Icon className="h-4 w-4 text-neutral-400 group-hover:text-neutral-300" /> : null}
      <span>{label}</span>
    </button>
  );
}

export default function AppSidebar({ initialUser }: { initialUser?: UserInfo }) {
  const router = useRouter();
  const pathname = usePathname();

  const MODEL_KEY = "app:model";
  const [model, setModel] = useState<string>("sol-default");
  const COLLAPSE_KEY = "app:sidebarCollapsed";
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Expand/collapse Email submenu
  const [emailExpanded, setEmailExpanded] = useState<boolean>(false);

  // Profile dropdown state
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const footerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_KEY);
      if (saved) {
        setModel(saved);
      } else {
        // Default to a commonly available OpenRouter model
        setModel("deepseek/deepseek-chat");
      }
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

  // Keep Email submenu expansion in sync with overlay open/close
  useEffect(() => {
    const handler = (e: Event) => {
      const open = !!(e as CustomEvent<{ open?: boolean }>).detail?.open;
      setEmailExpanded(!!open);
    };
    window.addEventListener("sol:email-open-changed", handler as EventListener);
    return () =>
      window.removeEventListener("sol:email-open-changed", handler as EventListener);
  }, []);

  // Collapse Email folder list when not on chat route
  useEffect(() => {
    if (!pathname?.startsWith("/app/chat")) setEmailExpanded(false);
  }, [pathname]);

  // Close profile menu on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return;
      const target = e.target as HTMLElement | null;
      if (footerRef.current && target && !footerRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const top: NavItem[] = [
    { label: "New chat", href: "/app/chat" as Route, icon: MessageSquarePlus },
    { label: "Search chats", href: "/app/search" as Route, icon: Search },
    { label: "Library", href: "/app/library" as Route, icon: BookText },
  ];

  // Helper: open Email overlay inside chat
  function openEmail(folder?: "inbox" | "pinned" | "drafts" | "sent" | "trash") {
    // Validate folder against allowed set. Only include in query when valid.
    const allowed = new Set<"inbox" | "pinned" | "drafts" | "sent" | "trash">(["inbox", "pinned", "drafts", "sent", "trash"]);
    const safeFolder = folder && allowed.has(folder) ? folder : undefined;

    const inChat = pathname?.startsWith("/app/chat");
    if (!inChat) {
      // Navigate to chat with query to trigger email open
      const baseParams: Record<string, string> = { email: "1" };
      if (safeFolder) baseParams.folder = safeFolder;
      const qs = new URLSearchParams(baseParams).toString();
      router.push(("/app/chat" + (qs ? `?${qs}` : "")) as Route);
      return;
    }

    try {
      // Use a safe default for the overlay dispatch
      const dispatchFolder = safeFolder ?? "inbox";
      window.dispatchEvent(
        new CustomEvent("sol:open-email", {
          detail: { open: true, folder: dispatchFolder },
        } as any)
      );
    } catch (err) {
      console.error("AppSidebar: Failed to dispatch 'sol:open-email' event", err);
      // Fallback: attempt navigation with minimal query so the Email UI can open
      try {
        const baseParams: Record<string, string> = { email: "1" };
        if (safeFolder) baseParams.folder = safeFolder;
        const qs = new URLSearchParams(baseParams).toString();
        router.push(("/app/chat" + (qs ? `?${qs}` : "")) as Route);
      } catch (navErr) {
        console.error("AppSidebar: Fallback navigation failed", navErr);
        if (typeof window !== "undefined") {
          alert("Unable to open Email right now. Please try again.");
        }
      }
    }
  }

  const projects: NavItem[] = [
    { label: "New project", href: "/app/projects/new" as Route, icon: FolderPlus },
  ];

  const footerActions: NavItem[] = [
    { label: "Settings", href: "/app/settings" as Route, icon: Settings },
    // Removed GET link to /signout; sign-out is handled via POST in the profile menu below.
  ];

  function isActive(href?: string) {
    if (!href) return false;
    if (href === "/app/chat" && pathname?.startsWith("/app/chat")) return true;
    return pathname === href;
  }

  const initials = useMemo(() => {
    const n = initialUser?.name?.trim() || "";
    if (!n) return "";
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || "";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [initialUser?.name]);

  async function handleSignOut() {
    try {
      setMenuOpen(false);
      await fetch("/signout", { method: "POST" });
    } catch {
      // ignore fetch errors; rely on hard navigation below
    }
    if (typeof window !== "undefined") {
      window.location.assign("/signin");
    }
  }

  return (
    <aside className={`flex h-full ${collapsed ? "w-12" : "w-[13.5rem]"} flex-col bg-neutral-950`}>
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
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800 shadow"
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
              <option value="deepseek/deepseek-chat">DeepSeek v3.1</option>
              <option value="openai/gpt-5">GPT-5</option>
              <option value="openai/gpt-5-mini">GPT-5 Mini</option>
              <option value="openai/gpt-oss-120b">GPT-OSS-120b</option>
              <option value="openai/gpt-oss-120b (free)">GPT-OSS-120b (free)</option>
              <option value="@preset/sol">Preset: Sol</option>
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
              {/* Email group (opens inside chat) */}
              <Item
                item={{
                  label: "Email",
                  icon: Mail,
                  onClick: () => {
                    setEmailExpanded(true);
                    openEmail("inbox");
                  },
                }}
                active={pathname?.startsWith("/app/chat")}
              />
              {emailExpanded && (
                <div className="space-y-1">
                  <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wide text-neutral-500">Folders</div>
                  <SubItem label="Inbox" icon={Inbox} onClick={() => openEmail("inbox")} />
                  <SubItem label="Pins" icon={Pin} onClick={() => openEmail("pinned")} />
                  <SubItem label="Drafts" icon={FileText} onClick={() => openEmail("drafts")} />
                  <SubItem label="Sent" icon={Send} onClick={() => openEmail("sent")} />
                  <SubItem label="Trash" icon={Trash2} onClick={() => openEmail("trash")} />

                  <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wide text-neutral-500">Shortcuts</div>
                  <SubItem label="Meeting Notes" icon={NotebookText} disabled />
                  <SubItem label="Calendar" icon={Calendar} disabled />
                  <SubItem label="Settings" disabled />
                </div>
              )}

              {/* Other tools still navigate to their routes */}
              <Item item={{ label: "Cline", href: "/app/tools/cline" as Route, icon: Bot }} active={pathname === "/app/tools/cline"} />
              <Item item={{ label: "n8n", href: "/app/tools/n8n" as Route, icon: Workflow }} active={pathname === "/app/tools/n8n"} />
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
          <div
            ref={footerRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                if (!initialUser) {
                  try {
                    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : (pathname ?? "/app");
                    router.push((`/signin?next=${encodeURIComponent(next)}`) as Route);
                  } catch {
                    router.push(("/signin" as Route));
                  }
                  return;
                }
                setMenuOpen((v) => !v);
              }}
              className="mb-2 flex w-full items-center gap-2 rounded-xl bg-neutral-950 px-3 py-2 hover:bg-neutral-900"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 overflow-hidden">
                {initialUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={initialUser.avatarUrl}
                    alt={initialUser.name || "Profile"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : initials ? (
                  <span className="text-[11px] font-medium text-neutral-300">{initials}</span>
                ) : (
                  <User2 className="h-4 w-4 text-neutral-400" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm text-neutral-200 truncate">
                  {initialUser?.name ?? "Profile"}
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  {initialUser?.email ?? "Signed out"}
                </div>
              </div>
            </button>

            {menuOpen && initialUser && (
              <div
                role="menu"
                className="absolute bottom-12 right-0 z-30 min-w-[12rem] rounded-xl border border-neutral-900 bg-neutral-950 shadow"
              >
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900 rounded-lg"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
