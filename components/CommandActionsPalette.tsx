"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  GitHubLogoIcon,
  Link2Icon,
  Pencil1Icon,
  ArrowLeftIcon,
  InfoCircledIcon,
  Link1Icon,
  MagicWandIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";

type CommandActionsPaletteProps = {
  title: string;
  url: string;
  githubUrl?: string;
  markdown: string;
  readingTime?: string;
  metadataLines?: string[];
  relatedPosts?: Array<{ title: string; url: string }>;
  geminiPrompt?: string;
  linkCommands?: Array<{
    id: string;
    label: string;
    letter: string;
    url: string;
    mode?: "open" | "download";
  }>;
  enableCopyMarkdown?: boolean;
  enableRelatedPosts?: boolean;
  showTrigger?: boolean;
};

type CommandAction = {
  id: string;
  label: string;
  letter: string;
  icon: typeof GitHubLogoIcon;
  action: () => void | Promise<void>;
  closeOnRun: boolean;
  confirmation?: ReactNode;
};

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
};

export const CommandActionsPalette = ({
  title,
  url,
  githubUrl,
  markdown,
  readingTime,
  metadataLines,
  relatedPosts,
  geminiPrompt,
  linkCommands = [],
  enableCopyMarkdown = true,
  enableRelatedPosts = true,
  showTrigger = false,
}: CommandActionsPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [shortcutLabel] = useState(() => {
    if (typeof navigator === "undefined") {
      return "Cmd+K";
    }
    return navigator.platform.toLowerCase().includes("mac") ? "Cmd+K" : "Ctrl+K";
  });
  const [confirmation, setConfirmation] = useState<ReactNode | null>(null);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setConfirmation(null);
  }, [setConfirmation, setOpen, setQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const copyToClipboard = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };
  const canonicalUrl =
    typeof window === "undefined"
      ? url
      : url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
  const resolvedMetadataLines =
    metadataLines && metadataLines.length > 0
      ? metadataLines
      : [
          `Title: ${title}`,
          readingTime ? `Reading time: ${readingTime}` : "Reading time: N/A",
          `URL: ${url}`,
          ...(githubUrl ? [`GitHub: ${githubUrl}`] : []),
        ];

  const triggerDownload = (downloadUrl: string) => {
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const commands: CommandAction[] = [
    ...(githubUrl
      ? [
          {
            id: "github",
            label: "Open in GitHub",
            letter: "G",
            icon: GitHubLogoIcon,
            action: () => window.open(githubUrl, "_blank", "noopener,noreferrer"),
            closeOnRun: true,
          },
        ]
      : []),
    ...linkCommands.map((command) => ({
      id: command.id,
      label: command.label,
      letter: command.letter,
      icon: command.mode === "download" ? Link1Icon : Link2Icon,
      action: () => {
        if (command.mode === "download") {
          triggerDownload(command.url);
          return;
        }
        window.open(command.url, "_blank", "noopener,noreferrer");
      },
      closeOnRun: true,
    })),
    {
      id: "copy-link",
      label: "Copy Link",
      letter: "L",
      icon: Link2Icon,
      action: () => copyToClipboard(canonicalUrl),
      confirmation: "Link copied to clipboard.",
      closeOnRun: false,
    },
    ...(enableCopyMarkdown
      ? [
          {
            id: "copy-markdown",
            label: "Copy as Markdown",
            letter: "M",
            icon: Pencil1Icon,
            action: () => copyToClipboard(markdown),
            confirmation: "Markdown copied to clipboard.",
            closeOnRun: false,
          },
        ]
      : []),
    {
      id: "metadata",
      label: "View Metadata",
      letter: "V",
      icon: InfoCircledIcon,
      action: () => {},
      confirmation: resolvedMetadataLines.length ? (
        <div className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Metadata
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <tbody>
                {resolvedMetadataLines.map((line) => {
                  const [label, ...rest] = line.split(":");
                  const value = rest.join(":").trim();
                  return (
                    <tr
                      key={line}
                      className="border-t border-zinc-200 first:border-t-0 dark:border-slate-700"
                    >
                      <th className="w-1/3 px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-200">
                        {label.trim()}
                      </th>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                        {value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        "Metadata not available."
      ),
      closeOnRun: false,
    },
    ...(enableRelatedPosts
      ? [
          {
            id: "related-posts",
            label: "Show Related Posts",
            letter: "R",
            icon: Link1Icon,
            action: () => {},
            confirmation: relatedPosts?.length ? (
              <div className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Related posts
                </div>
                <ul className="space-y-2 pb-1">
                  {relatedPosts.map((post) => (
                    <li key={post.url}>
                      <Link
                        href={post.url}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                        onClick={() => closePalette()}
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              "No related posts found."
            ),
            closeOnRun: false,
          },
        ]
      : []),
    ...(geminiPrompt
      ? [
          {
            id: "gemini",
            label: "Discuss with Gemini",
            letter: "D",
            icon: MagicWandIcon,
            action: () =>
              copyToClipboard(geminiPrompt),
            confirmation: (
              <div className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Prompt ready
                </div>
                <p className="mb-4">
                  A prompt has been copied to your clipboard. Open Gemini and paste it
                  to start the conversation.
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 transition hover:text-zinc-900 dark:border-slate-700 dark:text-zinc-300 dark:hover:text-white"
                    onClick={() =>
                      window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer")
                    }
                  >
                    Open in Gemini
                  </button>
                </div>
              </div>
            ),
            closeOnRun: false,
          },
        ]
      : []),
  ];

  const commandByLetter = new Map(
    commands.map((command) => [command.letter.toLowerCase(), command]),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCommands =
    normalizedQuery.length === 0
      ? commands
      : commands.filter((command) => command.label.toLowerCase().includes(normalizedQuery));

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 shadow-sm transition hover:text-zinc-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-label="Open commands"
        >
          <span>Commands</span>
          <span className="rounded-full border border-current/20 px-2 py-[1px] text-[9px]">
            {shortcutLabel}
          </span>
        </button>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex min-h-[100dvh] w-full items-start justify-center bg-zinc-900/50 px-4 pb-6 pt-16 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePalette();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <Command shouldFilter={false}>
              <div className="relative">
                {confirmation ? (
                  <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 dark:border-slate-700 dark:text-zinc-300">
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:text-zinc-700 dark:border-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      onClick={() => setConfirmation(null)}
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm">Back to commands</span>
                  </div>
                ) : (
                  <>
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                      <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <CommandInput
                      ref={inputRef}
                      placeholder="Type to filter commands..."
                      value={query}
                      onValueChange={setQuery}
                      onKeyDown={(event) => {
                        if (query.length > 0) {
                          return;
                        }
                        const command = commandByLetter.get(event.key.toLowerCase());
                        if (!command) {
                          return;
                        }
                        event.preventDefault();
                        command.action();
                        if (command.closeOnRun) {
                          closePalette();
                          return;
                        }
                        setConfirmation(command.confirmation ?? "Done.");
                      }}
                      className="pl-10"
                    />
                  </>
                )}
              </div>
              <CommandList className="max-h-[60vh] overflow-y-auto">
                {confirmation ? (
                  <div className="flex max-h-[50vh] items-start justify-center px-6 py-6 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="w-full break-words">{confirmation}</div>
                  </div>
                ) : (
                  <>
                    {filteredCommands.length === 0 ? (
                      <div className="py-6 text-center text-sm text-zinc-500">
                        No commands match that query.
                      </div>
                    ) : (
                      <CommandGroup className="space-y-1 px-3 pb-2 pt-3">
                        {filteredCommands.map((command) => (
                          <CommandItem
                            key={command.id}
                            value={command.label}
                            onSelect={() => {
                              command.action();
                              if (command.closeOnRun) {
                                closePalette();
                                return;
                              }
                              setConfirmation(command.confirmation ?? "Done.");
                            }}
                            className="flex items-center justify-between gap-3 px-2 py-2"
                          >
                            <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                              <command.icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                              {command.label}
                            </span>
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 text-[11px] font-semibold uppercase text-zinc-500 dark:border-slate-700 dark:text-zinc-400">
                              {command.letter}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-400 dark:border-slate-700 dark:text-zinc-500">
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
