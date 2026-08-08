---
name: berme-scrollytelling
description: Add a purpose-built scrollytelling section with practical Pablo-style UI copy to a berme.io post identified by its GitHub Issue number in peibolsang/peibolsang. Use when asked to add, inject, design, implement, or publish a scrolly or scroll story, including creating the v1 berme fenced block, React renderer, schema and registry entries, validation, and the mandatory source Issue update without creating a local article copy or checking deployment status.
---

# Berme Scrollytelling

Turn one GitHub Issue in `peibolsang/peibolsang` into an article with a distinctive, purpose-built scroll story and its production-compatible renderer. Require only the Issue number as user input. Always finish by updating that Issue with the validated `berme` block. Treat this skill as the complete workflow and contract. Do not depend on `AGENTS.md` or a separate interactive-content guide for scrollytelling instructions.

## Make the Issue update mandatory

- Treat the supplied Issue number as authorization to update its body after the candidate passes validation. Do not ask separately for permission to perform the Issue mutation.
- Always complete the workflow by updating the Issue, re-fetching its body, comparing it with the intended candidate, and validating it again. Local renderer changes alone are not a completed task.
- Do not inspect GitHub branches, commits, pull requests, Vercel, other deployment systems, or the canonical berme.io page to decide whether the Issue may be updated.
- Do not check whether the component ID has reached deployed code. The source Issue is an unpublished working draft without the `published` label, so storing the fenced block before renderer deployment is expected and safe.
- If one GitHub write route fails, try the authenticated GitHub tool or the repository token through the REST API before reporting that the mandatory Issue update is blocked.

## Apply the design skill

Use the `frontend-design` skill before designing the visual. Establish the visual concept, composition, typography, responsive behavior, accessibility, and intended motion character. Create a distinctive visual argument tailored to the post; do not reskin or mechanically reuse `constraint-descent`.

## Apply the animation skill

Use the `animate` skill after `frontend-design` establishes the visual direction and before implementing motion in the renderer. Treat it as a required dependency for every proposed animated state change; a valid result may be to keep a change static.

Let `animate` own the motion decisions in its prescribed order:

1. Decide whether the change should animate at all.
2. Name its purpose: explanation, state indication, spatial consistency, feedback, preventing a jarring change, or—only when justified—delight.
3. Choose the cheapest suitable tool. Default to the existing `activeIndex` → React class/style → CSS transition architecture when it fits; do not add a motion library for ordinary step transitions.
4. Choose properties, existing tokens, exact curves, and durations. Prefer `transform` and `opacity`; do not animate layout properties when a compositor-friendly equivalent exists.
5. Make reversible scroll-step transitions retarget cleanly when the reader changes direction.
6. Ship reduced-motion behavior with the implementation, retaining useful color or opacity feedback while removing positional movement.

Keep the responsibility boundary explicit: `berme-scrollytelling` owns the narrative, component architecture, content validation, and mandatory Issue update; `frontend-design` owns the visual direction; `animate` turns the intended motion character into exact implementation decisions. Do not let the animation sub-workflow change the authored argument or make synchronized motion the sole carrier of meaning.

## Apply Pablo's writing skill

Use the `pablos-way` skill before authoring the fenced JSON. Treat it as a required dependency for every human-facing string: root `eyebrow`, `title`, and `description`, plus every step `label`, `title`, and `body`. Apply the same voice to any prose labels hard-coded in the renderer. Do not apply it to machine fields such as `component` or `version`.

Compress Pablo's voice for interface copy instead of turning each step into an essay:

- Use short labels built from concrete nouns or verbs.
- Write direct, natural titles that make a claim or name an action. Avoid passive constructions and abstract transformations such as “confidence is rebuilt” or “the design space emerges.”
- Keep each body to one or two sentences. Name who does what, what they use or check, and why it matters.
- Prefer concrete examples from the article—files, tests, APIs, permissions, schemas, reviews—over generic systems language.
- Explain necessary abstractions in plain language rather than stacking terms such as intent, coherence, boundaries, and leverage without showing their practical effect.
- Preserve Pablo's contrast-driven, pragmatic point of view, but avoid rhetorical padding, generic inspiration, and polished phrases that could belong to any technology article.
- Rewrite any title or body that still makes sense when copied into an unrelated post. The copy must be specific to the article's argument.

Before accepting the copy, ask: can a reader say what happens at this step, what someone actually does, and what changes as a result? If not, rewrite it.

## Enforce the v1 authoring contract

Use a reserved `berme` fenced block containing strict JSON. GitHub must render it safely as code while berme.io validates and upgrades it into an allowlisted React component.

Require exactly these root properties:

