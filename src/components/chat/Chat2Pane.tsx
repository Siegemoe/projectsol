"use client";

import React, { useState } from "react";
import ThreadsSidebar from "./ThreadsSidebar";
import SolChat from "@/components/SolChat";

/**
 * Two-pane chat view:
 * - Left: threads list with basic actions (local state)
 * - Right: Sol Chat conversation
 */
export default function Chat2Pane() {
  const [activeId, setActiveId] = useState<string | null>("t1");

  return (
    <div className="grid h-full min-h-0 w-full bg-bg" style={{ gridTemplateColumns: "18rem 1px minmax(0,1fr)" }}>
      {/* Left sidebar - fixed width column */}
      <ThreadsSidebar activeId={activeId} onSelect={setActiveId} />

      {/* Hairline separator column */}
      <div
        className="bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.06),transparent)]"
        aria-hidden="true"
      />

      {/* Chat pane - fills remaining space */}
      <div className="min-w-0 bg-bg-1 h-full flex flex-col">
        <SolChat title="Sol" apiPath="/api/sol-chat" />
      </div>
    </div>
  );
}
