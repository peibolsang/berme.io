"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const KnowPablo = () => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="know-pablo-root pointer-events-none z-50 md:hidden">
      {open && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="pointer-events-auto z-40 bg-black/25 backdrop-blur-[2px] dark:bg-black/50"
          style={{ position: "fixed", inset: 0 }}
        />
      )}
      <div className="z-50">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-md transition-all duration-200 ease-out ${
            open
              ? "border-zinc-300 bg-[#f4f1ea] scale-[1.02] text-zinc-700"
              : "border-zinc-200 bg-white text-zinc-700"
          } dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-200 dark:enabled:bg-slate-800`}
          style={{
            position: "fixed",
            right: "1.25rem",
            bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
            zIndex: 60,
            pointerEvents: "auto",
          }}
        >
          Know Pablo
          <span
            className={`ml-2 inline-block text-[10px] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </button>
        <div
          className={`transition-all duration-200 ease-out ${
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{
            position: "fixed",
            right: "1.25rem",
            bottom: "calc(1.25rem + env(safe-area-inset-bottom) + 3.25rem)",
            zIndex: 55,
            pointerEvents: open ? "auto" : "none",
          }}
        >
          <div className="w-[90vw] max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl ring-1 ring-zinc-200/70 transition-all duration-200 ease-out dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700/60">
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              I am a product leader, distinguished technologist, and writer. I've been
              building enterprise software platforms and applications for the last 20 years,
              and I love sharing what I learn.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              I create a lasting difference in the teams I work with as we build technology
              together.
            </p>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                Links
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com/peibolsang"
                    className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/pablobermejo/"
                    className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/peibolsang"
                    className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                  >
                    X (Twitter)
                  </a>
                </li>
              </ul>
            </div>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                Books
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="https://leanpub.com/software-platforms"
                    className="text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
                  >
                    Software Platforms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
