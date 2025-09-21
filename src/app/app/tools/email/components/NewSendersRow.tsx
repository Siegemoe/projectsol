"use client";

import { useState } from "react";
import type { NewSender } from "../types";
import { Check, X } from "lucide-react";

export default function NewSendersRow({ items }: { items: NewSender[] }) {
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "blocked" | undefined>>(
    {}
  );

  function decide(id: string, v: "accepted" | "blocked") {
    setDecisions((d) => ({ ...d, [id]: v }));
  }

  if (!items.length) return null;

  return (
    <div className="overflow-x-auto overflow-y-hidden scroll-hover" aria-label="New senders">
      <div className="flex gap-3 snap-x snap-mandatory">
      {items.map((card) => {
        const decision = decisions[card.id];
        return (
          <div
            key={card.id}
            className="w-[18rem] shrink-0 snap-start rounded-xl bg-[color:var(--bg-elev-2)] px-3 py-3 shadow-hairline"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--bg-elev-2)] text-sm font-medium text-text shadow-hairline">
                {card.sender.initials ?? "NS"}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-neutral-200">{card.sender.name}</div>
                <div className="truncate text-xs text-neutral-500">{card.sender.email}</div>
              </div>
            </div>

            <div className="mt-3 min-h-10">
              <div className="truncate text-sm text-neutral-300">{card.subject}</div>
              <div className="truncate text-xs text-neutral-500">{card.preview}</div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => decide(card.id, "accepted")}
                className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
                  decision === "accepted"
                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                    : "bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
                }`}
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
              <button
                type="button"
                onClick={() => decide(card.id, "blocked")}
                className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition ${
                  decision === "blocked"
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
                }`}
              >
                <X className="h-4 w-4" />
                Block
              </button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
