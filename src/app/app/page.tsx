import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import type { Route } from "next";

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="mx-auto max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Please sign in</h1>
        <p className="text-neutral-300">Access to the app requires authentication.</p>
        <Link className="underline" href={"/signin" as Route}>Go to sign in</Link>
      </section>
    );
  }

  // Ensure profile row exists (fire-and-forget)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (base) {
    // Best-effort; ignore errors in UI path
    await fetch(`${base}/api/profile`, { method: "POST", cache: "no-store" }).catch(() => {});
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.email}</h1>
      <form action="/signout" method="post">
        <button className="rounded bg-white/10 px-4 py-2">Sign out</button>
      </form>
      <div className="text-sm text-neutral-400">
        User ID: <span className="text-neutral-200">{user.id}</span>
      </div>
    </section>
  );
}
