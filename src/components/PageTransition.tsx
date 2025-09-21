"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Simple page enter transition that slides based on nav order.
 * This avoids extra deps (e.g., Framer Motion) and stays borderless/minimal.
 *
 * Note: This animates the entering page. Exit is implicit (no cross-fade),
 * which still feels intentional/minimal per the design goal.
 */
const NAV_ORDER = [
  "/app/projects",
  "/app/chat",
  "/app/home",
  "/app/email",
  "/app/calendar",
  "/app/library",
  "/app/search",
  "/app/tools",
  "/app/settings",
];

function indexFor(path: string) {
  const found = NAV_ORDER.findIndex((p) => path.startsWith(p));
  return found === -1 ? 0 : found;
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevIndexRef = useRef(indexFor(pathname));

  const currIndex = indexFor(pathname);
  const dir = Math.sign(currIndex - prevIndexRef.current) || 0;

  useEffect(() => {
    prevIndexRef.current = currIndex;
  }, [currIndex]);

  // Respect reduced motion
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cls =
    prefersReduced ? "" : dir > 0 ? "slide-enter-left" : dir < 0 ? "slide-enter-right" : "slide-enter-center";

  return <div className={cls}>{children}</div>;
}
