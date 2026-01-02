import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
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
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
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
          <h1 {...props} className="mt-8 text-3xl font-semibold" />
        ),
        h2: (props: ComponentPropsWithoutRef<"h2">) => (
          <h2 {...props} className="mt-8 text-2xl font-semibold" />
        ),
        h3: (props: ComponentPropsWithoutRef<"h3">) => (
          <h3 {...props} className="mt-6 text-xl font-semibold" />
        ),
        h4: (props: ComponentPropsWithoutRef<"h4">) => (
          <h4 {...props} className="mt-6 text-lg font-semibold" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
