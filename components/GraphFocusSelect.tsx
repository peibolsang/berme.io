"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type GraphFocusOption = {
  id: string;
  title: string;
  type: string;
};

export const GraphFocusSelect = ({
  options,
  value,
}: {
  options: GraphFocusOption[];
  value: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("focus", nextValue);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <label className="flex items-center gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        Focus
      </span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="min-w-[18rem] rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 outline-none transition focus:border-zinc-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-zinc-100 dark:focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.type}: {option.title}
          </option>
        ))}
      </select>
    </label>
  );
};
