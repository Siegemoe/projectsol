import type React from "react";
import AppBar from "@/components/AppBar";
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
      {/* App shell with central App Bar */}
      <section className="flex-1 flex flex-col overflow-hidden w-full">
        <AppBar />
        <div className="flex-1 overflow-hidden px-2 py-2 sm:px-4 sm:py-4">{children}</div>
      </section>
    </div>
  );
}
