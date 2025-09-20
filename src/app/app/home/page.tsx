import type React from "react";

export default function HomePage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl">
      {/* 3-column dashboard scaffold (mock) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Tasks Panel */}
        <section className="panel p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200">Tasks</h2>
            <span className="h-1 w-16 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
          </header>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2">Website Redesign</li>
            <li className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2">Marketing Launch</li>
            <li className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2">Quarterly Review</li>
          </ul>
        </section>

        {/* Updates / Inbox-like feed */}
        <section className="panel p-4 md:col-span-1">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200">Updates</h2>
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <button className="rounded-md border border-neutral-900 bg-neutral-900/50 px-2 py-1 hover:bg-neutral-800">New</button>
              <button className="rounded-md border border-neutral-900 bg-neutral-900/50 px-2 py-1 hover:bg-neutral-800">Sort</button>
              <button className="rounded-md border border-neutral-900 bg-neutral-900/50 px-2 py-1 hover:bg-neutral-800">View</button>
            </div>
          </header>
          <div className="space-y-2">
            {[
              { title: "Project Update", time: "11:58 AM" },
              { title: "Chat: Lucas Foley", time: "11:42 AM" },
              { title: "Email: Laura Aviles", time: "10:12 AM" },
            ].map((it) => (
              <div key={it.title} className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3">
                <div className="flex items-center justify-between text-sm text-neutral-200">
                  <div>{it.title}</div>
                  <div className="text-xs text-neutral-500">{it.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar mini */}
        <section className="panel p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200">Calendar</h2>
            <div className="text-xs text-neutral-400">{new Date().toLocaleString()}</div>
          </header>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-neutral-300">Thu 11:00 AM — Standup</div>
            <div className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-neutral-300">Fri 3:00 PM — Design Review</div>
            <div className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2 text-neutral-300">Mon 9:30 AM — Sprint Planning</div>
          </div>
        </section>
      </div>

      {/* Quick action input */}
      <div className="mt-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative panel p-2 pr-12">
            <input
              placeholder="Summarize chatbot, email…"
              className="w-full bg-transparent text-sm leading-6 text-neutral-100 outline-none placeholder:text-neutral-500"
            />
            <button
              type="button"
              className="absolute right-2 bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 ring-1 ring-neutral-700 hover:bg-neutral-700"
              aria-label="Send"
            >
              {"\u27A4"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
