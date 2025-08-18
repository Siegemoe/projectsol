import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950">
      {/* background art */}
      <div className="pointer-events-none absolute inset-0">
        <img src="/hero-grid.svg?v=1" alt="" className="h-full w-full object-cover opacity-80" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight lg:text-6xl">
            Memory-first AI, built for real work.
          </h1>
          <p className="max-w-2xl text-neutral-300">
            ProjectSol is a forward-leaning NLP platform focused on structured memory, speed, and clean UX.
            This preview showcases the interface direction and deployment pipeline.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Demo coming soon"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm opacity-60 cursor-not-allowed"
            >
              Try the demo
            </button>
            <a
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-600"
              href="https://github.com/Siegemoe/projectsol"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-neutral-400">
            <img src="/logo-sol.svg" alt="" className="h-5 w-5 opacity-80" />
            <span>Private alpha · Vercel deploys · TypeScript · Next.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}
