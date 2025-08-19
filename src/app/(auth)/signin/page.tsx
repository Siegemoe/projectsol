"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const disabled = !email || sent;

  async function send() {
    setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      {sent ? (
        <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4">
          <p className="text-neutral-300">
            A magic link has been sent to <span className="text-neutral-100">{email}</span>. Check your email to continue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm text-neutral-400" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none ring-0 focus:border-neutral-700"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button
            onClick={send}
            disabled={disabled}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm disabled:opacity-50 hover:bg-white/15"
          >
            Send magic link
          </button>
          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
      )}

      <div className="pt-2">
        <Link href={"/" as Route} className="text-sm underline text-neutral-300 hover:text-neutral-100">
          Back to home
        </Link>
      </div>
    </section>
  );
}
