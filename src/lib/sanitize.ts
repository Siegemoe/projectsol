/**
 * Client-side validation + minimal-safe formatting for email preview bodies.
 * - Escapes HTML entities
 * - Converts Markdown links [text](url) to anchors (http/https only)
 * - Auto-links bare URLs
 * - Converts newlines to paragraphs and <br/>
 * Dependency-free and intended for preview rendering.
 */

export type Folder = "inbox" | "pinned" | "drafts" | "sent" | "trash";

const folderSet = new Set<Folder>(["inbox", "pinned", "drafts", "sent", "trash"]);

/** Returns true if a string is one of the known folders. */
export function isFolder(value: string | null): value is Folder {
  return value != null && folderSet.has(value as Folder);
}

/** Coerce an arbitrary string into a valid folder enum, or fallback. */
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

/** Escape HTML entities for safe insertion. */
export function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
/** Convert Markdown-style links [text](url) to anchors (after escaping text). */
/** Convert Markdown-style links [text](url) to anchors (after escaping text). */
function replaceMarkdownLinks(escaped: string): string {
  // Only allow http/https URLs
  return escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) => {
    const safeText = text; // already escaped
    // Escape quotes in URL to prevent attribute breakout
    const safeUrl = url.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    return `<a class="underline text-neutral-400 hover:text-neutral-300" href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow">${safeText}</a>`;
  });
}/** Auto-link bare URLs into anchors (best-effort, http/https only). */
/** Auto-link bare URLs into anchors (best-effort, http/https only). */
function linkifyUrls(escaped: string): string {
  const urlRe = /(^|[\s(])((https?:\/\/[^\s<)]+))/g;
  return escaped.replace(urlRe, (_m, prefix, url) => {
    const safeUrl = url.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    return `${prefix}<a class="underline text-neutral-400 hover:text-neutral-300" href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow">${safeUrl}</a>`;
  });
}/** Convert newlines to <br/> and group paragraphs by blank lines. */
function nlToHtml(text: string): string {
  const paras = text.split(/\n{2,}/g).map((para) => para.replace(/\n/g, "<br/>"));
  return paras.map((p) => `<p class="mb-3">${p}</p>`).join("");
}

/**
 * Produce safe, lightly formatted HTML for email preview bodies.
 * Pipeline: escape -> markdown links -> bare url links -> nl2p
 */
export function formatEmailHtml(body: string): string {
  const escaped = escapeHtml(body || "");
  const withMd = replaceMarkdownLinks(escaped);
  const withUrls = linkifyUrls(withMd);
  return nlToHtml(withUrls);
}
