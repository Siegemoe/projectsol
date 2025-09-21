"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Mail, PlugZap, Shield } from "lucide-react";

type GmailStatus =
  | { connected: true; email: string | null }
  | { connected: false; error?: string };

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tab = (search.get("tab") || "general").toLowerCase();

  function setTab(next: string) {
    const href = (`/app/settings?tab=${encodeURIComponent(next)}`) as Route;
    router.push(href);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* Tabs */}
      <div className="">
        <nav className="-mb-px flex gap-4">
          <button
            type="button"
            onClick={() => setTab("general")}
            className={classNames(
              "whitespace-nowrap px-3 pb-2 text-sm transition-colors",
              tab === "general"
                ? "text-text"
                : "text-text-dim hover:text-text"
            )}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setTab("connections")}
            className={classNames(
              "whitespace-nowrap px-3 pb-2 text-sm transition-colors",
              tab === "connections"
                ? "text-text"
                : "text-text-dim hover:text-text"
            )}
          >
            Connections
          </button>
        </nav>
      </div>

      {tab === "general" ? (
        <div className="space-y-3">
          <p className="text-neutral-300">
            Preferences and profile controls will appear here. Placeholder for now.
          </p>
        </div>
      ) : null}

      {tab === "connections" ? (
        <div className="space-y-4">
          <div className="panel">
            <div className="flex items-center gap-2 px-4 py-3">
              <PlugZap className="h-4 w-4 text-neutral-300" />
              <h2 className="text-sm font-medium text-neutral-200">Connections</h2>
            </div>

            <div className="p-4 space-y-4">
              <GmailConnectionCard />
              <div className="rounded-lg bg-[color:var(--bg-elev-2)] p-3 text-xs text-neutral-400 flex items-start gap-2 shadow-hairline">
                <Shield className="h-4 w-4 mt-0.5 text-neutral-400" />
                <div>
                  Tokens are stored server-side and refresh tokens are encrypted at rest.
                  Only read-only access is requested in this phase.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function GmailConnectionCard() {
  const search = useSearchParams();
  const tabBack = "connections";
  const next = `/app/chat?email=1`;
  const connectHref = `/api/gmail/connect?next=${encodeURIComponent(next)}`;

  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/gmail/status", { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText}: ${t}`);
        }
        const j = (await r.json()) as GmailStatus;
        if (!cancelled) setStatus(j);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load status");
          setStatus({ connected: false, error: "failed" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = status?.connected === true;
  const email = (status && "email" in status ? status.email : null) || null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-[color:var(--bg-elev-2)] p-4 shadow-hairline">
      <div className="mt-1 rounded-md bg-[color:var(--bg-elev-2)] p-2 shadow-hairline">
        <Mail className="h-5 w-5 text-neutral-300" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-200">Gmail</div>
          {connected ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-900/50 bg-green-900/20 px-2 py-0.5 text-[11px] text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </span>
          ) : null}
        </div>
        <div className="mt-1 text-sm text-neutral-400">
          {connected ? (
            <>
              Connected as <span className="text-neutral-200">{email || "your account"}</span>. The Email tool
              will pull Inbox threads read-only.
            </>
          ) : (
            <>Connect your Gmail account to view Inbox threads in the Email tool (read-only).</>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {!connected ? (
            <a
              href={connectHref}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--bg-elev-2)] px-3 py-1.5 text-sm text-text shadow-hairline"
            >
              <PlugZap className="h-4 w-4 text-neutral-300" />
              Connect Gmail
            </a>
          ) : (
            <>
              <span className="text-xs text-neutral-500">No disconnect yet</span>
            </>
          )}
          {loading ? <span className="text-xs text-neutral-500">Checking status…</span> : null}
          {error ? <span className="text-xs text-red-400">{error}</span> : null}
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          Requires Google OAuth approval with the Gmail API. Scope: gmail.readonly.
        </div>
      </div>
    </div>
  );
}
