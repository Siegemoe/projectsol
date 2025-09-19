import type React from "react";
import AppSidebar from "@/components/AppSidebar";
import AppViewportLock from "@/components/AppViewportLock";
import { supabaseServer } from "@/lib/supabase-server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialUser = user
    ? {
        name:
          ((user.user_metadata as any)?.name as string | undefined) ||
          (user.email as string | undefined) ||
          "Account",
        email: (user.email as string | null) ?? null,
        avatarUrl:
          ((user.user_metadata as any)?.avatar_url as string | undefined) ||
          ((user.user_metadata as any)?.picture as string | undefined) ||
          null,
      }
    : null;

  return (
    <div className="flex h-[calc(100vh-56px)] -mt-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <AppViewportLock />
      {/* Full-height left rail */}
      <AppSidebar initialUser={initialUser ?? undefined} />

      {/* Main content column */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* Page content (no card/borders/heading) */}
        <div className="flex-1 overflow-hidden px-2 py-2 sm:px-4 sm:py-4">
          {children}
        </div>
      </section>
    </div>
  );
}
