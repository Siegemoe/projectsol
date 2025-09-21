import Link from "next/link";
import type { Route } from "next";
import { supabaseServer } from "@/lib/supabase-server";


export default async function HomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const demoHref = (user ? "/app/home" : `/signin?next=${encodeURIComponent("/app/home")}`) as Route;
  return (
    <div className="relative overflow-hidden rounded-2xl panel">
      {/* background art */}
      <div className="pointer-events-none absolute inset-0">
        <img src="/hero-grid.svg?v=1" alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/40 to-neutral-950/80" />
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
            <Link
              href={demoHref}
              className="button"
            >
              Try the demo
            </Link>
            <a
              className="rounded-xl bg-[color:var(--bg-elev-2)] px-4 py-2 text-sm text-text shadow-hairline"
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
