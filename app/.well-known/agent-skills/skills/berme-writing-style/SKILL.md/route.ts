import { getPublishedAgentSkillByName } from "../../../../../../lib/agent-skills";

export const revalidate = 3600;

const notFoundResponse = () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });

export async function GET() {
  const skill = getPublishedAgentSkillByName("berme-writing-style");

  if (!skill) {
    return notFoundResponse();
  }

  return new Response(skill.content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
    },
  });
}
