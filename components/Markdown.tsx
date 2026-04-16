import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { remarkHeadingAnchors } from "../lib/markdown-headings";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(new Set([...(defaultSchema.tagNames ?? []), "img"])),
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "width",
      "height",
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-/],
    ],
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
      ["className", /^language-/],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", /^hljs/],
    ],
  },
};

type MarkdownProps = {
  content: string;
};

export const Markdown = ({ content }: MarkdownProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkHeadingAnchors]}
      rehypePlugins={[
        rehypeRaw,
        rehypeHighlight,
        [rehypeSanitize, sanitizeSchema],
      ]}
      components={{
        ul: (props: ComponentPropsWithoutRef<"ul">) => (
          <ul {...props} className="my-4 list-disc pl-5" />
        ),
        ol: (props: ComponentPropsWithoutRef<"ol">) => (
          <ol {...props} className="my-4 list-decimal pl-5" />
        ),
        li: (props: ComponentPropsWithoutRef<"li">) => (
          <li {...props} className="my-1" />
        ),
        a: (props: ComponentPropsWithoutRef<"a">) => (
          <a
            {...props}
            className="text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
            rel={props.rel ?? "noreferrer"}
          />
        ),
        blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
          <blockquote
            {...props}
            className="my-6 border-l-2 border-zinc-200 pl-4 text-zinc-600"
          />
        ),
        h1: (props: ComponentPropsWithoutRef<"h1">) => (
          <h1
            {...props}
            className="scroll-mt-28 mt-8 text-3xl font-semibold text-zinc-900 dark:text-zinc-100"
          />
        ),
        h2: (props: ComponentPropsWithoutRef<"h2">) => (
          <h2
            {...props}
            className="scroll-mt-28 mt-10 text-2xl font-semibold text-zinc-900 dark:text-zinc-100"
          />
        ),
        h3: (props: ComponentPropsWithoutRef<"h3">) => (
          <h3
            {...props}
            className="scroll-mt-28 mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100"
          />
        ),
        h4: (props: ComponentPropsWithoutRef<"h4">) => (
          <h4
            {...props}
            className="scroll-mt-28 mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
