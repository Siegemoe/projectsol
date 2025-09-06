"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Minus, X, RefreshCcw, SlidersHorizontal, PencilLine } from "lucide-react";
import type { ProviderId, Thread, ThreadSection } from "../types";
import { providerList, providers } from "../providers";
import { getNewSenders, getSections } from "../data";
import MailSidebar from "./MailSidebar";
import MailToolbar from "./MailToolbar";
import NewSendersRow from "./NewSendersRow";
import ThreadList from "./ThreadList";
import PreviewPane from "./PreviewPane";
import { useRouter } from "next/navigation";

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
  const [newSenders, setNewSenders] = useState(() => getNewSenders("gmail"));

  // Persisted preview width (resizable)
  const [previewWidth, setPreviewWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const v = parseInt(localStorage.getItem("mail:previewWidth") || "", 10);
      if (!Number.isNaN(v)) {
        return Math.min(MAX_PREVIEW, Math.max(MIN_PREVIEW, v));
      }
    }
    return DEFAULT_PREVIEW;
  });
  useEffect(() => {
    try {
      localStorage.setItem("mail:previewWidth", String(previewWidth));
    } catch {}
  }, [previewWidth]);

  // Simple drag-to-resize for preview pane
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  // Store stable listener references so we can reliably remove them on unmount or mouseup/touchend
  const moveListenerRef = useRef<((ev: MouseEvent | TouchEvent) => void) | null>(null);
  const upListenerRef = useRef<((ev: MouseEvent | TouchEvent) => void) | null>(null);

  function onResizeStart(e: React.MouseEvent | React.TouchEvent) {
    const clientX =
      "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    dragRef.current = { startX: clientX, startWidth: previewWidth };

    // Define and store listeners in refs, using the same references for add/remove
    moveListenerRef.current = (ev: MouseEvent | TouchEvent) => {
      const x =
        ev instanceof TouchEvent
          ? ev.touches[0]?.clientX ?? dragRef.current!.startX
          : (ev as MouseEvent).clientX;
      const dx = x - dragRef.current!.startX;
      // Reverse behavior: dragging RIGHT should DECREASE preview width (previously inverted)
      const next = Math.min(
        MAX_PREVIEW,
        Math.max(MIN_PREVIEW, dragRef.current!.startWidth - dx)
      );
      setPreviewWidth(next);
      // prevent passive scrolling on touch
      (ev as any).preventDefault?.();
    };

    upListenerRef.current = () => {
      const move = moveListenerRef.current as any;
      const up = upListenerRef.current as any;
      if (move) {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("touchmove", move);
      }
      if (up) {
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchend", up);
      }
      dragRef.current = null;
      // Clear refs to avoid stale handlers
      moveListenerRef.current = null;
      upListenerRef.current = null;
    };

    // Attach listeners using the stored references
    window.addEventListener("mousemove", moveListenerRef.current as any, { passive: false } as any);
    window.addEventListener("touchmove", moveListenerRef.current as any, { passive: false } as any);
    window.addEventListener("mouseup", upListenerRef.current as any);
    window.addEventListener("touchend", upListenerRef.current as any);

    e.preventDefault();
  }

  // Ensure global listeners are removed if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      const move = moveListenerRef.current as any;
      const up = upListenerRef.current as any;
      if (move) {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("touchmove", move);
      }
      if (up) {
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchend", up);
      }
      dragRef.current = null;
      moveListenerRef.current = null;
      upListenerRef.current = null;
    };
  }, []);

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
            : "flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950 shadow-xl"
        }
      >
        {/* Title bar (no traffic-light dots). Keep compact label and top-right controls */}
        <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Mail className="h-4 w-4 text-neutral-300" />
            <span className="text-neutral-200">Mail</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400 capitalize">{folder}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Keep minimize for symmetry; no-op for now */}
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

          {/* Resizer + Preview pane (lg and up) */}
          <div className="hidden lg:flex">
            {/* Resizer handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              title="Resize preview"
              className="w-2 cursor-col-resize hover:bg-neutral-900 active:bg-neutral-900"
              onMouseDown={onResizeStart}
              onTouchStart={onResizeStart}
            />

            {/* Preview pane */}
            <div
              className="min-w-[320px] max-w-[600px] border-l border-neutral-900"
              style={{ width: previewWidth }}
            >
              <PreviewPane thread={selectedThread} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
