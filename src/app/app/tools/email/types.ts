export type ProviderId = "gmail" | "outlook";

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
  sentAt: string; // ISO timestamp
};

export type Thread = {
  id: string;
  providerId: ProviderId;
  folder: "inbox" | "pinned" | "drafts" | "sent" | "trash";
  sender: Sender;
  participants?: Sender[];
  subject: string;
  snippet: string;
  receivedAt: string; // ISO timestamp
  unread: boolean;
  pinned?: boolean;
  labels?: string[]; // pills/badges
  messages: ThreadMessage[];
};

export type ThreadSection = {
  title: string; // e.g., "Today", "Yesterday", "This Week", "Last Week"
  threads: Thread[];
};

export type Provider = {
  id: ProviderId;
  label: string;
  listSections: (folder: Thread["folder"]) => Promise<ThreadSection[]>;
  getThread: (id: string) => Promise<Thread | null>;
};

export type NewSender = {
  id: string;
  sender: Sender;
  subject: string;
  preview: string;
};
