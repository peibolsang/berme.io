import { getBaseUrl } from "../../lib/site";

export async function GET() {
  const baseUrl = await getBaseUrl();
  const body = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.md
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
