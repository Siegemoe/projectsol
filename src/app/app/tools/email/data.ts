import { ProviderId, Sender, Thread, ThreadMessage, ThreadSection, NewSender } from "./types";

function makeSender(id: string, name: string, email: string, initials?: string): Sender {
  return { id, name, email, initials: initials ?? name.split(" ").map((s) => s[0]).join("").slice(0, 2) };
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function iso(d: Date) {
  return d.toISOString();
}

const baseSenders: Sender[] = [
  makeSender("s1", "Cline Bot Inc.", "receipts@cline.bot", "CB"),
  makeSender("s2", "Ali Durbin", "ali@example.com", "AD"),
  makeSender("s3", "Alison Durbin", "alison@example.com", "AD"),
  makeSender("s4", "Ray, Durbin., Richard", "ray@example.com", "RN"),
  makeSender("s5", "Amazon.com", "store-news@amazon.com", "A"),
  makeSender("s6", "Glassdoor Community", "noreply@glassdoor.com", "G"),
  makeSender("s7", "Supabase Auth", "noreply@mail.app.supabase.io", "S"),
];

function buildMessage(author: Sender, daysAgo = 0): ThreadMessage {
  const now = new Date();
  const when = addDays(now, -daysAgo);
  return {
    id: `m_${author.id}_${when.getTime()}`,
    author,
    body:
      "This is a placeholder email message body. Replace with real content later. " +
      "For now, this helps validate layout, spacing, and dark theme typography.",
    sentAt: iso(when),
  };
}

function buildThread(
  providerId: ProviderId,
  sender: Sender,
  subject: string,
  snippet: string,
  daysAgo: number,
  flags?: Partial<Pick<Thread, "unread" | "pinned" | "labels" | "folder">>
): Thread {
  const now = new Date();
  const received = addDays(now, -daysAgo);
  const base: Thread = {
    id: `${providerId}_${sender.id}_${received.getTime()}`,
    providerId,
    folder: "inbox",
    sender,
    subject,
    snippet,
    receivedAt: iso(received),
    unread: true,
    pinned: false,
    labels: [],
    messages: [buildMessage(sender, daysAgo)],
  };
  return { ...base, ...flags };
}

function mockPinnedBadges(): string[] {
  return [
    "Payroll Mangement",
    "Steam Store",
    "no-reply@schoolcues.com",
    "Kryslen Bohlt",
    "FederalWayWA@goddard...",
  ];
}

export function getNewSenders(providerId: ProviderId): NewSender[] {
  // 3 cards as shown in the screenshot example
  const now = Date.now();
  const list: NewSender[] = [
    {
      id: `${providerId}_ns1_${now}`,
      sender: baseSenders[4],
      subject: "Deals under $10 for September",
      preview: "Amazon weekly roundup and offers picked just for you.",
    },
    {
      id: `${providerId}_ns2_${now}`,
      sender: baseSenders[5],
      subject: "Is it possible that a job...",
      preview: "Community answers to trending topics and job market insights.",
    },
    {
      id: `${providerId}_ns3_${now}`,
      sender: baseSenders[6],
      subject: "Confirm Your Signup",
      preview: "Use the link to finish setting up your account.",
    },
  ];
  return list;
}

export function getSections(providerId: ProviderId, folder: Thread["folder"]): ThreadSection[] {
  // Provide a stable mock set grouped by date buckets
  // Today (0-0), Yesterday (1), This Week (2-6), Last Week (7+)
  // A few pinned in Today
  const today: Thread[] = [
    buildThread(
      providerId,
      baseSenders[0],
      "Your receipt from Cline Bot Inc. #2484-4315",
      "No Content",
      0,
      { unread: false }
    ),
    // A "Pinned" pseudo row will be rendered from any pinned threads in today
    buildThread(
      providerId,
      baseSenders[1],
      "Pinned group",
      "Pinned row placeholder",
      0,
      { unread: false, pinned: true, labels: mockPinnedBadges() }
    ),
    buildThread(
      providerId,
      baseSenders[2],
      "Notifications summary",
      "No Content",
      0,
      { unread: true }
    ),
  ];

  const yesterday: Thread[] = [
    buildThread(
      providerId,
      baseSenders[1],
      "Sleepy Hollow Campout - Important Information",
      "No Content",
      1,
      { unread: true }
    ),
    buildThread(
      providerId,
      baseSenders[2],
      "Options for Thought",
      "No Content",
      1,
      { unread: false }
    ),
    buildThread(
      providerId,
      baseSenders[3],
      "CBR002 home update",
      "No Content",
      1,
      { unread: false }
    ),
  ];

  const thisWeek: Thread[] = [
    buildThread(
      providerId,
      baseSenders[1],
      "CBR002 home update",
      "No Content",
      2,
      { unread: false }
    ),
    buildThread(
      providerId,
      baseSenders[1],
      "Get ready for your trip to Chicago",
      "No Content",
      5,
      { unread: true }
    ),
    buildThread(
      providerId,
      baseSenders[0],
      "Your receipt from Cline Bot Inc. #2381-8142",
      "No Content",
      6,
      { unread: false }
    ),
  ];

  const lastWeek: Thread[] = [
    buildThread(
      providerId,
      makeSender("s8", "Patricia, Ali", "patricia@example.com", "PA"),
      "Permission to share IEP records",
      "No Content",
      9,
      { unread: false }
    ),
  ];

  let sections: ThreadSection[] = [
    { title: "Today", threads: today },
    { title: "Yesterday", threads: yesterday },
    { title: "This Week", threads: thisWeek },
    { title: "Last Week", threads: lastWeek },
  ];

  if (folder === "pinned") {
    sections = sections.map((s) => ({ ...s, threads: s.threads.filter((t) => t.pinned) }));
  } else if (folder === "drafts") {
    sections = [{ title: "Drafts", threads: [] }];
  } else if (folder === "sent") {
    sections = [{ title: "Sent", threads: [] }];
  } else if (folder === "trash") {
    sections = [{ title: "Trash", threads: [] }];
  }

  // Tag threads with folder for clarity
  sections = sections.map((s) => ({
    ...s,
    threads: s.threads.map((t) => ({ ...t, folder })),
  }));

  return sections;
}
