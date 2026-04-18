import { getConferences } from "../../../../lib/conferences";
import { getBooks } from "../../../../lib/books";
import {
  buildHomeMarkdownDocument,
  createMarkdownResponse,
} from "../../../../lib/markdown-exports";
import { getNowPost } from "../../../../lib/now";
import { getPopularPosts } from "../../../../lib/post-popularity";
import { getAllPosts } from "../../../../lib/posts";
import { getBaseUrl } from "../../../../lib/site";
import { getAllViews } from "../../../../lib/views";

export const revalidate = 3600;

const normalizeView = (value: string | null) => {
  if (value === "views" || value === "books" || value === "conferences") {
    return value;
  }
  return "posts";
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const activeView = normalizeView(url.searchParams.get("view"));
  const [baseUrl, posts, views, nowPost, conferences] = await Promise.all([
    getBaseUrl(),
    getAllPosts(),
    getAllViews(),
    getNowPost(),
    getConferences(),
  ]);
  const popular = await getPopularPosts(posts);
  const markdown = buildHomeMarkdownDocument({
    baseUrl,
    activeView,
    posts,
    pinned: posts.filter((post) => post.pinned).slice(0, 3),
    popular,
    views,
    books: getBooks(),
    conferences,
    nowPost,
  });

  return createMarkdownResponse(markdown);
}
