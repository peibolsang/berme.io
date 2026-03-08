import { config } from "../../../../../lib/config";
import {
  buildViewMarkdownDocument,
  MARKDOWN_CONTENT_TYPE,
} from "../../../../../lib/markdown-exports";
import { getViewBySlug } from "../../../../../lib/views";

type RouteContext = {
  params: Promise<{
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
  const { slug } = await params;
  const view = await getViewBySlug(slug);

  if (!view) {
    return notFoundResponse();
  }

  return new Response(buildViewMarkdownDocument(view), {
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
    },
  });
}
