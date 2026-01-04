export type Post = {
  id: string;
  number: number;
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  excerpt?: string;
  image?: string;
  pinned?: boolean;
  seriesTitle?: string;
  body: string;
  labels: string[];
  url: string;
};

export type Series = {
  number: number;
  title: string;
  description?: string;
  updatedAt: string;
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
