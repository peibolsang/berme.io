"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type BackLinkProps = {
  fallbackView?: "posts" | "views" | "books" | "conferences";
  href?: string;
};

export const BackLink = ({ fallbackView, href }: BackLinkProps) => {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => {
    if (href) {
      return href;
    }
    const view = searchParams.get("view") ?? fallbackView;
    if (!view) {
      return "/";
    }
    return `/?view=${view}`;
  }, [fallbackView, href, searchParams]);

  return (
    <Link
      href={backHref}
      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    >
      ← Back
    </Link>
  );
};
