import {
  AGENT_SKILLS_DISCOVERY_SCHEMA,
  getPublishedAgentSkills,
} from "../../../../lib/agent-skills";

export const revalidate = 3600;

export async function GET() {
  const skills = getPublishedAgentSkills().map(
    ({ name, type, description, url, digest }) => ({
      name,
      type,
      description,
      url,
      digest,
    }),
  );

  return Response.json(
    {
      $schema: AGENT_SKILLS_DISCOVERY_SCHEMA,
      skills,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
      },
    },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
}
