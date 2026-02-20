"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type BackLinkProps = {
  fallbackView?: "posts" | "views" | "books" | "conferences";
};

export const BackLink = ({ fallbackView }: BackLinkProps) => {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => {
    const view = searchParams.get("view") ?? fallbackView;
    if (!view || view === "posts") {
      return "/";
    }
    return `/?view=${view}`;
  }, [fallbackView, searchParams]);

  return (
    <Link
      href={backHref}
      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    >
      ← Back
    </Link>
  );
};
