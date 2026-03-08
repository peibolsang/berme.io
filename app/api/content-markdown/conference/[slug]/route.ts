import { config } from "../../../../../lib/config";
import {
  buildConferenceMarkdownDocument,
  MARKDOWN_CONTENT_TYPE,
} from "../../../../../lib/markdown-exports";
import { getConferenceBySlug } from "../../../../../lib/conferences";

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
  const conference = await getConferenceBySlug(slug);

  if (!conference) {
    return notFoundResponse();
  }

  return new Response(buildConferenceMarkdownDocument(conference), {
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
    },
  });
}
