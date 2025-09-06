"use client";

import { Provider, Thread, ThreadSection } from "../types";
import { getSections } from "../data";

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const gmailProvider: Provider = {
  id: "gmail",
  label: "Gmail",
  async listSections(folder: Thread["folder"]): Promise<ThreadSection[]> {
    const sections = getSections("gmail", folder);
    return delay(sections, 200);
  },
  async getThread(id: string) {
    // For visuals only: search across sections and return first match
    const sections = getSections("gmail", "inbox");
    const all = sections.flatMap((s) => s.threads);
    return delay(all.find((t) => t.id === id) ?? null, 120);
  },
};
