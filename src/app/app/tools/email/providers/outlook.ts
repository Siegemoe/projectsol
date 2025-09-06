"use client";

import { Provider, Thread, ThreadSection } from "../types";
import { getSections } from "../data";

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const outlookProvider: Provider = {
  id: "outlook",
  label: "Outlook",
  async listSections(folder: Thread["folder"]): Promise<ThreadSection[]> {
    // Uses the same mock generator; in a real impl this would call MS Graph.
    const sections = getSections("outlook", folder);
    return delay(sections, 240);
  },
  async getThread(id: string) {
    const sections = getSections("outlook", "inbox");
    const all = sections.flatMap((s) => s.threads);
    return delay(all.find((t) => t.id === id) ?? null, 120);
  },
};
