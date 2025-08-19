import Link from "next/link";
import type { Route } from "next";

export default function DemoPage() {
  return (
    <section className="relative mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 px-6 py-24 text-center">
        {/* subtle background + gradient for depth */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/hero-grid.svg?v=1"
            alt=""
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/40 to-neutral-950/80" />
        </div>

        <div className="relative">
          <h1 className="bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
            Demo coming soon.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-neutral-300">
            We're polishing the experience. Check back shortly for a hands-on preview.
          </p>

          <div className="mt-8">
            <Link
              href={"/" as Route}
              className="inline-flex items-center rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-600"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
