"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in the future
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
      <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
      <p className="mb-4 text-sm text-neutral-400">
        An unexpected error occurred. You can try again, or reload the page.
      </p>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          onClick={() => reset()}
        >
          Try again
        </button>
        <button
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-600"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    </div>
  );
}
