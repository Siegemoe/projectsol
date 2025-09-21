"use client";

import { type ProviderId } from "../types";
import { providerList } from "../providers";
import { type ComponentType, type ChangeEventHandler } from "react";

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
  const providerSelectId = "mail-provider-select";
  const validProviderIds = new Set<string>(providerList.map((p) => p.id));
  const isProviderId = (v: string): v is ProviderId => validProviderIds.has(v);
  const handleProviderChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const v = e.target.value;
    if (isProviderId(v)) {
      onProviderChange(v);
    }
    // else ignore invalid values
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium text-neutral-200">{day}</h2>
          <span className="text-xs text-neutral-500">{date}</span>
          <span className="ml-3 rounded-full bg-[color:var(--bg-elev-2)] px-2 py-0.5 text-[10px] text-text-dim shadow-hairline">
            New senders {newSendersCount}
          </span>
        </div>
      </div>

      {/* Provider switch */}
      <div className="hidden items-center gap-2 sm:flex">
<label htmlFor={providerSelectId} className="text-xs text-neutral-500">Provider</label>
<select
          id={providerSelectId}
          value={providerId}
          onChange={handleProviderChange}
          className="rounded-lg bg-[color:var(--bg-elev-2)] px-2 py-1 text-xs text-text outline-none"
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
        <label htmlFor="mail-search" className="sr-only">Search mail</label>
        <input
          id="mail-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search mail"
          enterKeyHint="search"
          className="w-40 rounded-lg bg-[color:var(--bg-elev-2)] px-2 py-1 text-xs text-text placeholder:text-text-dim outline-none focus:outline-none sm:w-56"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
          >
            <a.icon className="h-4 w-4 text-neutral-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
