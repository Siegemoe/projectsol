"use client";

import React, { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";

type UserInfo = {
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export default function AppShell({
  initialUser,
  children,
}: {
  initialUser?: UserInfo;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent page scroll when drawer is open (just in case)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative h-full w-full">
      {/* Global menu toggle button (top-left) */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="absolute left-2 top-2 z-30 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text hover:shadow-glow shadow-hairline"
      >
        {/* simple hamburger */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Main content */}
      <div className="h-full w-full">{children}</div>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[18rem] max-w-[85vw] bg-bg-1 shadow-hairline transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        {/* Close hotspot when expanded on small screens */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute -right-10 top-3 hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text hover:shadow-glow shadow-hairline"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <AppSidebar initialUser={initialUser} />
      </aside>
    </div>
  );
}