| Property | Rule |
| --- | --- |
| `component` | Kebab-case registered renderer ID; 1–80 characters |
| `version` | Literal `1` |
| `eyebrow` | Non-empty string; maximum 80 characters |
| `title` | Non-empty string; maximum 140 characters |
| `description` | Non-empty string; maximum 280 characters; rendering it is optional |
| `steps` | Ordered array containing 3–8 step objects |

Require exactly these properties in every step:

| Property | Rule |
| --- | --- |
| `label` | Non-empty string; maximum 48 characters |
| `title` | Non-empty string; maximum 80 characters |
| `body` | Non-empty string; maximum 360 characters |

Reject unknown root or step properties. Keep `description` in the JSON even when the renderer keeps it visually hidden. Treat `component` as the identity of a purpose-built visual argument, not as a generic visual type with an open-ended variant property.

Use this shape:

````markdown
```berme
{
  "component": "feedback-loop",
  "version": 1,
  "eyebrow": "The delegation loop",
  "title": "A better brief makes delegation easier to trust",
  "description": "Follow one task from a clear brief through automated checks and human review.",
  "steps": [
    {
      "label": "Intent",
      "title": "Write down what success looks like",
      "body": "State the outcome, scope, and constraints before the agent starts. If the brief is vague, the agent will fill in the gaps."
    },
    {
      "label": "Execution",
      "title": "Give the agent one bounded task",
      "body": "Provide the relevant context and keep the work inside a clear area. Smaller boundaries make mistakes easier to spot and cheaper to correct."
    },
    {
      "label": "Feedback",
      "title": "Check the result before reading every line",
      "body": "Run tests and policy checks first, then use human review for the decisions the system cannot verify."
    }
  ]
}
```
````

Keep the v1 schema authoritative in `lib/interactive/contracts/scrolly.ts` and its generated artifact in `schemas/berme/scrolly.v1.schema.json`. Do not change fields, meanings, requiredness, or limits while adding a renderer. Such changes require a new contract version and an explicit migration path. Animation, geometry, typography, responsiveness, and rendering-technology changes do not require a version bump.

## Follow the component architecture

For a component ID such as `feedback-loop`, use:

```text
lib/interactive/
  contracts/scrolly.ts
  specs/feedback-loop.ts
  registry.ts
  types.ts

components/interactive/
  blocks/feedback-loop/FeedbackLoopScrolly.tsx
  primitives/
  registry.tsx
```

Create the component-specific schema only by narrowing the shared contract to its renderer ID:

```ts
import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const feedbackLoopSpecSchema =
  createScrollySpecSchema("feedback-loop");

export type FeedbackLoopSpec = z.infer<typeof feedbackLoopSpecSchema>;
export type FeedbackLoopStep = ScrollyStep;
```

Then complete every registration step:

1. Add `"feedback-loop": FeedbackLoopSpec` to `InteractiveSpecMap` in `lib/interactive/types.ts`.
2. Register its schema with `kind: "scrolly"` and `version: 1` in `interactiveDefinitionRegistry` in `lib/interactive/registry.ts`.
3. Build `components/interactive/blocks/feedback-loop/FeedbackLoopScrolly.tsx`. Keep component-specific logic in its block folder.
4. Dynamically import and register it in `interactiveComponentRegistry` in `components/interactive/registry.tsx` so unrelated posts do not load its JavaScript.
5. Reuse `useActiveScrollyStep`, `getScrollyStepStatus`, and `useContainerSize` from `components/interactive/primitives/` when their behavior fits.
6. Add `"use client"` only at the lowest boundary needing state, effects, observers, or browser APIs.

Use SVG for coordinate-driven geometry and charts; use HTML for prose, controls, and typography that should not scale with a viewBox. Use Canvas, WebGL, or a hybrid only when the visual argument benefits. Let React own the rendered tree; use D3 selectively for calculations, scales, shapes, or interaction.

The runtime pipeline is fixed:

1. `lib/remark-interactive-blocks.ts` recognizes only `berme` fences and converts them into sanitized data attributes.
2. `lib/interactive/registry.ts` rejects invalid JSON, unknown IDs, unsupported versions, extra fields, and invalid content.
3. `components/interactive/registry.tsx` resolves the validated ID to a lazy React renderer.
4. The renderer hydrates only when browser behavior is required.

## Preserve the canonical content model

- Always use GitHub owner `peibolsang` and repository `peibolsang`. Do not discover, infer, or ask for a different owner or repository.
- Require only the Issue number from the user. Fetch the canonical article directly from that Issue; do not require a post URL.
- Work from the canonical GitHub Issue body. Do not create a persistent local Markdown article, add anything under `content/`, or create a preview route.
- Preserve the issue body exactly except for inserting the new `berme` fenced block at one deliberate location.
- Express one strong ordered idea in 3–8 steps. Do not add a scrolly merely to decorate the article.
- Author every human-facing JSON string with `pablos-way` and the practical-copy rules above. Keep the narrative understandable from its titles and bodies; let browser behavior enhance and synchronize the argument rather than carry it alone.
- Implement and validate the renderer before modifying the remote issue.
- Always update the remote Issue after the candidate passes validation. Do not make renderer deployment a precondition for this mutation.

