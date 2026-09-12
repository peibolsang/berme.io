import { getBaseUrl } from "../../lib/site";

export async function GET() {
  const baseUrl = await getBaseUrl();
  const body = `# berme.io

> A personal site and technical blog by Pablo Bermejo, a product leader and technologist writing about enterprise software, product leadership, and software engineering.

## Core Resources
- [About me](${baseUrl}/about): Pablo’s background, interests, and an invitation to connect.
- [Posts](${baseUrl}/posts): Latest articles and writing.
- [Views](${baseUrl}/views): Post view collections.
- [Books](${baseUrl}/books): Reading list and recommendations.
- [Videos](${baseUrl}/videos): Videos and companion articles.
- [Conferences](${baseUrl}/talks): Conference talks and seminar presentations.

## Documentation (if applicable)
- Not applicable.

## Optional
- [RSS Feed](${baseUrl}/feed.xml): Syndicated posts feed.
- [Sitemap](${baseUrl}/sitemap.md): All site URLs in Markdown.
- [Structured Sitemap JSON](${baseUrl}/sitemap.json): Machine-readable content index with canonical and markdown URLs.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
