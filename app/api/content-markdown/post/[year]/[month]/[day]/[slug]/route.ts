import { config } from "../../../../../../../../lib/config";
import {
  buildPostMarkdownDocument,
  MARKDOWN_CONTENT_TYPE,
} from "../../../../../../../../lib/markdown-exports";
import { getPostByPermalink } from "../../../../../../../../lib/posts";

type RouteContext = {
  params: Promise<{
    year: string;
    month: string;
    day: string;
    slug: string;
  }>;
};

const notFoundResponse = () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });

export const revalidate = config.revalidateSeconds;

export async function GET(_request: Request, { params }: RouteContext) {
  const { year, month, day, slug } = await params;
  const post = await getPostByPermalink(year, month, day, slug);

  if (!post) {
    return notFoundResponse();
  }

  return new Response(buildPostMarkdownDocument(post), {
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
    },
  });
}
