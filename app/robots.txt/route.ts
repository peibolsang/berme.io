import { getBaseUrl } from "../../lib/site";

export async function GET() {
  const baseUrl = await getBaseUrl();
  const body = `User-agent: *
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=no
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
