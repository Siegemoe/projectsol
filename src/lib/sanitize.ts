/**
 * Client-side validation helpers (kept simple to avoid bundler/encoding issues).
 * Note: Rendering paths already use plain text — no innerHTML — so XSS risk is low.
 * These helpers focus on coercion and normalization.
 */

export type Folder = "inbox" | "pinned" | "drafts" | "sent" | "trash";

const folderSet = new Set<Folder>(["inbox", "pinned", "drafts", "sent", "trash"]);

/**
 * Returns true if a string is one of the known folders.
 */
export function isFolder(value: string | null): value is Folder {
  return value != null && folderSet.has(value as Folder);
}

/**
 * Coerce an arbitrary string into a valid folder enum, or fallback.
 */
export function coerceFolder(value: string | null, fallback: Folder = "inbox"): Folder {
  return isFolder(value) ? (value as Folder) : fallback;
}

/**
 * Normalize a free-form search string:
 * - trim whitespace
 * - collapse internal whitespace
 * - limit to maxLen
 */
export function normalizeSearch(input: string, maxLen = 256): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}
