import { getContentIndex } from "../../lib/content-index";

export const revalidate = 3600;

export async function GET() {
  const index = await getContentIndex();

  return Response.json(index, {
    headers: {
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
    },
  });
}
