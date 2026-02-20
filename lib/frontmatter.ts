import matter from "gray-matter";

type FrontmatterData = {
  slug?: string;
  publishedAt?: string;
  excerpt?: string;
  image?: string;
  draft?: boolean;
  event?: string;
  location?: string;
  pdfUrl?: string;
  pdfPath?: string;
  pdf?: string;
  slides?: string;
};

export type FrontmatterResult = {
  body: string;
  data: FrontmatterData;
};

export const parseFrontmatter = (content: string): FrontmatterResult => {
  const parsed = matter(content, {
    excerpt: false,
  });

  const data = (parsed.data ?? {}) as FrontmatterData;

  return {
    body: parsed.content.trim(),
    data,
  };
};
