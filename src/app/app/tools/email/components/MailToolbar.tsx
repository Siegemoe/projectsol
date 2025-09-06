"use client";

import { type ProviderId } from "../types";
import { providerList } from "../providers";
import { type ComponentType } from "react";

type ToolbarAction = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
};

export default function MailToolbar({
  day,
  date,
  providerId,
  onProviderChange,
  query,
  onQueryChange,
  actions,
  newSendersCount,
}: {
  day: string;
  date: string;
  providerId: ProviderId;
  onProviderChange: (p: ProviderId) => void;
  query: string;
  onQueryChange: (q: string) => void;
  actions: ToolbarAction[];
  newSendersCount: number;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-900 px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium text-neutral-200">{day}</h2>
          <span className="text-xs text-neutral-500">{date}</span>
          <span className="ml-3 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300">
            New senders {newSendersCount}
          </span>
        </div>
      </div>

      {/* Provider switch */}
      <div className="hidden items-center gap-2 sm:flex">
        <label className="text-xs text-neutral-500">Provider</label>
        <select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value as ProviderId)}
          className="rounded-lg bg-neutral-900 px-2 py-1 text-xs text-neutral-300 outline-none"
        >
          {providerList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex min-w-[140px] items-center">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search mail"
          className="w-40 rounded-lg border border-neutral-900 bg-neutral-900/60 px-2 py-1 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-700 sm:w-56"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {actions.map((a) => (
          <button
            key={a.label}
            title={a.label}
            aria-label={a.label}
            onClick={a.onClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
          >
            <a.icon className="h-4 w-4 text-neutral-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
