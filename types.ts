export type Post = {
  id: string;
  number: number;
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  author?: {
    name: string;
    login?: string;
    avatarUrl?: string | null;
    url?: string | null;
  };
  excerpt?: string;
  image?: string;
  pinned?: boolean;
  readCount?: number;
  popularRank?: number | null;
  isPopular?: boolean;
  viewTitle?: string;
  viewNumber?: number;
  viewSlug?: string;
  body: string;
  labels: string[];
  url: string;
};

export type View = {
  number: number;
  title: string;
  slug: string;
  description?: string;
  body?: string;
  bodyHtml?: string;
  updatedAt: string;
  author?: {
    name: string;
    login?: string;
    avatarUrl?: string | null;
    url?: string | null;
  };
  url: string;
  posts: Post[];
};

export type Book = {
  title: string;
  description: string;
  coverImage: string;
  url: string;
  cta: string;
  status?: "published" | "upcoming";
};

export type Conference = {
  id: string;
  number: number;
  slug: string;
  title: string;
  event: string;
  date: string;
  summary: string;
  pdfPath: string;
  pageCount: number;
  contentDensity: "light" | "medium" | "dense";
  location?: string;
  labels: string[];
  url: string;
};
