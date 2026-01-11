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
  viewTitle?: string;
  viewNumber?: number;
  body: string;
  labels: string[];
  url: string;
};

export type View = {
  number: number;
  title: string;
  description?: string;
  body?: string;
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
