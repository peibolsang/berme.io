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
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Bio
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
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
              <ul className="mt-3 flex items-center gap-4 text-sm">
                <li>
                  <a
                    href="https://github.com/peibolsang"
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="GitHub"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.74 1.27 3.41.97.1-.75.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.24 2.76.12 3.05.74.81 1.19 1.85 1.19 3.11 0 4.43-2.69 5.4-5.25 5.69.42.36.8 1.08.8 2.18 0 1.57-.02 2.83-.02 3.22 0 .31.21.68.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                    </svg>
                    <span className="sr-only">GitHub</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/pablobermejo/"
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="LinkedIn"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6S0 4.88 0 3.5 1.11 1 2.49 1s2.49 1.12 2.49 2.5ZM0.5 8.5h4V23h-4V8.5Zm7.5 0h3.8v2h.05c.53-1 1.8-2.05 3.7-2.05 3.95 0 4.95 2.6 4.95 6V23h-4v-6.9c0-1.65-.03-3.78-2.3-3.78-2.3 0-2.65 1.8-2.65 3.66V23h-4V8.5Z" />
                    </svg>
                    <span className="sr-only">LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/peibolsang"
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label="X"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26L22.5 21.75h-6.4l-5.012-6.563-5.744 6.563H2.036l7.73-8.835L1.5 2.25h6.563l4.534 5.98L18.244 2.25Zm-1.161 17.52h1.833L7.04 4.126H5.074l12.009 15.644Z" />
                    </svg>
                    <span className="sr-only">X</span>
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
