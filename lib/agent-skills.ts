import { createHash } from "crypto";

export const AGENT_SKILLS_DISCOVERY_SCHEMA =
  "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

type PublishedSkill = {
  name: string;
  description: string;
  path: string;
  content: string;
};

const contentDiscoverySkillContent = `---
name: berme-content-discovery
description: Discover and navigate berme.io content efficiently. Use when asked to find posts, views, conferences, the /now page, canonical URLs, or machine-readable entry points on berme.io.
license: CC-BY-4.0
compatibility: Works best with agents that can fetch HTML, text/markdown, and JSON over HTTP.
metadata:
  author: berme.io
  version: "1.0"
---

# berme-content-discovery

Use this skill to orient yourself quickly on berme.io and retrieve the best machine-readable version of the content you need.

## What this site contains

- Posts published as dated canonical URLs such as \`/2022/01/16/the-future-of-cloud-computing-is-developer-experience\`
- Views at \`/views/<slug>\`
- Conferences at \`/conferences/<slug>\`
- A current-status page at \`/now\`
- Homepage sections controlled by \`?view=posts|views|books|conferences\`

## Recommended discovery order

1. Start with \`/llms.txt\` for a compact summary of the major public surfaces.
2. Fetch \`/sitemap.json\` when you need a structured inventory of posts, views, and conferences with canonical HTML URLs.
3. Use \`/sitemap.xml\` when you need canonical crawl-friendly URLs only.
4. Open \`/now\` for the author's current focus.
5. Use the homepage with a \`view\` query parameter when the request is category-oriented:
   - \`/?view=posts\`
   - \`/?view=views\`
   - \`/?view=books\`
   - \`/?view=conferences\`

## Prefer markdown when reading

If you are reading content rather than browsing visually, request:

- \`Accept: text/markdown\`

The site supports Markdown negotiation for:

- \`/\`
- \`/now\`
- post URLs
- view URLs
- conference URLs

The response should use \`Content-Type: text/markdown\`.

## URL guidance

- Prefer canonical HTML URLs when citing or sharing links.
- Prefer Markdown responses when summarizing or extracting content.
- Prefer \`/sitemap.json\` when you need to search or filter the site's content catalog programmatically.

## Practical patterns

- To answer "what is this site about?": read \`/\` and \`/now\`.
- To find a post on a topic: read \`/sitemap.json\`, filter by title, summary, labels, and then open the matching canonical URL.
- To understand a long-running theme: inspect the relevant \`/views/<slug>\` page.
- To find talks: use \`/?view=conferences\` or \`/sitemap.json\` entries of type \`conference\`.
`;

const writingStyleSkillContent = `---
name: berme-writing-style
description: Write or revise text in a style aligned with Pablo Bermejo's public site voice. Use when asked to draft, rewrite, or critique content so it feels consistent with berme.io's themes, tone, and explanatory style.
license: CC-BY-4.0
compatibility: Works best with agents that can read berme.io pages in HTML or Markdown form.
metadata:
  author: berme.io
  version: "1.0"
---

# berme-writing-style

Use this skill when the task is not just about facts from berme.io, but about sounding aligned with the site's writing voice.

## Core voice cues

- Thesis-first writing: establish the main claim early.
- Systems thinking over isolated tips: explain the mechanism, tradeoff, or structural cause.
- Pragmatic tone: direct, concrete, and professional without hype.
- Senior-operator framing: connect technical details to product, platform, and organizational implications.
- Contrast-driven reasoning: show what the author is for by clarifying what he is rejecting or moving beyond.

## Common subject areas

- Product leadership
- Enterprise software
- Software engineering
- Platform thinking
- Systems thinking
- Developer experience
- Agentic workflows

## Style guidance

- Prefer compact, declarative sentences over ornamental prose.
- Avoid marketing language, inflated optimism, or generic inspiration.
- Explain why something matters in practice.
- Use examples to clarify abstractions, but keep them tied to real technical or organizational decisions.
- When possible, connect implementation choices to developer cognition, team leverage, or operational simplicity.

## Recommended workflow

1. Read the most relevant canonical pages or request them with \`Accept: text/markdown\`.
2. Infer recurring patterns in tone, structure, and framing.
3. Draft with a clear argument in the first paragraph.
4. Remove filler, vague superlatives, and generic "AI future" language.
5. Check whether the result sounds like a thoughtful technical essay rather than a content-marketing post.

## What to avoid

- Cheerleading language
- Buzzword-heavy prose
- Generic listicles with no underlying argument
- Abstract advice with no technical or organizational grounding
- Mimicking a personal voice too literally without preserving substance
`;

