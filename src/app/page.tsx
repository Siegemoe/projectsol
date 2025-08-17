import Link from "next/link";
import ClientChat from "./client-chat";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
          Memory-first AI, built for real work.
        </h1>
        <p className="max-w-2xl text-neutral-300">
          ProjectSol is a forward-leaning NLP platform focused on structured memory, speed, and clean UX.
          This demo wires a simple chat to GPT-5 through a secure API route.
        </p>
        <div className="flex gap-3">
          <Link
            className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            href="#chat"
          >
            Try the demo
          </Link>
          <a
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-600"
            href="https://github.com/Siegemoe/projectsol"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </section>

      <section id="chat" className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
        <h2 className="mb-3 text-lg font-semibold">Chat (GPT-5)</h2>
        {/* Simple progressive enhancement: client-side Chat mounts here */}
        <Chat />
      </section>
    </div>
  );
}

function Chat() {
  // intentionally minimal to avoid client/server edge cases
  // if this hydrates on server, mark as client:
  return <ClientChat />;
}
