# Agent Notes

Compacted into ISO-week summaries so the notes stay useful as a working memory instead of a session log.

## 2026 Week 07 (2026-02-09 to 2026-02-15)

### What went right
- Re-reading `AGENTS.md` and the core `app/` + `lib/` entry points rebuilt the architecture quickly.
- The repository structure, cache model, and webhook invalidation flow were already coherent and defensible.
- Lint hygiene improved materially during this period, moving from many blocking issues to a clean state apart from image warnings.

### What went wrong
- zsh globbing broke inspection of bracketed App Router paths until those paths were quoted.
- The repo initially had a large lint backlog, especially around strict React hooks rules and unused state.

### What I corrected
- Refactored effect-driven client state sync toward URL- and render-derived state where needed to satisfy strict hooks linting.
- Captured the main architectural watchpoints early: route-level `revalidate` drift and duplicated GitHub fetch setup.

### What worked
- Reading routes and data modules before touching code.
- Parallel `sed` and `rg` reads for fast context gathering.
- Using `npm run lint` as the default verification step after even small structural changes.

### What didn't
- Assuming shell path handling would be frictionless on bracketed routes.
- Leaving shared concerns like segment TTL literals and duplicated GitHub fetch logic unaddressed for too long.

## 2026 Week 08 (2026-02-16 to 2026-02-22)

### What went right
- The Conferences work landed end-to-end: product spec, homepage integration, detail pages, PDF viewing, command-palette actions, machine-readable output updates, and GitHub-backed data loading.
- The codebase remained easy to re-familiarize with because content boundaries stayed clean: posts, views, conferences, and `/now` each had distinct loaders and route surfaces.
- Webhook invalidation became more complete, covering conferences and later a bugfix for non-`published` label changes on already-cached content.

### What went wrong
- Local dependency install for `react-pdf` and `pdfjs-dist` did not complete in this environment.
- PDF summary extraction was limited by poor embedded text and missing OCR/text-extraction tooling.
- The PDF viewer needed several rounds of RCA and fixes for flicker, white-frame artifacts, geometry drift, zoom leakage, and stale width observation.
- Remote GitHub-hosted PDFs failed in-browser because of cross-origin and attachment fetch constraints.
- Production-style build validation was partially blocked by network-restricted font fetching, not by app logic.

### What I corrected
- Implemented the Conferences feature and later migrated conferences from local static data to GitHub issues.
- Fixed `react-pdf` worker/version mismatch and added a same-origin proxy at `app/api/conference-pdf/route.ts` for remote PDFs.
- Reworked the PDF viewer repeatedly until transitions were stable: snapshot freezing, geometry-locked overlays, split inline/overlay zoom, and safer width rebind behavior.
- Added conference-related command palette actions and keyboard navigation for related result lists.
- Fixed a webhook revalidation bug so label changes on existing post or conference content no longer stayed stale until TTL expiry.
- Fixed a Vercel TypeScript inference issue in `components/CommandActionsPalette.tsx` by introducing an explicit command action type.

### What worked
- Isolating UI bugs to the smallest rendering path before changing architecture.
- Reusing the command-palette interaction model instead of inventing a separate conference action system.
- Keeping conference data access in `lib/` and route composition in `app/`, which made the GitHub migration straightforward.
- Verifying with `npm run lint` and `npx tsc --noEmit` after each stabilization pass.

### What didn't
- Relying on naive PDF text extraction for rich summaries.
- Assuming remote PDF URLs would be safe to hand directly to the browser.
- Treating one viewer state model as suitable for both inline and overlay PDF modes.

## 2026 Week 10 (2026-03-02 to 2026-03-08)

### What went right
- Re-reading notes first remained the fastest way to recover the current product model.
- Markdown export support for posts, views, and conferences became a first-class feature without disrupting the canonical HTML routes.
- A shared content index normalized posts, views, and conferences into reusable machine-readable outputs.
- The product backlog was translated into concrete repository work rather than staying abstract.

### What went wrong
- The first `.md` routing attempts used dotted App Router folders and then middleware interception, both of which were brittle for alternate-format URLs.
- Rewrite precedence was initially wrong because default rewrites lost to existing dynamic App Router routes.
- Vercel rejected non-literal segment `revalidate` exports, even when they resolved to numbers at runtime.
- Known image warnings increased from 6 to 8, even though the repo was otherwise lint-clean.

### What I corrected
- Added markdown export infrastructure through `lib/markdown-exports.ts` plus dedicated route handlers for post, view, and conference markdown.
- Replaced fragile routing approaches with explicit `beforeFiles` rewrites in `next.config.ts`.
- Replaced the single query-driven markdown endpoint with explicit internal handlers under `app/api/content-markdown/...`.
- Switched affected segment config exports back to literal `3600` values to satisfy Next.js build constraints.
- Added a root TODO backlog capturing the next realistic product steps.
- Updated homepage and drawer bio copy consistently where needed.

### What worked
- Centralizing markdown formatting and URL generation instead of duplicating route-specific serializers.
- Using explicit rewrites for alternate formats rather than trying to make middleware act like route precedence control.
- Running `npx tsc --noEmit`, `npx next typegen .`, and `npm run lint` as routing changed.

### What didn't
- Dotted dynamic route folders for public `.md` aliases.
- Middleware as the main mechanism for this alternate-format URL problem.
- Imported values in segment config exports when the framework expects static literals.

