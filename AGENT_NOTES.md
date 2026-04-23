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

## 2026 Week 15 (2026-04-06 to 2026-04-12)

### What went right
- Re-reading `AGENTS.md` plus the compacted weekly notes was enough to recover the current product and architectural model quickly.
- The notes compression strategy is now doing its job: recent changes are legible without rereading every intermediate implementation detail.
- The Telegram-to-Notion feature fit the repo cleanly as a plain App Router API route plus small server-side `lib/` clients, without introducing extra dependencies.
- Using Notion MCP to inspect the real database schema removed guesswork around the target database, property names, and tag configuration.
- The production rollout path was straightforward once the env contract was explicit: local `.env.local`, Vercel env vars, redeploy, then Telegram `setWebhook`.
- A local `curl` against the webhook route was a fast way to verify the full server-side flow before switching Telegram traffic to production.

### What went wrong
- A catch-up pass based only on instructions and notes can still leave implementation details stale if I do not reopen the relevant route or `lib/` entry points before editing.
- The target Notion database uses a title property named `﻿Name` with a leading BOM character, which is easy to miss and would have caused silent schema mismatches if guessed manually.
- The existing local env used `NOTION_API_KEY`, while the new implementation needed `NOTION_API_TOKEN`, so deployment would have failed if that naming mismatch had not been surfaced explicitly.

### What I corrected
- Refreshed the working memory for the repository from the maintained guidance files before making any new assumptions about current behavior.
- Implemented a Telegram webhook route backed by Notion page creation, with layered protection via Telegram webhook secret validation, private-chat-only enforcement, and an allowed Telegram user ID list.
- Made short notes atomic in Notion by creating the page with the first block batch up front, then appending only overflow blocks.
- Wrote an operational handoff in `temp/todo.md` covering Telegram setup, secret generation, Vercel env configuration, webhook registration, and validation steps.

### What worked
- Treating `AGENTS.md` as the canonical operating contract and `AGENT_NOTES.md` as the durable change log.
- Verifying external integration assumptions with official docs and workspace inspection before writing code.
- Running both `npm run lint` and `npx tsc --noEmit` after adding new server integrations.
- Testing webhook handlers locally with crafted Telegram-style payloads before relying on the real external webhook source.
- Using `getWebhookInfo`, `getMe`, and `getUpdates` in the right order to separate Telegram configuration problems from backend implementation problems.

### What didn't
- Assuming historical concerns in the notes are still live without checking whether they were already resolved.
- Assuming human-readable Notion property names can be safely inferred without inspecting the actual connected database.
- Treating Telegram onboarding steps as obvious; the rollout needed a concrete checklist to avoid confusion around user ID discovery, webhook state, and secret setup.

## 2026 Week 16 (2026-04-13 to 2026-04-19)

### What went right
- A small UI preference change was cheapest to implement at the render site: the post header already owned the metadata row, so removing the popularity badge there avoided touching the tracking backend.
- A fresh catch-up pass confirmed the current architecture is still coherent after the recent feature growth: GitHub-backed posts, parent-derived views, `/now`, conferences, markdown mirrors, machine-readable sitemaps, popularity tracking, and Telegram-to-Notion ingestion all fit the same content model.

### What went wrong
- The popularity component still exists even though the post header no longer uses it, so it is now a likely cleanup candidate if the feature is not coming back in another surface.
- A pure line-height bump from `1.65` to `1.75` was too subtle to register visually on the widened detail pages.
- The featured/popular shelf had drifted away from the rest of the homepage: per-post highlight cards pulled too much attention and interrupted the calmer post-index rhythm.

