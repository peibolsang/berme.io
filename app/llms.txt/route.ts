import { getBaseUrl } from "../../lib/site";

export async function GET() {
  const baseUrl = await getBaseUrl();
  const body = `# berme.io

> A personal site and technical blog by Pablo Bermejo, a product leader and technologist writing about enterprise software, product leadership, and software engineering.

## Core Resources
- [Home / Posts](${baseUrl}/?view=posts): Latest articles and writing.
- [Series](${baseUrl}/?view=series): Post series collections.
- [Books](${baseUrl}/?view=books): Reading list and recommendations.

## Documentation (if applicable)
- Not applicable.

## Optional
- [RSS Feed](${baseUrl}/feed.xml): Syndicated posts feed.
- [Sitemap](${baseUrl}/sitemap.xml): All site URLs.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
