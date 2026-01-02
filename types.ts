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
  body: string;
  labels: string[];
  url: string;
};