### What I corrected
- Removed the `Popular #N` post-header badge so published post metadata now shows date, reading time, and GitHub link without the popularity label.
- Removed the post-header reading-time label because reading time already lives in the side reading panel.
- Removed the visible read-time label from individual view page headers while keeping reading metadata available to the command palette and reading shell.
- Widened individual post, view, and conference detail pages on desktop by relaxing the centered content measure while leaving mobile width unchanged.
- Increased that desktop detail-page measure again after review because the first width adjustment was still too subtle.
- Switched the reading-shell accent lines to black in light mode while preserving the existing amber accents in dark mode.
- Added a detail-page-only markdown spacing class so post, view, and conference content has slightly looser line spacing without changing homepage or comment markdown.
- Replaced that weak spacing tweak with a stronger reading treatment: a slightly larger detail-page text size plus a clearly looser line-height.
- Rebuilt the featured/popular homepage module as one large framed container with normal dated post rows, removing the separate per-post highlight cards.
- Removed the internal heading, divider, and count from that framed featured/popular container so the post rows carry the module instead of extra chrome.
- Matched the spacing inside the featured/popular container to the main post timeline by removing leftover per-row padding and relying on the same list gap rhythm.
- Switched the featured/popular row date labels to `MMM YY` to distinguish that module from the main publication timeline without changing the timeline itself.
- Simplified the featured/popular row dates again to plain `YYYY`, which better fits the reduced visual weight of that framed module.
- Tightened the gap between the year label and title inside the featured/popular module so those rows read more like a single line item.
- The visible distance was mostly column width, not just gap spacing, so the featured/popular date column was narrowed further to bring the year closer to the title.
- Reduced the left inset of the featured/popular framed container so the list starts closer to the card edge and aligns better with the tighter row spacing.
- After tightening both the container inset and the date column, the `YYYY` label sat too close to the title, so the inter-column gap was nudged back up slightly.
- The first gap correction was still too tight, so the featured/popular row spacing between year and title was increased again.
- The year/title separation in the featured/popular rows needed one more increase; small spacing tweaks here are highly perception-sensitive.
- The featured/popular year/title gap needed another bump; this spacing sits in a narrow perceptual band where tiny class changes matter.
- The featured/popular year/title separation needed yet another increase; the module benefits from a clearer break between metadata and title than the earlier tighter settings provided.
- Fixed the markdown pipeline so raw HTML embedded in GitHub issue bodies, such as literal `<img ... />` tags from pasted GitHub attachments, is parsed and then sanitized instead of disappearing.
- Added a protocol-compliant `/sitemap.xml` route that lists canonical HTML URLs instead of the markdown mirror URLs used by `/sitemap.md`.
- Updated webhook aggregate revalidation and `robots.txt` so newly published or edited content refreshes `/sitemap.xml` and search crawlers can discover it directly.
- Added a homepage `Link` header pointing to `/sitemap.xml` via Next.js response headers, using RFC 8288 header syntax and an extension relation URI because `sitemap` is not an IANA-registered link relation token.
- Added Markdown content negotiation for `/`, `/now`, posts, views, and conferences by rewriting `Accept: text/markdown` requests to the existing Markdown route layer instead of trying to emit Markdown from page components.
- Added `Vary: Accept` on the negotiated canonical routes and standardized Markdown responses to include `Content-Type: text/markdown; charset=utf-8` plus `x-markdown-tokens`.
- Added a `Content-Signal` declaration to `robots.txt` so the site now explicitly allows search while declining AI training and AI input usage.
- Added an MCP Server Card at `/.well-known/mcp/server-card.json` following the current SEP-1649 draft shape, with CORS headers and a reserved `/mcp` streamable-HTTP endpoint.
- Added an explicit `/mcp` placeholder route returning `501 Not Implemented` so discovery does not point at a missing path while making it clear the actual MCP transport is not enabled yet.
- Added a client-side WebMCP provider that registers browser-native tools on page load for content search and navigation, using the verified `registerTool()` API and a compatibility fallback for experimental `provideContext()` implementations.
- Added an Agent Skills discovery index at `/.well-known/agent-skills/index.json` plus a published `berme-content-discovery` skill with a SHA-256 digest computed from the same source string served at the skill URL.
- Expanded the published Agent Skills set with `berme-writing-style` and `berme-post-research`, keeping all discovery metadata and digests centralized in one shared module.
- A live validation pass against the public site showed that agent-facing discoverability features can be in place while external search/browser snapshots still miss dynamic homepage shelves or unindexed posts, so public summaries need to clearly separate verified page evidence from inference.

