"use client";

import React, { useState } from "react";
import ThreadsSidebar from "./ThreadsSidebar";
import SolChat from "@/components/SolChat";

/**
 * Simple two-pane chat view:
 * - Left: threads list
 * - Right: Sol Chat conversation
 */
export default function Chat2Pane() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full bg-white">
      {/* Left sidebar */}
      <ThreadsSidebar activeId={activeId} onSelect={setActiveId} />

      {/* Chat pane */}
      <div className="flex-1 min-w-0 h-full">
        <SolChat title="Sol" apiPath="/api/sol-chat" threadId={activeId ?? undefined} />
      </div>
    </div>
  );
}
