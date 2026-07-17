# Interactive content

Interactive article elements use a reserved `berme` fenced block. GitHub renders the block safely as code; berme.io parses its JSON, validates an allowlisted component ID, and upgrades it into React.

## Scrolly v1 contract

Every scrolly renderer shares one content model. The renderer can use SVG, Canvas, HTML, WebGL, or a hybrid and may interpret the narrative differently, but it cannot invent a different JSON shape.

The authoritative forms are:

- Runtime and TypeScript: `lib/interactive/contracts/scrolly.ts`
- Machine-readable: `schemas/berme/scrolly.v1.schema.json`
- Agent workflow: the `Interactive Content Contract` section in `AGENTS.md`
- End-to-end GitHub Issue workflow: `.agents/skills/berme-scrollytelling/SKILL.md`

The v1 root object is strict:

| Property | Contract |
| --- | --- |
| `component` | Required kebab-case ID of a registered renderer; maximum 80 characters |
| `version` | Required literal `1` |
| `eyebrow` | Required non-empty string; maximum 80 characters |
| `title` | Required non-empty string; maximum 140 characters |
| `description` | Required non-empty string; maximum 280 characters; a renderer may keep it visually hidden |
| `steps` | Required ordered array of 3–8 strict step objects |

Each step contains exactly:

| Property | Contract |
| --- | --- |
| `label` | Required non-empty string; maximum 48 characters |
| `title` | Required non-empty string; maximum 80 characters |
| `body` | Required non-empty string; maximum 360 characters |

Unknown fields are invalid at both levels.

````markdown
```berme
{
  "component": "constraint-descent",
  "version": 1,
  "eyebrow": "The constraint descent",
  "title": "A rule becomes more useful as the system learns to enforce it",
  "description": "Scroll through the rule as it becomes executable.",
  "steps": [
    {
      "label": "Context",
      "title": "The rule becomes Markdown",
      "body": "The intent is portable, but enforcement is still optional."
    },
    {
      "label": "Contract",
      "title": "Types narrow the path",
      "body": "The rule becomes part of the development surface."
    },
    {
      "label": "Boundary",
      "title": "The platform protects the intent",
      "body": "The system can now reject violations at runtime."
    }
  ]
}
```
````

`component` selects the visual argument, not the data contract. For example, a future `feedback-loop` scrolly would use the same properties but register a purpose-built renderer. Non-scrolly families such as charts or explorables may receive separate versioned contracts later.

## Generating a block from a post

1. Identify one ordered idea with 3–8 meaningful states. Do not force a static comparison into a scrolly.
2. Choose a specific kebab-case component ID that describes the visual argument.
3. Write one concise `label`, one explanatory `title`, and one self-contained `body` for every state.
4. Include the required `description` even when the renderer does not display it.
5. Validate the Markdown with `npm run validate:interactives`. A new component ID will remain invalid until its schema and renderer are registered.

## Adding a scrolly renderer

For a component ID such as `feedback-loop`, use this structure:

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

The component-specific schema only narrows the shared contract to its renderer ID:

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

Then:

1. Add `"feedback-loop": FeedbackLoopSpec` to `InteractiveSpecMap` in `lib/interactive/types.ts`.
2. Add its schema with `kind: "scrolly"` and `version: 1` to `interactiveDefinitionRegistry` in `lib/interactive/registry.ts`.
3. Build `components/interactive/blocks/feedback-loop/FeedbackLoopScrolly.tsx`. The visual composition is ad hoc; the `spec` prop is not.
4. Dynamically import and register it in `interactiveComponentRegistry` in `components/interactive/registry.tsx` so unrelated articles do not load its JavaScript.
5. Reuse `useActiveScrollyStep`, `getScrollyStepStatus`, and `useContainerSize` where appropriate. Add `"use client"` only at the lowest boundary that needs browser behavior.
6. Keep authored prose accessible. JavaScript may synchronize or enhance the visual, but should not be the sole carrier of the article's argument.

The registry and TypeScript maps deliberately require several explicit touches. Missing server or client registrations fail type checking, and the validator checks the conventional schema and renderer paths.

## Runtime and validation

1. `lib/remark-interactive-blocks.ts` converts only `berme` fences into sanitized data attributes.
2. `lib/interactive/registry.ts` rejects invalid JSON, unknown IDs, unsupported versions, extra fields, and content outside the registered schema.
3. `components/interactive/registry.tsx` resolves the validated ID to its lazy React renderer.
4. The renderer hydrates only when it needs browser behavior.

Run:

```bash
npm run validate:interactives
npx tsc --noEmit
npm run lint
```

`validate:interactives` verifies that the committed JSON Schema still matches the Zod source, recursively validates local Markdown under `content/`, and checks each registered component's conventional schema and renderer paths.

To validate a candidate or freshly fetched GitHub Issue body without creating a local Markdown file, pipe it through stdin:

```bash
npm run validate:interactives -- --stdin
```

After intentionally changing a contract, regenerate its machine-readable artifact:

```bash
npm run generate:interactive-schemas
```

Changing only animation, geometry, typography, responsive behavior, or rendering technology does not require a contract version bump. Changing fields, meanings, limits, or requiredness does.
