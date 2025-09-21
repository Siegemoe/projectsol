import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import type { Route } from "next";
import SignInLink from "@/components/SignInLink";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { supabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "ProjectSol — Memory-first AI for real work",
  description: "Memory-first AI platform focused on structured memory, speed, and clean UX.",
  // Used for resolving absolute URLs for OG/Twitter images in production
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    title: "ProjectSol — Memory-first AI for real work",
    description: "Memory-first AI platform focused on structured memory, speed, and clean UX.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProjectSol — Memory-first AI for real work",
    description: "Memory-first AI platform focused on structured memory, speed, and clean UX.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <div className="border-b border-neutral-800">
          <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
            <Link href={"/" as Route} className="flex items-center gap-3 hover:opacity-90">
            <div className="font-semibold tracking-tight">ProjectSol</div>
            </Link>
            <nav className="flex items-center gap-3">
              {/* Removed Home and Chat from the top header per request */}
              {!user && (
                <Suspense
                  fallback={
                    <Link href={"/signin" as Route} className="text-sm hover:text-neutral-300">
                      Sign in
                    </Link>
                  }
                >
                  <SignInLink className="text-sm hover:text-neutral-300">Sign in</SignInLink>
                </Suspense>
              )}
              <span className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300">
                {process.env.NEXT_PUBLIC_APP_ENV ?? "development"}
              </span>
            </nav>
          </header>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-neutral-500">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} ProjectSol</div>
            <nav className="flex items-center gap-3">
              <Link href={"/privacy" as Route} className="hover:text-neutral-300">Privacy</Link>
              <span aria-hidden="true">·</span>
              <Link href={"/terms" as Route} className="hover:text-neutral-300">Terms</Link>
              <span aria-hidden="true">·</span>
              <Link href={"/contact" as Route} className="hover:text-neutral-300">Contact</Link>
            </nav>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
