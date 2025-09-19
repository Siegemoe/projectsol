import Link from "next/link";
import type { Route } from "next";

export default function NotInvitedPage() {
  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Access pending</h1>
      <p className="text-neutral-300">
        You&#39;re signed in, but this account isn&#39;t part of the gated Alpha yet.
      </p>
      <p className="text-neutral-400 text-sm">
        If you believe this is a mistake, contact the team, or try another Google account.
      </p>
      <div className="flex items-center gap-3 pt-1">
        <Link href={"/" as Route} className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
          Back to home
        </Link>
        <form action="/signout" method="post">
          <button className="rounded-xl border border-neutral-800 px-4 py-2 text-sm hover:border-neutral-700">
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
