"use client";

import { useEffect } from "react";

/**
 * Locks the outer document scrollbars so only in-app panes (e.g., sidebar, chat)
 * can scroll. Cleans up on unmount.
 */
export default function AppViewportLock() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return null;
}
