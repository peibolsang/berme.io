"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

const STORAGE_KEY = "theme";

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const fallback = prefersDark ? "dark" : "light";
      setTheme(fallback);
      applyTheme(fallback);
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      aria-label="Toggle dark mode"
      className="fixed right-6 top-6 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-slate-900 dark:text-zinc-200"
      onClick={toggle}
      type="button"
    >
      {mounted ? (
        theme === "dark" ? (
          <SunIcon className="h-4 w-4 text-amber-400" />
        ) : (
          <MoonIcon className="h-4 w-4" />
        )
      ) : (
        <span className="text-xs leading-none">•</span>
      )}
    </button>
  );
};
