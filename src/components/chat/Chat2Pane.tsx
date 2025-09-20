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
    <div className="flex h-full min-h-0 w-full">
      <ThreadsSidebar activeId={activeId} onSelect={setActiveId} />
      <div className="min-w-0 flex-1">
        <SolChat title="Sol" apiPath="/api/sol-chat" />
      </div>
    </div>
  );
}
