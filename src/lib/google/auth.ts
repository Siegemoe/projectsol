import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gmail OAuth helpers and token storage.
 * Phase 1: read-only (gmail.readonly), server-only usage, no message caching.
 */

const GMAIL_SCOPE_READONLY = "https://www.googleapis.com/auth/gmail.readonly";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

/**
 * Parse ENCRYPTION_KEY env as 32-byte key (hex or base64).
 */
function getEncryptionKey(): Buffer {
  const raw = requireEnv("ENCRYPTION_KEY").trim();
  // Try hex
  const hexOk = /^[0-9a-fA-F]+$/.test(raw) && (raw.length === 64 || raw.length === 32);
  if (hexOk) {
    const key = Buffer.from(raw, "hex");
    if (key.length === 16) {
      // If user provided 16-byte hex, pad (not ideal). Better to require 32 bytes.
      throw new Error("ENCRYPTION_KEY must be 32-byte (64 hex chars) or base64.");
    }
    return key;
  }
  // Try base64
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256-GCM).");
}

/**
 * AES-256-GCM encrypt/decrypt
 * Stored as: v1:base64(iv):base64(cipher):base64(tag)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // GCM nonce
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`;
}

export function decrypt(encoded: string): string {
  const [v, ivB64, ctB64, tagB64] = encoded.split(":");
  if (v !== "v1") throw new Error("Unsupported ciphertext version");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
  dec.setAuthTag(tag);
  const out = Buffer.concat([dec.update(ct), dec.final()]);
  return out.toString("utf8");
}

/**
 * Build an OAuth2 client for Gmail using env credentials.
 */
export function buildOAuthClient(): OAuth2Client {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = requireEnv("GOOGLE_OAUTH_REDIRECT_URI");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Create a Supabase client bound to a request/response cookie interface.
 * This helper mirrors the pattern used across the codebase.
 */
export function supabaseFromRequest(req: Request | { cookies: Map<string, string> }, setCookie?: (name: string, value: string, options: CookieOptions) => void) {
  // The route handlers already use createServerClient directly; this is optional.
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get: (name: string) => {
          if (req instanceof Request) {
            // Not available directly; caller should pass cookies separately if needed
            return undefined;
          } else {
            return req.cookies.get(name);
          }
        },
        set: (name: string, value: string, options: CookieOptions) => {
          if (setCookie) setCookie(name, value, options);
        },
        remove: (name: string, options: CookieOptions) => {
          if (setCookie) setCookie(name, "", options);
        },
      },
    }
  );
}

type TokenRow = {
  user_id: string;
  provider: "gmail";
  email: string | null;
  access_token: string | null;
  refresh_token: string; // encrypted
  scope: string | null;
  expiry_date: string | null; // ISO
  created_at: string;
  updated_at: string;
};

export async function getTokenRow(supabase: SupabaseClient, userId: string): Promise<TokenRow | null> {
  const { data, error } = await supabase
    .from("user_google_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function upsertTokenRow(params: {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  accessToken: string | null;
  refreshTokenPlain?: string | null; // when present, re-encrypt and store
  scope: string | null;
  expiryDateMs: number | null; // epoch millis
}) {
  const { supabase, userId, email, accessToken, refreshTokenPlain, scope, expiryDateMs } = params;
  let encryptedRefresh: string | undefined;
  if (refreshTokenPlain) {
    encryptedRefresh = encrypt(refreshTokenPlain);
  }
  const payload: Record<string, any> = {
    user_id: userId,
    provider: "gmail",
    email,
    access_token: accessToken,
    scope,
    expiry_date: expiryDateMs ? new Date(expiryDateMs).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (encryptedRefresh) payload.refresh_token = encryptedRefresh;

  const { error } = await supabase
    .from("user_google_tokens")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

/**
 * Create OAuth client with user tokens attached. Ensures refresh capability.
 */
export async function getUserOAuthClient(supabase: SupabaseClient, userId: string): Promise<{ oauth: OAuth2Client; email: string | null } | null> {
  const row = await getTokenRow(supabase, userId);
  if (!row) return null;
  const oauth = buildOAuthClient();
  const refreshPlain = decrypt(row.refresh_token);
  oauth.setCredentials({
    refresh_token: refreshPlain,
    access_token: row.access_token ?? undefined,
    expiry_date: row.expiry_date ? Date.parse(row.expiry_date) : undefined,
    scope: row.scope ?? undefined,
  });
  // optionally listen for token refreshes to persist new access/expiry
  oauth.on("tokens", async (tokens) => {
    try {
      await upsertTokenRow({
        supabase,
        userId,
        email: row.email,
        accessToken: tokens.access_token ?? null,
        refreshTokenPlain: tokens.refresh_token ?? undefined, // rarely provided after first consent
        scope: tokens.scope ?? row.scope,
        expiryDateMs: typeof tokens.expiry_date === "number" ? tokens.expiry_date : null,
      });
    } catch {
      // best-effort; don't throw in event
    }
  });
  return { oauth, email: row.email };
}

export function gmailFromOAuth(oauth: OAuth2Client) {
  return google.gmail({ version: "v1", auth: oauth });
}

/**
 * Utilities to map Gmail API responses into app Thread shapes.
 */
export type Sender = {
  id: string;
  name: string;
  email: string;
  initials?: string;
  avatarUrl?: string | null;
};

export type ThreadMessage = {
  id: string;
  author: Sender;
  body: string;
  sentAt: string; // ISO
};

export type Thread = {
  id: string;
  providerId: "gmail";
  folder: "inbox" | "pinned" | "drafts" | "sent" | "trash";
  sender: Sender;
  participants?: Sender[];
  subject: string;
  snippet: string;
  receivedAt: string; // ISO
  unread: boolean;
  pinned?: boolean;
  labels?: string[];
  messages: ThreadMessage[];
};

export type ThreadSection = {
  title: string;
  threads: Thread[];
};

function parseAddress(raw: string | undefined): { name: string; email: string } | null {
  if (!raw) return null;
  // Basic parse: "Name <email@x>" or "email@x"
  const m = raw.match(/^(.*)<(.+@.+)>$/);
  if (m) {
    const name = m[1].trim().replace(/^"|"$/g, "");
    const email = m[2].trim();
    return { name: name || email, email };
  }
  const simple = raw.trim().replace(/^"|"$/g, "");
  return { name: simple, email: simple };
}

function initialsForName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2);
}

function fromHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const h = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return h?.value ?? undefined;
}

function decodeB64Url(data: string | undefined): string {
  if (!data) return "";
  // Gmail uses URL-safe base64
  const buf = Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return buf.toString("utf8");
}

function findPlainText(part?: gmail_v1.Schema$MessagePart | null): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeB64Url(part.body.data);
  }
  if (part.parts) {
    for (const p of part.parts) {
      const v = findPlainText(p);
      if (v) return v;
    }
  }
  // fallback to HTML stripped
  if (part.mimeType === "text/html" && part.body?.data) {
    const html = decodeB64Url(part.body.data);
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return "";
}

function groupByDateBuckets(threads: Thread[]): ThreadSection[] {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  function daysDiff(d: Date) {
    return Math.floor((startOfDay.getTime() - new Date(d).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000));
  }
  const today: Thread[] = [];
  const yesterday: Thread[] = [];
  const thisWeek: Thread[] = [];
  const lastWeek: Thread[] = [];
  for (const t of threads) {
    const dd = daysDiff(new Date(t.receivedAt));
    if (dd <= 0) today.push(t);
    else if (dd === 1) yesterday.push(t);
    else if (dd <= 6) thisWeek.push(t);
    else lastWeek.push(t);
  }
  const sections: ThreadSection[] = [];
  if (today.length) sections.push({ title: "Today", threads: today });
  if (yesterday.length) sections.push({ title: "Yesterday", threads: yesterday });
  if (thisWeek.length) sections.push({ title: "This Week", threads: thisWeek });
  if (lastWeek.length) sections.push({ title: "Last Week", threads: lastWeek });
  return sections;
}

/**
 * Map a Gmail thread (with messages) to our Thread shape.
 */
export function mapGmailThreadToThread(gThread: gmail_v1.Schema$Thread, folder: Thread["folder"]): Thread | null {
  const first = gThread.messages?.[0];
  if (!first) return null;
  const headers = first.payload?.headers || [];
  const from = parseAddress(fromHeader(headers, "From"));
  const subject = fromHeader(headers, "Subject") || "(no subject)";
  const snippet = gThread.snippet || "";
  const internalDateMs = first.internalDate ? Number(first.internalDate) : Date.now();
  const sender: Sender = {
    id: from?.email || "unknown",
    name: from?.name || from?.email || "Unknown",
    email: from?.email || "unknown@example.com",
    initials: initialsForName(from?.name || from?.email || ""),
    avatarUrl: null,
  };
  const unread = (first.labelIds || gThread.messages?.[0]?.labelIds || []).includes("UNREAD");
  const messages: ThreadMessage[] = (gThread.messages || []).map((m) => {
    const mh = m.payload?.headers || [];
    const ma = parseAddress(fromHeader(mh, "From"));
    const author: Sender = {
      id: ma?.email || "unknown",
      name: ma?.name || ma?.email || "Unknown",
      email: ma?.email || "unknown@example.com",
      initials: initialsForName(ma?.name || ma?.email || ""),
      avatarUrl: null,
    };
    const body = findPlainText(m.payload) || (m.snippet || "");
    const sentAt = m.internalDate ? new Date(Number(m.internalDate)).toISOString() : new Date().toISOString();
    return {
      id: m.id || crypto.randomUUID(),
      author,
      body,
      sentAt,
    };
  });

  const labels: string[] = []; // optional: could map Gmail label IDs to names with an extra API call

  return {
    id: gThread.id || crypto.randomUUID(),
    providerId: "gmail",
    folder,
    sender,
    participants: undefined,
    subject,
    snippet,
    receivedAt: new Date(internalDateMs).toISOString(),
    unread,
    pinned: false,
    labels,
    messages,
  };
}

/**
 * Fetch and map a page of inbox threads to sections.
 */
export async function fetchInboxSections(gmail: gmail_v1.Gmail, pageSize = 25): Promise<ThreadSection[]> {
  const list = await gmail.users.threads.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: pageSize,
  });
  const threads: Thread[] = [];
  for (const t of list.data.threads || []) {
    const thr = await gmail.users.threads.get({ userId: "me", id: t.id! });
    const mapped = mapGmailThreadToThread(thr.data, "inbox");
    if (mapped) threads.push(mapped);
  }
  // Sort by receivedAt desc
  threads.sort((a, b) => (a.receivedAt > b.receivedAt ? -1 : 1));
  return groupByDateBuckets(threads);
}

/**
 * Get Gmail account primary email address
 */
export async function fetchGmailProfileEmail(gmail: gmail_v1.Gmail): Promise<string | null> {
  const prof = await gmail.users.getProfile({ userId: "me" });
  return prof.data.emailAddress ?? null;
}

/**
 * Generate and validate OAuth state to mitigate CSRF.
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}
