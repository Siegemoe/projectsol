"use client";

import type { Provider, Thread, ThreadSection } from "../types";
import { getSections } from "../data";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${r.statusText}: ${text}`);
  }
  return (await r.json()) as T;
}

export const gmailProvider: Provider = {
  id: "gmail",
  label: "Gmail",
  async listSections(folder: Thread["folder"]): Promise<ThreadSection[]> {
    try {
      const sections = await getJSON<ThreadSection[]>(
        `/api/gmail/threads?folder=${encodeURIComponent(folder)}`
      );
      // Server already grouped into sections
      return sections;
    } catch (error) {
      console.warn('Failed to fetch Gmail sections, using mock data:', error);
      // Fallback to mock data when not connected or on errors
      return delay(getSections("gmail", folder), 150);
    }  },
  async getThread(id: string) {
    try {
      const thread = await getJSON<Thread>(`/api/gmail/threads/${encodeURIComponent(id)}`);
      return thread;
    } catch (error) {
      console.warn('Failed to fetch Gmail thread, using mock data:', error);
      // Search across all folders since we don't know which folder the thread belongs to
      const folders: Thread["folder"][] = ["inbox", "sent", "drafts"];
      const all = folders.flatMap(f => getSections("gmail", f).flatMap(s => s.threads));
      return delay(all.find((t) => t.id === id) ?? null, 120);
    }  },
};
