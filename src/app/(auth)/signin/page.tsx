"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import { supabaseBrowser } from "@/lib/supabase-browser";

function SignInContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(initialError);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const disabled = !email || sent;

  const baseUrl =
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL) ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";

  async function send() {
    setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: {
        // After clicking the magic link, finish on our server callback so cookies are set,
        // then redirect back to the intended page.
        emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    try {
      setErr(null);
      setLoadingGoogle(true);
      const { data, error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          // Supabase will redirect back to this URL with ?code=...
          redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setErr(error.message ?? "Failed to start Google sign-in");
        setLoadingGoogle(false);
        return;
      }
      if (data?.url) {
        window.location.assign(data.url);
      } else {
        setLoadingGoogle(false);
        setErr("Failed to start Google sign-in");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to start Google sign-in");
      setLoadingGoogle(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>

      {/* OAuth section */}
      <div className="space-y-3">
        <button
          onClick={signInWithGoogle}
          disabled={loadingGoogle}
          className="w-full rounded-lg bg-white text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90"
        >
          {loadingGoogle ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-800" />
        <div className="text-xs text-neutral-500">or</div>
        <div className="h-px flex-1 bg-neutral-800" />
      </div>

      {/* Magic link section */}
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
            className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm disabled:opacity-50 hover:bg-white/15"
          >
            Send magic link
          </button>
        </div>
      )}

      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="pt-2">
        <Link href={"/" as Route} className="text-sm underline text-neutral-300 hover:text-neutral-100">
          Back to home
        </Link>
      </div>
    </section>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <div className="text-sm text-neutral-400">Loading…</div>
        </section>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
