import type React from "react";

export default function ProjectsPage(): React.ReactElement {
  return (
    <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
      <div className="panel p-10 text-center">
        <div className="mb-3 text-sm uppercase tracking-widest text-neutral-500">Projects</div>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-neutral-100">Coming Soon</h1>
        <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-[color:var(--bg-elev-2)] shadow-hairline">
          <div className="h-2 w-1/3 animate-pulse rounded-full bg-[var(--accent)]" />
        </div>
      </div>
    </div>
  );
}
