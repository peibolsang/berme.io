import { getConferences } from "../../../../lib/conferences";
import { getBooks } from "../../../../lib/books";
import {
  buildHomeMarkdownDocument,
  createMarkdownResponse,
} from "../../../../lib/markdown-exports";
import { getNowPost } from "../../../../lib/now";
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
  const section = url.pathname.slice(1);
  const routeView = section === "talks" ? "conferences" : section;
  const isIndexRoute = ["posts", "views", "books", "conferences"].includes(routeView);
  const activeView = normalizeView(isIndexRoute ? routeView : url.searchParams.get("view"));
  const [baseUrl, posts, views, nowPost, conferences] = await Promise.all([
    getBaseUrl(),
    getAllPosts(),
    getAllViews(),
    getNowPost(),
    getConferences(),
  ]);
  const markdown = buildHomeMarkdownDocument({
    baseUrl,
    activeView,
    canonicalUrl: isIndexRoute || url.searchParams.has("view")
      ? (activeView === "conferences" ? "/talks" : `/${activeView}`)
      : "/",
    posts,
    pinned: posts.filter((post) => post.pinned).slice(0, 3),
    views,
    books: getBooks(),
    conferences,
    nowPost,
  });

  return createMarkdownResponse(markdown);
}
