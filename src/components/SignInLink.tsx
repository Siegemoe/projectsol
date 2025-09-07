"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Route } from "next";
import React from "react";

export default function SignInLink({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = React.useMemo(() => {
    const path = pathname || "/";
    const qs = searchParams?.toString();
    return qs && qs.length > 0 ? `${path}?${qs}` : path;
  }, [pathname, searchParams]);

  const href = (`/signin?next=${encodeURIComponent(current)}`) as Route;

  return (
    <Link href={href} className={className}>
      {children ?? "Sign in"}
    </Link>
  );
}
