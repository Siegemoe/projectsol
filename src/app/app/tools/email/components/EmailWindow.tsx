"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Minus, X, RefreshCcw, SlidersHorizontal, PencilLine } from "lucide-react";
import type { ProviderId, Thread, ThreadSection } from "../types";
import { providerList, providers } from "../providers";
import { getNewSenders, getSections } from "../data";
import MailSidebar from "./MailSidebar";
import MailToolbar from "./MailToolbar";
import NewSendersRow from "./NewSendersRow";
import ThreadList from "./ThreadList";
import PreviewPane from "./PreviewPane";

type Folder = Thread["folder"];

function formatHeaderDate(d = new Date()) {
  const day = d.toLocaleDateString(undefined, { weekday: "long" });
  const full = d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return { day, full };
}

export default function EmailWindow() {
  const [providerId, setProviderId] = useState<ProviderId>("gmail");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<ThreadSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newSenders, setNewSenders] = useState(() => getNewSenders("gmail"));

  // Load mock sections whenever provider/folder changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = providers[providerId] ?? providerList[0];
      const next = await p.listSections(folder);
      if (mounted) {
        setSections(next);
        // Reset selection on folder/provider switch
        setSelectedId(null);
      }
    })();
    setNewSenders(getNewSenders(providerId));
    return () => {
      mounted = false;
    };
  }, [providerId, folder]);

  // Lightweight client-side filtering
  const filtered: ThreadSection[] = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        threads: s.threads.filter(
          (t) =>
            t.subject.toLowerCase().includes(q) ||
            t.sender.name.toLowerCase().includes(q) ||
            t.sender.email.toLowerCase().includes(q) ||
            t.snippet.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.threads.length > 0);
  }, [sections, query]);

  // Resolve selected thread for the preview
  const selectedThread = useMemo<Thread | null>(() => {
    const all = filtered.flatMap((s) => s.threads);
    return all.find((t) => t.id === selectedId) ?? null;
  }, [filtered, selectedId]);

  function handleSelect(id: string) {
    setSelectedId(id);
    // Mark as read on select for visuals
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === id ? { ...t, unread: false } : t)),
      }))
    );
  }

  function toggleUnread(id: string) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === id ? { ...t, unread: !t.unread } : t)),
      }))
    );
  }

  function togglePinned(id: string) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
      }))
    );
  }

  // Counts for sidebar
  const unreadCount = useMemo(
    () => sections.flatMap((s) => s.threads).filter((t) => t.unread).length,
    [sections]
  );
  const pinnedCount = useMemo(
    () => sections.flatMap((s) => s.threads).filter((t) => t.pinned).length,
    [sections]
  );

  const { day, full } = formatHeaderDate();

  return (
    <div className="flex h-full w-full">
      {/* Decorative window with subtle chrome */}
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950 shadow-xl">
        {/* Window title bar */}
        <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2">
          <div className="flex items-center gap-1.5">
            {/* traffic-light dots (decorative) */}
            <button
              aria-label="Close"
              className="h-2.5 w-2.5 rounded-full bg-red-500/80"
              onClick={() => {
                /* decorative only for now */
              }}
            />
            <button aria-label="Minimize" className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <button aria-label="Maximize" className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="ml-2 flex items-center gap-2 text-sm text-neutral-400">
            <Mail className="h-4 w-4 text-neutral-300" />
            <span className="text-neutral-200">Mail</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400 capitalize">{folder}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4 text-neutral-300" />
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-900 bg-neutral-900 hover:bg-neutral-800"
              aria-label="Close window"
            >
              <X className="h-4 w-4 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Three-pane layout */}
        <div className="flex min-h-0 flex-1">
          {/* Inner mail sidebar */}
          <MailSidebar
            activeFolder={folder}
            onChangeFolder={setFolder}
            unreadCount={unreadCount}
            pinnedCount={pinnedCount}
          />

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col border-r border-neutral-900">
            <MailToolbar
              day={day}
              date={full}
              providerId={providerId}
              onProviderChange={setProviderId}
              query={query}
              onQueryChange={setQuery}
              actions={[
                { label: "Refresh", icon: RefreshCcw, onClick: () => setSections(getSections(providerId, folder)) },
                { label: "Filter", icon: SlidersHorizontal, onClick: () => {} },
                { label: "Compose", icon: PencilLine, onClick: () => {} },
              ]}
              newSendersCount={newSenders.length}
            />

            {/* New senders cards */}
            <div className="px-3 pb-2 pt-1 sm:px-4">
              <NewSendersRow items={newSenders} />
            </div>

            {/* Thread list */}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1 sm:px-3 scroll-hover">
              <ThreadList
                sections={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
                onToggleUnread={toggleUnread}
                onTogglePinned={togglePinned}
              />
            </div>
          </div>

          {/* Preview pane (hidden on smaller screens) */}
          <div className="hidden min-w-[340px] max-w-[520px] border-l border-neutral-900 lg:block">
            <PreviewPane thread={selectedThread} />
          </div>
        </div>
      </div>
    </div>
  );
}
