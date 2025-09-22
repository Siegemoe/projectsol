import { useEffect, useRef, useState } from "react";

export type UseDragResizeOptions = {
  initial: number;
  min: number;
  max: number;
  storageKey?: string;
  /**
   * If true: dragging RIGHT decreases width (reverse of the usual).
   */
  reverse?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * useDragResize
 * - Encapsulates mouse/touch drag-to-resize behavior with global listeners.
 * - Persists width to localStorage when a storageKey is provided.
 * - Safe for client components (uses window only inside effects/handlers).
 */
export function useDragResize(opts: UseDragResizeOptions) {
  const { initial, min, max, storageKey, reverse = false } = opts;

  const initialWidth = (() => {
    const base = clamp(initial, min, max);
    if (typeof window === "undefined" || !storageKey) return base;
    const raw = parseInt(window.localStorage.getItem(storageKey) || "", 10);
    if (Number.isNaN(raw)) return base;
    return clamp(raw, min, max);
  })();

  const [width, setWidth] = useState<number>(initialWidth);

  // Persist
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, String(width));
    } catch {
      // ignore
    }
  }, [width, storageKey]);

  // Drag state
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const moveListenerRef = useRef<((ev: MouseEvent | TouchEvent) => void) | null>(null);
  const upListenerRef = useRef<((ev: MouseEvent | TouchEvent) => void) | null>(null);

  function onResizeStart(e: React.MouseEvent | React.TouchEvent) {
    const clientX =
      "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;

    dragRef.current = { startX: clientX, startWidth: width };

    moveListenerRef.current = (ev: MouseEvent | TouchEvent) => {
      // Only prevent default for drag events, not all mouse/touch events
      if (!dragRef.current) return;
      
      const x =
        ev instanceof TouchEvent
          ? ev.touches[0]?.clientX ?? dragRef.current!.startX
          : (ev as MouseEvent).clientX;
      const dx = x - dragRef.current!.startX;

      const next = reverse
        ? clamp(dragRef.current!.startWidth - dx, min, max)
        : clamp(dragRef.current!.startWidth + dx, min, max);

      setWidth(next);
      
      // Only prevent default during active resize
      if (dragRef.current) {
        (ev as any).preventDefault?.();
      }
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
      moveListenerRef.current = null;
      upListenerRef.current = null;
    };

    window.addEventListener("mousemove", moveListenerRef.current as any, { passive: false } as any);
    window.addEventListener("touchmove", moveListenerRef.current as any, { passive: false } as any);
    window.addEventListener("mouseup", upListenerRef.current as any);
    window.addEventListener("touchend", upListenerRef.current as any);

    e.preventDefault();
  }

  // Cleanup on unmount
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

  return {
    width,
    setWidth,
    onResizeStart,
  };
}
