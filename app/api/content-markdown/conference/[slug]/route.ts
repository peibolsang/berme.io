import {
  buildConferenceMarkdownDocument,
  createMarkdownResponse,
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

export const revalidate = 3600;

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);

  if (!conference) {
    return notFoundResponse();
  }

  return createMarkdownResponse(buildConferenceMarkdownDocument(conference));
}
