import type React from "react";
import AppSidebar from "@/components/AppSidebar";
import AppViewportLock from "@/components/AppViewportLock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-56px)] -mt-10 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <AppViewportLock />
      {/* Full-height left rail */}
      <AppSidebar />

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