## Execute the workflow

### 1. Fetch the canonical issue

1. Read the Issue number supplied by the user and verify that it is a positive integer. Ask only for the Issue number if it is missing.
2. Use an authenticated GitHub tool or `gh issue view <number> --repo peibolsang/peibolsang` to fetch that exact Issue. Do not search by title, date, slug, or URL.
3. Verify that the number resolves to an Issue in `peibolsang/peibolsang`, then retain its exact original body for comparison and recovery.
4. Derive the canonical berme.io post URL from the Issue content or repository data only when needed for browser verification; never require the user to provide it.

### 2. Find the visual argument

1. Read the complete post before choosing a concept.
2. Identify the idea whose meaning benefits most from ordered, scroll-driven state changes.
3. Use `pablos-way` to define 3–8 steps with concise labels, direct titles, and self-contained bodies grounded in the article. Each step must describe a concrete action, mechanism, example, or consequence.
4. Choose a specific component ID that names the visual concept rather than the rendering technology.
5. Choose the insertion point by narrative function: establish the idea in prose, let the scrolly develop it, then return cleanly to the surrounding argument.

### 3. Design and implement

1. Apply `frontend-design` to establish a visual concept, composition, typography, responsive behavior, accessibility, and intended motion character specific to the article.
2. Apply `animate` to every proposed state change before writing its motion code. Record the animation gate result and named purpose, then follow the selected tool, properties, tokens, curves, durations, interruption behavior, and reduced-motion treatment exactly.
3. Implement the schema, type mapping, registries, renderer, and component-specific styles using the conventions and accepted motion decisions above.
4. Prefer the simplest rendering technology that preserves the intended geometry, accessibility, responsiveness, and motion behavior.
5. Keep authored prose readable without JavaScript and avoid making synchronized visual state the sole carrier of meaning.

### 4. Author and validate the block

1. Produce strict JSON containing only the v1 properties. Use `pablos-way` for all human-facing strings.
2. Perform a copy audit before technical validation:
   - Confirm every title and body is easy to read aloud and understand on the first pass.
   - Confirm every body names a practical action, tool, check, example, or consequence.
   - Remove vague transformation language, unnecessary nominalizations, and generic AI-sounding phrasing.
   - Confirm the ordered titles and bodies communicate the complete argument without the animation.
3. Insert the fence into a candidate copy of the issue body held in memory or a temporary file outside the repository. Do not persist an article copy in the project.
4. Pipe the complete candidate issue body to:

```bash
npm run validate:interactives -- --stdin
```

5. Run:

```bash
npm run validate:interactives
npx tsc --noEmit
npm run lint
git diff --check
```

`validate:interactives` must confirm that the generated JSON Schema matches the Zod source, local registered components use conventional schema and renderer paths, and every inspected block is valid. Run `npm run generate:interactive-schemas` only after an intentional contract-version change.

6. Visually verify every step in an available local development environment at desktop and mobile widths. Check sticky behavior, transitions, overflow, text readability, keyboard/accessibility concerns, and reduced motion. Confirm that on-screen migrations, entrances, state feedback, and sequencing match the accepted `animate` decisions; use slow-motion or frame-by-frame inspection when timing or continuity cannot be judged at normal speed. Do not use a deployed environment or canonical page as a publication gate, and do not withhold the Issue update solely because a local visual preview is unavailable.

### 5. Update the GitHub Issue (mandatory)

1. Skip all deployment checks. Do not inspect remote source branches, deployment status, or the canonical berme.io page before updating the Issue.
2. Always update the supplied Issue number in `peibolsang/peibolsang`, changing only the insertion of the validated fenced block.
3. Re-fetch the Issue body and compare it with the intended candidate so unrelated prose or frontmatter changes cannot slip through.
4. Pipe the re-fetched body through `npm run validate:interactives -- --stdin` again.
5. Confirm that the expected component ID appears exactly once. If the mutation introduced invalid or unintended content, restore the retained original body, correct the candidate, and complete the Issue update again before ending the task.

## Report completion

Report the selected idea, insertion location, component ID, files created or registered, Pablo-style copy check, GitHub Issue number, successful Issue update, exact-body comparison, and validation results. Do not report deployment status or canonical-page verification because neither is part of this workflow. Explicitly state that no persistent local Markdown article or preview route was created.
