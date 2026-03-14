import { slugify } from "./slugify";

type MarkdownNode = {
  type?: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: MarkdownNode[];
};

export type MarkdownHeading = {
  id: string;
  text: string;
  depth: number;
  wordCount: number;
  effortMinutes: number;
};

export type MarkdownOutline = {
  headings: MarkdownHeading[];
  totalWords: number;
  totalMinutes: number;
  isLongform: boolean;
};

export const sanitizedHeadingIdPrefix = "user-content-";

export const getSanitizedHeadingId = (id: string) =>
  `${sanitizedHeadingIdPrefix}${id}`;

const wordsPerMinute = 200;
const minWordsForNarrativeShell = 900;
const minHeadingsForNarrativeShell = 3;

const countWords = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const getNodeText = (node: MarkdownNode | undefined): string => {
  if (!node) {
    return "";
  }

  if (typeof node.value === "string") {
    return node.value;
  }

  if (typeof node.alt === "string") {
    return node.alt;
  }

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return "";
  }

  return node.children.map((child) => getNodeText(child)).join(" ");
};

export const getReadingMinutesFromWords = (wordCount: number) =>
  Math.max(1, Math.ceil(wordCount / wordsPerMinute));

export const formatReadingTime = (wordCount: number) =>
  `${getReadingMinutesFromWords(wordCount)} min read`;

const createUniqueHeadingId = (counts: Map<string, number>, text: string) => {
  const base = slugify(text) || "section";
  const seen = counts.get(base) ?? 0;
  counts.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen + 1}`;
};

export const extractMarkdownOutline = async (
  content: string,
): Promise<MarkdownOutline> => {
  const { unified } = await import("unified");
  const { default: remarkParse } = await import("remark-parse");
  const { default: remarkGfm } = await import("remark-gfm");

  const tree = unified().use(remarkParse).use(remarkGfm).parse(content) as MarkdownNode;
  const nodes = Array.isArray(tree.children) ? tree.children : [];
  const headingIdCounts = new Map<string, number>();
  const headings: MarkdownHeading[] = [];
  let currentHeading: MarkdownHeading | null = null;
  let totalWords = 0;
  const finalizeHeading = (heading: MarkdownHeading | null) => {
    if (!heading) {
      return;
    }

    heading.effortMinutes = getReadingMinutesFromWords(heading.wordCount);
  };

  nodes.forEach((node) => {
    const nodeText = getNodeText(node);
    const nodeWordCount = countWords(nodeText);
    totalWords += nodeWordCount;

    if (node.type === "heading" && typeof node.depth === "number" && node.depth >= 2) {
      finalizeHeading(currentHeading);

      const headingText = nodeText.trim();
      if (!headingText) {
        currentHeading = null;
        return;
      }

      currentHeading = {
        id: createUniqueHeadingId(headingIdCounts, headingText),
        text: headingText,
        depth: node.depth,
        wordCount: 0,
        effortMinutes: 1,
      };

      headings.push(currentHeading);
      return;
    }

    if (currentHeading) {
      currentHeading.wordCount += nodeWordCount;
    }
  });

  finalizeHeading(currentHeading);

  return {
    headings: headings.filter((heading) => heading.depth <= 4),
    totalWords,
    totalMinutes: getReadingMinutesFromWords(totalWords),
    isLongform:
      totalWords >= minWordsForNarrativeShell &&
      headings.length >= minHeadingsForNarrativeShell,
  };
};

export const remarkHeadingAnchors = () => {
  return (tree: MarkdownNode) => {
    const headingIdCounts = new Map<string, number>();

    const visit = (node: MarkdownNode) => {
      if (node.type === "heading") {
        const headingText = getNodeText(node).trim();
        const id = createUniqueHeadingId(headingIdCounts, headingText);
        const nextNode = node as MarkdownNode & {
          data?: { hProperties?: Record<string, string> };
        };
        nextNode.data = {
          ...(nextNode.data ?? {}),
          hProperties: {
            ...(nextNode.data?.hProperties ?? {}),
            id,
          },
        };
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  };
};
