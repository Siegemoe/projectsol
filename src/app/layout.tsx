import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectSol",
  description: "Memory-first AI platform",
  openGraph: { images: ["/og-image.png"] },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <div className="border-b border-neutral-800">
          <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <img src="/logo-sol.svg?v=1" alt="Sol" className="h-6 w-6" />
              <div className="font-semibold tracking-tight">ProjectSol</div>
            </div>
            <span className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300">
              {process.env.NEXT_PUBLIC_APP_ENV ?? "development"}
            </span>
          </header>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} ProjectSol
        </footer>
      </body>
    </html>
  );
}
