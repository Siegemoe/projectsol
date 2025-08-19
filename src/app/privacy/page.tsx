import Link from "next/link";
import type { Route } from "next";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-neutral-400">This is a placeholder page. Final copy coming soon.</p>
      </header>

      <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-6">
        <p className="text-neutral-300">
          We respect your privacy. ProjectSol will publish a full privacy policy before public release.
        </p>
      </div>

      <div>
        <Link
          href={"/" as Route}
          className="inline-flex items-center rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-600"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
