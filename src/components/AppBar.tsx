"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";

type Tab = {
  label: string;
  href: Route;
};

const TABS: Tab[] = [
  { label: "Projects", href: "/app/projects" as Route },
  { label: "Chat", href: "/app/chat" as Route },
  { label: "Home", href: "/app/home" as Route },
  { label: "Email", href: "/app/email" as Route },
  { label: "Calendar", href: "/app/calendar" as Route },
];

// Utility to clamp numbers
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AppBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState<number>(2); // default center on Home
  const trackRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const activeIndex = useMemo(() => {
    const idx = TABS.findIndex((t) => pathname?.startsWith(t.href));
    return idx >= 0 ? idx : 2; // default Home (center)
  }, [pathname]);

  // Keep focusedIndex in sync with route changes
  useEffect(() => {
    setFocusedIndex(activeIndex);
  }, [activeIndex]);

  // Update pill position based on button offset (no scrolling/tilt)
  useLayoutEffect(() => {
    const track = trackRef.current;
    const btn = buttonRefs.current[activeIndex];
    if (!track || !btn) return;
    setPill({ left: btn.offsetLeft - 4, width: btn.offsetWidth + 8 });
  }, [activeIndex]);

  // Keyboard navigation (Left/Right to move selector; Enter to activate)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!["ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) return;
      if (e.key === "ArrowLeft") {
        setFocusedIndex((i) => clamp(i - 1, 0, TABS.length - 1));
      } else if (e.key === "ArrowRight") {
        setFocusedIndex((i) => clamp(i + 1, 0, TABS.length - 1));
      } else if (e.key === "Enter") {
        const tab = TABS[focusedIndex];
        if (tab) router.push(tab.href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedIndex, router]);

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--panel-bg)] backdrop-blur supports-[backdrop-filter]:backdrop-saturate-125">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto,1fr,auto] items-center gap-4 px-4 py-2 md:px-6">
        {/* Brand */}
        <Link href={"/app/home" as Route} className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sol.svg" alt="ProjectSol" className="h-8 w-8 rounded-full shadow-hairline" />
        </Link>

        {/* Tabs Track */}
        <div
          ref={trackRef}
          className="relative mx-4 w-full max-w-2xl justify-self-center overflow-hidden rounded-full panel"
        >
          <div className="relative mx-auto flex items-center justify-center gap-2 px-2 py-1">
            {/* Underlay pill (CSS transition fallback) */}
            {pill.width > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
                style={{
                  left: pill.left,
                  width: pill.width,
                  transition:
                    "left 300ms cubic-bezier(0.22,1,0.36,1), width 300ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            )}

            {TABS.map((tab, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={tab.href}
                  ref={(el: HTMLButtonElement | null) => { buttonRefs.current[i] = el; }}
                  className={[
                    "relative z-10 rounded-full px-4 py-1.5 text-sm transition-colors",
                    active ? "text-text" : "text-text-dim hover:text-text",
                  ].join(" ")}
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onClick={() => router.push(tab.href)}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative">
                    {tab.label}
                    {active && (
                      <span className="absolute -bottom-2 left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Menu moved to top header */}
        <div />
      </div>
    </header>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    try {
      await fetch("/signout", { method: "POST" });
    } catch {}
    router.push("/signin" as Route);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-3 text-sm text-neutral-200 hover:bg-neutral-800"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-block h-5 w-5 rounded-full bg-neutral-800 ring-1 ring-neutral-700" />
        <span className="hidden sm:inline">Account</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[12rem] rounded-xl border border-neutral-900 bg-neutral-950 p-1 shadow-xl"
        >
          <Link
            href={"/app/settings" as Route}
            className="block rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-900"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// Hide native scrollbars for the tabs track on WebKit
// (Tailwind class 'no-scrollbar' is used on the track; add styles globally if desired)
