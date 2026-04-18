import {
  buildPostMarkdownDocument,
  createMarkdownResponse,
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

export const revalidate = 3600;

export async function GET(_request: Request, { params }: RouteContext) {
  const { year, month, day, slug } = await params;
  const post = await getPostByPermalink(year, month, day, slug);

  if (!post) {
    return notFoundResponse();
  }

  return createMarkdownResponse(buildPostMarkdownDocument(post));
}