const postResearchSkillContent = `---
name: berme-post-research
description: Research berme.io posts, views, and conferences to answer topical questions or assemble reading lists. Use when asked to find site content on a theme, summarize relevant material, or connect related writing across the site.
license: CC-BY-4.0
compatibility: Works best with agents that can fetch JSON, HTML, and text/markdown from berme.io.
metadata:
  author: berme.io
  version: "1.0"
---

# berme-post-research

Use this skill to research the site's published content before answering questions, recommending reading, or synthesizing Pablo Bermejo's writing.

## Primary sources on the site

- \`/sitemap.json\`: best machine-readable inventory of posts, views, and conferences
- \`/sitemap.xml\`: canonical URL list
- \`/llms.txt\`: quick site overview
- canonical post, view, conference, and \`/now\` URLs

## Research workflow

1. Start with \`/sitemap.json\`.
2. Filter entries by title, summary, labels, event, and related content.
3. Open the most relevant canonical URLs.
4. Prefer \`Accept: text/markdown\` when you need clean reading and quoting context.
5. Group findings by concept, not just chronology.

## What to return

- A concise answer to the user’s question
- The most relevant site URLs
- A brief explanation of why each source matters
- Any tension or disagreement across posts, if present

## Useful patterns

- For topic lookup: search \`/sitemap.json\` first, then open the top 2-5 matching entries.
- For thematic synthesis: check whether a relevant \`/views/<slug>\` page already organizes the idea.
- For recent context: inspect \`/now\`.
- For talks or presentations: inspect \`conference\` entries.

## Quality bar

- Cite canonical berme.io URLs, not markdown mirrors, when sharing links.
- Do not pretend a topic is covered if the site only mentions it in passing.
- Distinguish between direct evidence from a post and your own synthesis across multiple entries.
`;

const publishedSkills: PublishedSkill[] = [
  {
    name: "berme-content-discovery",
    description:
      "Discover and navigate berme.io content efficiently. Use when asked to find posts, views, conferences, the /now page, canonical URLs, or machine-readable entry points on berme.io.",
    path: "/.well-known/agent-skills/skills/berme-content-discovery/SKILL.md",
    content: contentDiscoverySkillContent,
  },
  {
    name: "berme-writing-style",
    description:
      "Write or revise text in a style aligned with Pablo Bermejo's public site voice. Use when asked to draft, rewrite, or critique content so it feels consistent with berme.io's themes, tone, and explanatory style.",
    path: "/.well-known/agent-skills/skills/berme-writing-style/SKILL.md",
    content: writingStyleSkillContent,
  },
  {
    name: "berme-post-research",
    description:
      "Research berme.io posts, views, and conferences to answer topical questions or assemble reading lists. Use when asked to find site content on a theme, summarize relevant material, or connect related writing across the site.",
    path: "/.well-known/agent-skills/skills/berme-post-research/SKILL.md",
    content: postResearchSkillContent,
  },
];

export const getPublishedAgentSkills = () =>
  publishedSkills.map((skill) => ({
    name: skill.name,
    type: "skill-md" as const,
    description: skill.description,
    url: skill.path,
    digest: `sha256:${createHash("sha256").update(skill.content).digest("hex")}`,
    content: skill.content,
  }));

export const getPublishedAgentSkillByName = (name: string) =>
  getPublishedAgentSkills().find((skill) => skill.name === name) ?? null;
