---
name: berme-scrollytelling
description: Add a purpose-built scrollytelling section to a berme.io post whose canonical Markdown lives in a GitHub Issue. Use when asked to add, inject, design, implement, or publish a scrolly or scroll story for a berme.io article, including creating the v1 berme fenced block, React renderer, schema and registry entries, validation, and source GitHub Issue update without creating a local article copy.
---

# Berme Scrollytelling

Turn a berme.io post URL into one distinctive, article-specific scroll story and its production-compatible renderer. Treat the GitHub Issue as the canonical article source and the repository as the source of the rendering system.

## Load the contract

Before taking action, read these repository files completely:

1. `../../../AGENTS.md`, especially `Interactive Content Contract`
2. `../../../docs/interactive-content.md`
3. `../../../schemas/berme/scrolly.v1.schema.json`

Use the `frontend-design` skill before designing the visual. Create a distinctive visual argument tailored to the post; do not reskin or mechanically reuse `constraint-descent`.

## Non-negotiable rules

- Work from the canonical GitHub Issue body. Do not create a persistent local Markdown article, add anything under `content/`, or create a preview route.
- Preserve the issue body exactly except for inserting the new `berme` fenced block at one deliberate location.
- Use the shared v1 scrolly contract unchanged. Give each new visual concept its own kebab-case component ID and purpose-built renderer.
- Express one strong ordered idea in 3–8 steps. Do not add a scrolly merely to decorate the article.
- Keep the narrative understandable from its authored titles and bodies. Let browser behavior enhance and synchronize the argument rather than carry it alone.
- Implement and validate the renderer before modifying the remote issue.
- Never leave the production article referencing an undeployed component. Deploy first when deployment is authorized; otherwise stop before the issue update and report the exact remaining publication step.

## Workflow

### 1. Resolve the canonical issue

1. Parse the supplied canonical post URL.
2. Inspect the repository's configured GitHub owner and repository.
3. Use the available authenticated GitHub tool or `gh` CLI to find the issue whose published date and slug resolve to that URL. Verify the match from issue content or repository data; do not guess an issue number.
4. Fetch and retain the exact original issue body for comparison and recovery.

### 2. Find the visual argument

1. Read the complete post before choosing a concept.
2. Identify the idea whose meaning benefits most from ordered, scroll-driven state changes.
3. Define 3–8 steps with concise labels, explanatory titles, and self-contained bodies grounded in the article.
4. Choose a specific component ID that names the visual concept rather than the rendering technology.
5. Decide the insertion point by narrative function: establish the idea in prose, let the scrolly develop it, then return cleanly to the surrounding argument.

### 3. Design and implement

1. Apply the `frontend-design` skill to establish a visual concept, composition, motion language, typography, responsiveness, and reduced-motion behavior specific to this article.
2. Follow the exact paths, schema factory, type map, server registry, lazy renderer registry, client-boundary, and shared-primitive conventions in the loaded repository contract.
3. Use SVG, HTML, Canvas, WebGL, or a hybrid according to the idea. Prefer the simplest technology that preserves the intended geometry, accessibility, and responsiveness.
4. Keep component-specific logic within its block folder and reuse existing interactive primitives when their behavior fits.

### 4. Author and validate the block

1. Produce strict JSON containing only the v1 contract properties.
2. Include `description` even if the renderer keeps it visually hidden.
3. Insert the fence into a candidate copy of the issue body held in memory or a temporary file outside the repository. Do not persist an article copy in the project.
4. Pipe the complete candidate body to:

```bash
npm run validate:interactives -- --stdin
```

5. Run `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
6. Visually verify the canonical article through an available development or deployed environment at desktop and mobile widths. Check every step, sticky behavior, overflow, keyboard/readability concerns, and reduced motion.

### 5. Publish to the GitHub Issue

1. Confirm the new component ID is available in the environment that will render the canonical article. If repository publication or deployment requires authority not present in the request, stop before changing the issue.
2. Update the matched GitHub Issue body, changing only the insertion of the validated fenced block.
3. Re-fetch the issue body and compare it with the intended body so unrelated prose or frontmatter changes cannot slip through.
4. Pipe the re-fetched body through `npm run validate:interactives -- --stdin` again.
5. Verify the canonical post URL renders the new scrolly without an interactive-block error. If the issue mutation introduced invalid content, restore the retained original body before ending the task.

## Completion report

Report the selected idea, insertion location, component ID, repository files created or registered, GitHub issue number, validation results, deployment status, and canonical-page verification. Explicitly state that no persistent local Markdown article or preview route was created.
