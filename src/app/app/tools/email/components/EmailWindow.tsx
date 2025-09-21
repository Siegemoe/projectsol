"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Minus, X, RefreshCcw, SlidersHorizontal, PencilLine } from "lucide-react";
import type { ProviderId, Thread, ThreadSection } from "../types";
import { providerList, providers } from "../providers";
import { getNewSenders } from "../data";
import MailSidebar from "./MailSidebar";
import NewSendersRow from "./NewSendersRow";
import ThreadList from "./ThreadList";
import PreviewPane from "./PreviewPane";
import SolChat from "@/components/SolChat";
import { useRouter } from "next/navigation";
import { useDragResize } from "@/hooks/useDragResize";
import { normalizeSearch } from "@/lib/sanitize";

type Folder = Thread["folder"];

function formatHeaderDate(d = new Date()) {
  const day = d.toLocaleDateString(undefined, { weekday: "long" });
  const full = d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return { day, full };
}

type EmailWindowProps = {
  // When embedded inside Chat, render without decorative chrome and without the internal mail sidebar
  embedded?: boolean;
  // Explicitly control whether to show the internal sidebar (ignored when embedded=true)
  showSidebar?: boolean;
  // Controlled folder (when omitted, EmailWindow manages its own folder state)
  folder?: Folder;
  onChangeFolder?: (f: Folder) => void;
  // Called when the top-right X is pressed. If not provided, will navigate back to chat.
  onClose?: () => void;
};

const MIN_PREVIEW = 320;
const MAX_PREVIEW = 600;
const DEFAULT_PREVIEW = 420;

