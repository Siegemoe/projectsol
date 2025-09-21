/* Local, theme-agnostic chat store backed by localStorage.
 * This is intentionally minimal and easy to swap for a server later.
 */
export type ChatRole = "user" | "assistant";

export interface StoredMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface ThreadMeta {
  id: string;
  title: string;
  starred?: boolean;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
  lastPreview?: string;
}

const THREADS_KEY = "sol:threads";
const MSG_KEY = (id: string) => `sol:messages:${id}`;

const EV_THREADS = "sol:threads-changed";
const EV_MESSAGES = (id: string) => `sol:messages-changed:${id}`;

const now = () => Date.now();
export const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function hasWindow() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: any) {
  if (!hasWindow()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function emit(name: string) {
  if (!hasWindow()) return;
  try {
    window.dispatchEvent(new CustomEvent(name));
  } catch {}
}

/* Threads */
export function getThreads(): ThreadMeta[] {
  const list = readJSON<ThreadMeta[]>(THREADS_KEY, []);
  // Sort newest updated first
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}
export function saveThreads(threads: ThreadMeta[]) {
  writeJSON(THREADS_KEY, threads);
  emit(EV_THREADS);
}

export function createThread(title = "New Chat"): ThreadMeta {
  const t: ThreadMeta = {
    id: genId(),
    title,
    createdAt: now(),
    updatedAt: now(),
    starred: false,
    archived: false,
    lastPreview: "",
  };
  const all = getThreads();
  saveThreads([t, ...all]);
  // seed empty messages
  writeJSON(MSG_KEY(t.id), [] as StoredMessage[]);
  emit(EV_MESSAGES(t.id));
  return t;
}

export function updateThread(id: string, patch: Partial<ThreadMeta>) {
  const all = getThreads();
  const next = all.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t));
  saveThreads(next);
}

export function deleteThread(id: string) {
  const next = getThreads().filter((t) => t.id !== id);
  saveThreads(next);
  if (hasWindow()) {
    localStorage.removeItem(MSG_KEY(id));
  }
  emit(EV_MESSAGES(id));
}

/* Preview helpers */
function previewSnippet(text: string, words = 10): string {
  if (!text) return "";
  const arr = text.trim().split(/\s+/);
  const s = arr.slice(0, words).join(" ");
  return arr.length > words ? `${s}…` : s;
}
function computeLastPreview(list: StoredMessage[]): string {
  const last = list[list.length - 1];
  if (!last) return "";
  const prefix = last.role === "user" ? "You" : "Sol";
  return `${prefix}: ${previewSnippet(last.content)}`;
}

/* Messages */
export function getMessages(threadId: string): StoredMessage[] {
  return readJSON<StoredMessage[]>(MSG_KEY(threadId), []);
}

export function saveMessages(threadId: string, messages: StoredMessage[]) {
  writeJSON(MSG_KEY(threadId), messages);
  // bump thread updatedAt and update lastPreview
  const lastPreview = computeLastPreview(messages);
  updateThread(threadId, { lastPreview });
  emit(EV_MESSAGES(threadId));
}

export function appendMessage(threadId: string, msg: StoredMessage) {
  const list = getMessages(threadId);
  list.push(msg);
  saveMessages(threadId, list);
}

export function updateLastAssistantMessage(threadId: string, updater: (curr: StoredMessage) => StoredMessage) {
  const list = getMessages(threadId);
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].role === "assistant") {
      list[i] = updater(list[i]);
      break;
    }
  }
  saveMessages(threadId, list);
}

/* Events / subscriptions */
export function onThreadsChanged(cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const handler = () => cb();
  window.addEventListener(EV_THREADS, handler as EventListener);
  // also respond to cross-tab updates
  const storageHandler = (e: StorageEvent) => {
    if (e.key === THREADS_KEY) cb();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EV_THREADS, handler as EventListener);
    window.removeEventListener("storage", storageHandler);
  };
}

export function onMessagesChanged(threadId: string, cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const name = EV_MESSAGES(threadId);
  const handler = () => cb();
  window.addEventListener(name, handler as EventListener);
  const storageHandler = (e: StorageEvent) => {
    if (e.key === MSG_KEY(threadId)) cb();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(name, handler as EventListener);
    window.removeEventListener("storage", storageHandler);
  };
}