## 2026 Week 11 (2026-03-09 to 2026-03-15)

### What went right
- This was the biggest product week: long-form reading scaffolding, relationship graphs, Redis-backed popularity, sitemap JSON, markdown mirrors, and homepage highlight redesign all landed or stabilized.
- A shared markdown-heading pipeline kept reading-time logic, heading IDs, anchor behavior, and reading-shell navigation aligned across posts and views.
- The graph improved substantially once it became a true label-based content graph and later a real D3-driven exploratory surface.
- Popularity became much safer and more coherent once validation, ranking, key identity, namespace support, and permalink migration were tightened.
- The homepage highlights section ended in a cleaner state: a toggleable editorial module, smaller typography, full titles, simplified reading-path entry, and no distracting transition motion.

### What went wrong
- The reading shell was initially too visually loud, then lost sticky behavior, then had runtime bugs because DOM heading IDs were sanitized differently than the raw markdown IDs.
- The first graph versions were too busy, then conceptually wrong because they mixed in `view` nodes or cropped the network too aggressively.
- The first popularity implementation had several weaknesses: easy-to-game endpoint, read-path writes on homepage load, inconsistent tie handling, stale ranking members on permalink changes, and fragile Redis failure behavior.
- The homepage highlights UI went through several partial fixes before the actual flicker cause was isolated.
- March work produced repeated or overlapping notes, especially around popularity hardening, which made the running log noisier than necessary.
- Route-level `revalidate = 3600` literals kept reappearing as a framework-driven compromise rather than a clean config-driven model.

### What I corrected
- Added `lib/markdown-headings.ts`, `components/ReadingShell.tsx`, and related markdown updates for long-form reading support.
- Iterated on the reading shell after user feedback: de-emphasized styling, restored sticky behavior, removed redundant header text, removed desktop top progress, kept mobile top progress, fixed active-section detection, and fixed smooth-scrolling anchor behavior.
- Added `lib/content-index.ts` and `app/sitemap.json/route.ts` for structured machine-readable indexing.
- Built and then reshaped the graph repeatedly: first relationship graph route, then label-only model, then decluttered UI, then true D3 interaction, then full-network layout with selector-based focus.
- Implemented Redis popularity, switched identity to canonical URL, added CSV import and namespace migration tooling, disabled local-dev increments, removed inline read-count display, hardened the endpoint, and added `syncPostReadTracking()` to reconcile permalink changes.
- Reworked the homepage highlights module: toggle instead of dual shelf, dark-mode accent consistency, full-title support, no truncation, stable card-height measurement, no hover theatrics, and no pane-swap transitions.
- Removed the `View:` banner from post detail pages when the user explicitly asked for that simplification.
- Wrote product-facing documentation like `docs/popular-posts-prd.md` to capture implemented behavior cleanly.

### What worked
- Treating user corrections as product constraints, not aesthetic suggestions.
- Shared utilities for markdown IDs and reading metadata.
- `d3-force` and `d3-zoom` for graph interaction without introducing a heavyweight graph framework.
- A reduced popularity catalog on the hot path instead of scanning full post objects.
- Webhook-driven synchronization for permalink-aware popularity tracking.
- Hidden probe measurement plus CSS stacking for stable highlight card sizing.
- Parallel worker implementation followed by a deliberate integration pass.

### What didn't
- Decorative UI additions that distracted from the article or graph.
- Title truncation and transition-heavy highlight behavior.
- Process-local cooldowns as anything more than pragmatic abuse reduction.
- Treating views as first-class graph nodes when the real model is shared labels across posts and conferences.
- Assuming static checks alone were enough for interaction-heavy work like reading maps, graph navigation, and highlight toggles.

## 2026 Week 14 (2026-03-30 to 2026-04-05)

### What went right
- Re-reading `AGENTS.md` and the notes was still enough to recover the current working model quickly.
- The current architecture remained coherent: GitHub issues feed posts, views, `/now`, conferences, markdown mirrors, sitemap outputs, and popularity.
- The `/now` page picked up a useful adjacent feature with the `Currently writing` section, and its cache invalidation stayed narrowly scoped.
- Telegram bot ideation became sharper once it was framed as an editorial control surface for the existing GitHub-native system rather than as a broadcast channel.

### What went wrong
- `AGENT_NOTES.md` had become too long and repetitive, especially around March popularity and graph work, making it harder to extract durable lessons.
- Older notes about `revalidate = 3600` drift could be mistaken for fresh issues if re-read without checking current code.

### What I corrected
- Added `ready`-label support to `/now` through `getCurrentlyWritingIssues()` and matching webhook invalidation.
- Adjusted the `Currently writing` heading to match normal markdown `h2` treatment after user feedback.
- Removed the top-of-content `View:` banner from post pages.
- Added fresh catch-up notes confirming the current machine-readable layer and homepage complexity hotspots.
- Compacted this notes file into weekly ISO summaries.

### What worked
- Using the existing label-driven content model as the basis for both UI changes and product ideation.
- Keeping `/now`-adjacent issue categories behind dedicated cache tags and targeted revalidation.
- Evaluating new ideas, like Telegram integration, against the site’s actual leverage points: issues, labels, parent-child links, `/now`, and popularity.

### What didn't
- Treating Telegram as a generic alert channel or another dashboard surface.
- Letting the notes file grow as a raw session transcript instead of a maintained working memory.
- Assuming historical note repetition implied multiple distinct current problems.