### What worked
- Using `rg` first to confirm the badge had a single live usage before editing.
- Matching page-level header widths with the reading-shell content width kept the wider desktop measure feeling intentional instead of making headers and bodies drift apart.
- Introducing a page-specific content class was safer than changing the shared markdown styles globally.
- When a visual tweak is user-judged, treating "I don't see it" as an RCA prompt is better than defending a technically-correct but imperceptible change.
- Reusing the normal post-entry row pattern inside a single editorial container preserved emphasis without inventing a second visual language for the same content type.
- Re-reading `AGENTS.md`, then `AGENT_NOTES.md`, then the actual route and `lib/` entry points was enough to rebuild a reliable mental model quickly.
- Running `npm run lint` during catch-up remains a good health check; the repo is clean apart from the already-known `@next/next/no-img-element` warnings.
- In this repo, raw HTML support for markdown needs to be implemented in both paths: the React renderer in `components/Markdown.tsx` and the unified string-render path in `lib/markdown-render.ts`.
- Reusing the existing `posts`, `views`, `conferences`, and `/now` loaders was the safest way to build the XML sitemap without duplicating permalink logic or drifting from canonical URLs.
- For homepage-only HTTP metadata in this App Router setup, `next.config.ts` response headers are a cleaner fit than trying to emit headers from `app/page.tsx`.
- In this repo, the clean way to implement Markdown-for-Agents is request-header rewrites plus dedicated Markdown route handlers; trying to negotiate directly inside `page.tsx` would not give the correct response content type.
- For Content Signals, a plain `robots.txt` declaration is the lowest-friction implementation path and keeps the site’s AI-usage preference visible alongside crawl and sitemap directives.
- For MCP discovery in a non-MCP app, it is safer to publish a truthful server card plus a reserved endpoint than to imply a working transport that does not exist.
- For WebMCP in this codebase, a single global client provider mounted from `app/layout.tsx` is the right integration point because tool registration must happen in the browser and should not depend on which route rendered first.
- For Agent Skills discovery, the index should only advertise skills that are actually fetchable from the domain; computing the digest from the same shared content source avoids drift between `index.json` and the published `SKILL.md`.
- When publishing multiple skills from a site, centralizing the source strings, route paths, and digest generation in one module is cheaper and safer than hand-maintaining each index entry.
- When validating agent-readiness from outside the repo, do not overclaim from search snippets alone; if a “popular” post or specific article cannot be directly verified live, say so explicitly instead of implying the site proved it.

### What didn't
- Assuming a dedicated component necessarily meant the badge was reused in multiple places.
- Keeping a custom card-per-post treatment for homepage highlights after the rest of the page had already settled into a cleaner editorial listing style.
- Relying only on the repository guide would now understate the product surface; newer graph, conference, markdown-export, popularity, and Telegram/Notion features live outside that older summary.
- An ad hoc `tsx` runtime check can fail in this sandbox because it wants to create an IPC pipe; for this kind of change, `npx tsc --noEmit` plus lint is the reliable verification floor.

## 2026 Week 17 (2026-04-20 to 2026-04-26)

### What went right
- Re-reading `AGENTS.md` and the compacted notes was still enough to rebuild the current repository model quickly.
- The maintained notes now clearly show the product has expanded beyond the older repository guide: conferences, markdown negotiation, popularity, MCP/agent discovery, and Telegram-to-Notion are all active parts of the system.

### What went wrong
- `AGENTS.md` is still accurate as an operating contract, but its feature summary lags the newer surface area captured in `AGENT_NOTES.md`.
- A single long read of `AGENT_NOTES.md` can still hit output truncation, so recent sections need targeted reads instead of assuming one pass is enough.

### What I corrected
- Refreshed working memory from both instruction files before doing any implementation work.
- Added this week's catch-up note so the scratchpad reflects the session instead of skipping a required update.
- Fixed the permalink-migration bug in post popularity tracking by reconstructing the pre-edit URL from GitHub webhook `changes` instead of depending on cached post state.
- Added a one-off repair script at `scripts/repair-post-popularity.ts` and used it to merge stale Redis popularity entries into their canonical post URLs.

### What worked
- Reading the durable repo contract first, then reading the compacted weekly notes, then using targeted follow-up reads for the latest sections.
- Treating `AGENT_NOTES.md` as the higher-fidelity source for recent product evolution and operational caveats.
- For webhook-driven permalink migrations, the old URL must come from GitHub's `issues.edited` payload, not from `getAllPosts()` cache reads that may already reflect the new permalink.
- A slug-based Redis repair pass is a practical way to clean up stale popularity members when the title slug stayed constant and only the date portion of the permalink drifted.

### What didn't
- Assuming the repository guide alone is enough to understand the current product surface.
- Depending on a single truncated file read when the latest weeks are what matter most for safe follow-up work.
- Assuming cached content state could reliably stand in for the pre-edit permalink during webhook handling.
