"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export const BackLink = () => {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => {
    const view = searchParams.get("view");
    return view === "series" ? "/?view=series" : "/";
  }, [searchParams]);

  return (
    <Link
      href={backHref}
      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    >
      ← Back
    </Link>
  );
};
