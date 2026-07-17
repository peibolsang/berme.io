import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { Markdown } from "../../components/Markdown";

export const metadata: Metadata = {
  title: "Interactive post preview",
  description: "Local interactive-content experiment for berme.io.",
  robots: {
    follow: false,
    index: false,
  },
};

const previewMarkdownPath = path.join(
  process.cwd(),
  "content",
  "preview",
  "agent-ready-software-vs-software-ready-agents.md",
);

export default async function PreviewPage() {
  const markdown = await readFile(previewMarkdownPath, "utf8");

  return (
    <main className="min-h-screen bg-white dark:bg-slate-800">
      <header className="border-b border-zinc-200 bg-[#f4f1ea] px-6 py-10 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Interactive system test
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              This isolated route renders a local Markdown copy through the proposed
              allowlisted component registry.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <Link
              className="text-zinc-700 underline underline-offset-4 dark:text-zinc-200"
              href="/"
            >
              Back home
            </Link>
            <a
              className="text-zinc-700 underline underline-offset-4 dark:text-zinc-200"
              href="https://berme.io/2026/06/29/agent-ready-software-vs-software-ready-agents"
              rel="noreferrer"
              target="_blank"
            >
              Published post
            </a>
          </div>
        </div>
      </header>

      <article className="preview-markdown detail-markdown markdown-body mx-auto w-full max-w-[72rem] px-6 pb-24 pt-8">
        <Markdown content={markdown} />
      </article>
    </main>
  );
}
