import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "ProjectSol — Memory-first AI for real work",
  description: "Memory-first AI platform focused on structured memory, speed, and clean UX.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <div className="border-b border-neutral-800">
          <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <img src="/logo-sol.svg?v=1" alt="Sol" className="h-8 w-8 lg:h-9 lg:w-9" />
              <div className="font-semibold tracking-tight">ProjectSol</div>
            </div>
            <span className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300">
              {process.env.NEXT_PUBLIC_APP_ENV ?? "development"}
            </span>
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
      </body>
    </html>
  );
}