export default function EmailWindow({
  embedded = false,
  showSidebar = true,
  folder: controlledFolder,
  onChangeFolder,
  onClose,
}: EmailWindowProps) {
  const router = useRouter();
  const [providerId, setProviderId] = useState<ProviderId>("gmail");

  // Controlled/uncontrolled folder
  const [internalFolder, setInternalFolder] = useState<Folder>(controlledFolder ?? "inbox");
  useEffect(() => {
    if (controlledFolder !== undefined && controlledFolder !== internalFolder) {
      setInternalFolder(controlledFolder);
    }
  }, [controlledFolder, internalFolder]);
  const folder: Folder = controlledFolder ?? internalFolder;
  const setFolder = (f: Folder) => {
    if (onChangeFolder) onChangeFolder(f);
    else setInternalFolder(f);
  };

  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<ThreadSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [newSenders, setNewSenders] = useState(() => getNewSenders("gmail"));

  // Preview width via reusable drag-resize hook
  const { width: previewWidth, setWidth: setPreviewWidth, onResizeStart } = useDragResize({
    initial: DEFAULT_PREVIEW,
    min: MIN_PREVIEW,
    max: MAX_PREVIEW,
    storageKey: "mail:chatWidth",
    reverse: true,
  });
  
  // Resolve provider with fallback and maintain a request id for cancellation
  const resolvedProvider = useMemo(() => providers[providerId] ?? providerList[0], [providerId]);
  const requestIdRef = useRef(0);
  
  // Load sections whenever provider or folder changes
  useEffect(() => {
    const rid = ++requestIdRef.current;
    let canceled = false;
    (async () => {
      try {
        const next = await resolvedProvider.listSections(folder);
        if (canceled || requestIdRef.current !== rid) return;
        setSections(next);
        // Reset selection on folder/provider switch
        setSelectedId(null);
      } catch (error) {
        console.warn("Failed to load mail sections:", error);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [resolvedProvider, folder]);

  // Provider-only effect for new senders and provider fallback alignment
  useEffect(() => {
    const resolvedId = resolvedProvider.id;
    if (providerId !== resolvedId) {
      setProviderId(resolvedId);
    }
    setNewSenders(getNewSenders(resolvedId));
  }, [providerId, resolvedProvider]);

  // Lightweight client-side filtering
  const filtered: ThreadSection[] = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        threads: s.threads.filter(
          (t) =>
            (t.subject ?? "").toLowerCase().includes(q) ||
            (t.sender?.name ?? "").toLowerCase().includes(q) ||
            (t.sender?.email ?? "").toLowerCase().includes(q) ||
            (t.snippet ?? "").toLowerCase().includes(q)
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
    setViewerOpen(true);
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

  // Counts for sidebar badges
  const unreadCount = useMemo(
    () => sections.flatMap((s) => s.threads).filter((t) => t.unread).length,
    [sections]
  );
  const pinnedCount = useMemo(
    () => sections.flatMap((s) => s.threads).filter((t) => t.pinned).length,
    [sections]
  );

  const { day, full } = formatHeaderDate();

  const showInnerSidebar = !embedded && showSidebar !== false;

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }
    // Fallback: navigate back to chat
    try {
      router.push("/app/chat");
    } catch {
      // no-op
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Outer container: decorative chrome only when not embedded */}
      <div
        className={
          embedded
            ? "flex h-full w-full flex-col overflow-hidden"
            : "flex h-full w-full flex-col overflow-hidden panel"
        }
      >
        {/* Title bar with inline controls */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-text-dim">
            <Mail className="h-4 w-4 text-text" />
            <span className="text-neutral-200">Mail</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400 capitalize">{folder}</span>
            <span className="hidden sm:inline text-xs text-neutral-500 ml-3">
              {day} <span className="mx-1">•</span> {full}
            </span>
          </div>

          {/* Search */}
          <div className="ml-3 flex min-w-[140px] items-center">
            <label htmlFor="mail-search" className="sr-only">Search mail</label>
            <input
              id="mail-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(normalizeSearch(e.target.value))}
              placeholder="Search mail"
              enterKeyHint="search"
              className="w-40 rounded-lg bg-[color:var(--bg-elev-2)] px-2 py-1 text-xs text-text placeholder:text-text-dim outline-none focus:outline-none sm:w-56"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              title="Refresh"
              aria-label="Refresh"
              onClick={async () => {
                try {
                  const next = await resolvedProvider.listSections(folder);
                  setSections(next);
                  setSelectedId(null);
                } catch (error) {
                  console.warn("Failed to refresh sections:", error);
                }
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
            >
              <RefreshCcw className="h-4 w-4 text-neutral-300" />
            </button>
            <button
              title="Filter"
              aria-label="Filter"
              onClick={() => {}}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
            >
              <SlidersHorizontal className="h-4 w-4 text-neutral-300" />
            </button>
            <button
              title="Compose"
              aria-label="Compose"
              onClick={() => {}}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
            >
              <PencilLine className="h-4 w-4 text-neutral-300" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4 text-neutral-300" />
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
              aria-label="Close window"
              onClick={handleClose}
            >
              <X className="h-4 w-4 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Two/three pane layout */}
        <div className="flex min-h-0 flex-1">
          {/* Inner mail sidebar (hidden in embedded mode) */}
          {showInnerSidebar ? (
            <MailSidebar
              activeFolder={folder}
              onChangeFolder={setFolder}
              unreadCount={unreadCount}
              pinnedCount={pinnedCount}
            />
          ) : null}

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col">

            {/* New senders cards */}
            <div className="px-3 pb-2 pt-1 sm:px-4">
              <NewSendersRow items={newSenders} />
            </div>

            {/* Thread list */}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1 sm:px-3 scroll-hover">
              <ThreadList
                sections={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
                onToggleUnread={toggleUnread}
                onTogglePinned={togglePinned}
              />
            </div>
          </div>

          {/* Resizer + Preview pane (lg and up) */}
          <div className="hidden lg:flex">
            {/* Resizer handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              title="Resize preview"
              className="w-2 cursor-col-resize hover:bg-[color:var(--bg-elev-2)] active:bg-[color:var(--bg-elev-2)]"
              onMouseDown={onResizeStart}
              onTouchStart={onResizeStart}
            />

            {/* Right-side AI chat */}
            <div
              className="min-w-[320px] max-w-[600px]"
              style={{ width: previewWidth }}
            >
              <SolChat title="Sol" apiPath="/api/sol-chat" emailToolEnabled={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Email viewer modal */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center"
          onClick={() => setViewerOpen(false)}
        >
          <div
            className="relative w-[min(100%,900px)] h-[min(90vh,600px)] panel overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--bg-elev-2)] text-text shadow-hairline"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-4 w-4 text-neutral-300" />
            </button>
            <div className="h-full w-full">
              <PreviewPane thread={selectedThread} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
