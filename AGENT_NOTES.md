# Agent Notes

## 2026-02-14

### What went right
- Repository instructions in `AGENTS.md` are detailed and match the actual architecture.
- Content/data flow is coherent: GitHub issues -> `lib/posts.ts`/`lib/views.ts` -> static route generation.
- Cache invalidation strategy is explicit and implemented consistently in `app/api/revalidate/route.ts`.
- Refactoring state sync in client components from effect-driven updates to URL-/render-derived state fixed strict React hooks lint errors cleanly.

### What went wrong
- Shell globbing on bracket route paths (`app/[year]/...`) failed until paths were quoted.
- `npm run lint` currently fails with many pre-existing issues (67 total: 52 errors, 15 warnings), including strict React hooks rules (`react-hooks/error-boundaries`, `react-hooks/set-state-in-effect`), a `no-explicit-any`, and several unused vars.

### Corrections received
- None this session.

### What worked well
- Reading core `app/` routes and `lib/` modules first gave a fast end-to-end understanding.
- Parallel reads with `sed`/`rg` reduced context-gathering time.

### What to watch next
- Keep `app/feed.xml/route.ts` and `app/sitemap.md/route.ts` `revalidate` values aligned with `config.revalidateSeconds` (they are currently hardcoded to `3600`).
- If webhook behavior changes, update both content-tag and path invalidation lists together.
- If lint cleanup is started, prioritize fixing route/component blocking errors first (`app/page.tsx`, `components/ThemeToggle.tsx`, `components/KnowPablo.tsx`, `components/PostsIndex.tsx`, `components/CommandPalette.tsx`) before warning-only items.
- Lint now passes with 0 errors and 6 warnings, all from `@next/next/no-img-element` in content/image-heavy components.

## 2026-02-20

### What went right
- Re-reading `app/` + `lib/` first gave a fast, accurate end-to-end model of content ingestion, route generation, and revalidation.
- The revalidation webhook logic is cohesive and defensive (cached fallbacks, deduped URL revalidation, tag + aggregate invalidation).
- Lint remains stable: 0 errors, 6 warnings.

### What went wrong
- Bracketed route paths still require quoted shell paths (zsh globbing issue) during CLI inspection.

### Corrections received
- None this session.

### What worked well
- Parallelized file reads with `sed` across `app/`, `lib/`, and `components/` to minimize context-gathering time.
- Running lint after the read-through quickly confirmed current hygiene and known warning scope.

### What to watch next
- `app/feed.xml/route.ts` and `app/sitemap.md/route.ts` still hardcode `revalidate = 3600`; consider aligning with `config.revalidateSeconds`.
- `lib/github.ts` and `lib/now.ts` duplicate GitHub REST fetch setup; consider sharing a single fetch utility.
- If performance becomes a concern, prioritize replacing repeated `<img>` usage with `next/image` in post/view/now/books surfaces.

## 2026-02-20 (Conferences spec)

### What went right
- Captured a decision-complete product and implementation spec for the new Conferences section.
- Wrote the spec as a reusable repo document at `docs/conferences-spec.md`.

### What to watch next
- Keep the implementation aligned with locked decisions in the spec (static data source, react-pdf viewer, sitemap/llms updates only).

## 2026-02-20 (Conferences implementation)

### What went right
- Implemented the Conferences feature end-to-end: static catalog API, homepage tab, dedicated routes, command palette integration, and sitemap/llms updates.
- Added a client-side PDF viewer component with mobile preview behavior and fallback UX for load failures.
- Lint passes with 0 errors (existing 6 image warnings unchanged).

### What went wrong
- Local dependency install for `react-pdf`/`pdfjs-dist` did not complete in this environment, so dependencies were added to `package.json` for manual install.

### What to watch next
- Run `npm install` locally to install `react-pdf` and `pdfjs-dist` before running `npm run dev`/`npm run build`.
- Populate `lib/conferences.ts` and `public/conferences/` with real presentation entries and PDF files.

### 2026-02-20 (Conference metadata extraction)
- Parsed conference metadata from filename pattern successfully.
- PDF content extraction for summary was blocked by embedded glyph encoding and missing OCR/text-extractor tools in the environment, so summary was inferred from title/theme and marked as a candidate for manual refinement.
- Fixed a `react-pdf` worker mismatch (`API 5.4.296` vs `Worker 5.4.624`) by pinning compatible dependency versions in `package.json` and setting worker URL based on `pdfjs.version` in `components/ConferencePdfViewer.tsx`.
- Removed standalone `/conferences` index route (`app/conferences/page.tsx`) so it now 404s, aligning behavior with no standalone `/views` or `/books` pages.
- Removed `/conferences` references from UI and machine-readable outputs (`components/LandingViews.tsx`, `app/sitemap.md/route.ts`, `app/llms.txt/route.ts`).
- Restyled `app/conferences/[slug]/page.tsx` to mirror post detail visual language (Playfair title, post-like metadata rows, `max-w-2xl` content width, split header/body sections, and article-like summary block).
- Updated conference detail header to match post header pattern with author avatar/name plus metadata row. Added conference reading-time estimation from `pageCount` and `contentDensity` metadata.
- Extended `CommandActionsPalette` with optional custom link commands and wired conference detail pages to expose Cmd+K actions for `Open PDF in new tab` and `Download PDF`.
- Added PDF viewer overlay expansion mode in `components/ConferencePdfViewer.tsx` using a portal modal with shared page/zoom state, Esc/backdrop close, and body scroll lock.

## 2026-02-20 (PDF flicker deep fix)

### What went right
- Isolated the flicker to the render transition path in `react-pdf` page switches rather than routing/data logic.
- Implemented a structural anti-flicker strategy in `components/ConferencePdfViewer.tsx`: stable page frame height + persisted last-rendered canvas snapshot shown during transitions.
- Verified lint remains healthy (0 errors, only existing `no-img-element` warnings).

### What went wrong
- Production build validation is blocked in this environment because `next/font` cannot fetch Google Fonts (network restriction), not because of app code errors.

### What to watch next
- Validate the transition behavior in a normal networked local run (`npm run dev`) to confirm the white flash is gone in real interaction.
- If any residual flash remains on very large PDFs, consider pre-rendering adjacent page canvases or moving to an iframe/pdf.js custom viewer route for full transition control.

## 2026-02-20 (Vercel TypeScript build fix)

### What went wrong
- Vercel `next build` failed on `components/CommandActionsPalette.tsx` because `commands` was inferred as a union where some items lacked `confirmation`, so accessing `command.confirmation` was rejected.

### What worked
- Added an explicit `CommandAction` type with optional `confirmation` and annotated `commands` as `CommandAction[]`.
- Switched state typing to `ReactNode` import to keep type usage explicit and consistent.
- Verified with `npm run lint` and `npx tsc --noEmit` (both pass in this environment).

## 2026-02-20 (Expanded PDF viewer frame flicker fix)

### Root cause
- In expanded mode, the component was rendering both inline and overlay PDF viewers concurrently, sharing a single `activeCanvasRef`.
- During page transitions, the frozen snapshot could be captured from the wrong viewer size, producing a visible white frame artifact around the page.

### Fix
- Render only one viewer at a time: hide inline viewer while overlay is open.
- Keep transition freeze behavior but explicitly hide the live `<Page>` while the frozen snapshot is active, preventing intermediate white frame exposure.
- Refactored viewer helper signature to choose refs internally and satisfy strict refs linting.

### Validation
- `npm run lint` passes (0 errors; only existing `no-img-element` warnings).

## 2026-02-20 (Expanded viewer page-shift RCA fix)

### Root cause
- The transition freeze image was rendered as full-frame `object-contain`, which can re-center/re-scale compared to the live PDF canvas.
- In overlay mode this caused a small apparent "page move" before next page render completion.

### Fix
- Replaced freeze state from plain image URL to a geometry-locked frame (`left`, `top`, `width`, `height`, `src`) captured from the live canvas bounds.
- Render freeze overlay at the exact captured canvas position/size, preventing recentering drift.
- Kept existing transition logic and controls unchanged.

### Validation
- `npm run lint` passes (0 errors; existing warnings unchanged).
- `npx tsc --noEmit` passes.

## 2026-02-20 (Expanded viewer shrink-left follow-up fix)

### Root cause refinement
- Freeze snapshot selection prioritized `lastRenderedPageImage`, which could come from the prior inline viewer size when overlay had just opened.
- This stale snapshot produced a visible shrink/left-shift effect before next-page render.
- Position clamping (`Math.max(0, ...)`) could also force slight left snaps in some layouts.

### Fix
- Transition now always captures from the current active canvas first (`canvas.toDataURL`) and only falls back to cached image on failure.
- Removed left/top clamping for freeze overlay geometry to preserve exact measured placement.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes (0 errors; existing warnings unchanged).

## 2026-02-20 (Overlay-close scale regression fix)

### Root cause
- Zoom state was shared between inline and overlay viewers, so expanded-view sizing interactions could leak into normal view and leave horizontal overflow after closing overlay.

### Fix
- Split zoom into `inlineZoom` and `overlayZoom`.
- On opening overlay, initialize `overlayZoom` from current `inlineZoom` in the expand button handler.
- Keep zoom controls mode-aware: adjust overlay zoom only when overlay is open, otherwise inline zoom.
- Avoided effect-based sync to satisfy strict hooks linting (`react-hooks/set-state-in-effect`).

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes (0 errors; existing warnings unchanged).

## 2026-02-20 (Overlay-close width observer RCA fix)

### Root cause
- Inline viewer width relied on a `ResizeObserver` attached once at mount.
- Opening overlay unmounted inline viewer; observer lifecycle could emit/retain width `0`.
- On close, inline viewer remounted but width measurement was stale, so `Page` sometimes rendered with undefined width and default intrinsic PDF size (horizontal overflow).

### Fix
- Rebind inline width observer whenever inline mode is active (`isOverlayOpen === false`).
- Ignore zero-width observer updates to avoid poisoning inline width state during unmount transitions.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes (0 errors; existing warnings unchanged).

## 2026-02-20 (Conferences GitHub spec doc)

### What went right
- Consolidated the agreed migration/caching/revalidation decisions into a concrete spec document.
- Added `docs/conferences-github-spec.md` to make implementation plan explicit and reusable.

## 2026-02-20 (Conferences GitHub migration implementation)

### What went right
- Implemented conferences source migration from local static data to GitHub issues in `lib/conferences.ts` with `unstable_cache` and `conferences` tag.
- Added conference issue exclusion in posts/views pipelines so `published+conference` items do not leak into post/view surfaces.
- Updated webhook revalidation strategy to include conference tags and conference detail path invalidation.
- Updated conference route data access to async GitHub-backed helpers.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes with only pre-existing `no-img-element` warnings.

## 2026-02-20 (Remote conference PDF fetch failure fix)

### Root cause
- Conference PDFs now come from remote GitHub attachment URLs.
- `react-pdf` loads files in-browser; remote attachment URLs can fail due to cross-origin/auth/fetch restrictions, yielding `UnknownErrorException: Failed to fetch`.

### Fix
- Added same-origin proxy endpoint `app/api/conference-pdf/route.ts`:
  - validates target URL and allowlisted hosts
  - fetches upstream PDF server-side (optionally with GitHub token)
  - streams PDF back with PDF-compatible headers
- Updated conference page to use proxied PDF URL for:
  - embedded viewer
  - Open PDF command
  - Download PDF command

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes (existing warnings unchanged).

## 2026-02-20 (Conference CMDK related content actions)

## 2026-03-14 (Highlights toggle typography correction)

### What went wrong
- The highlights toggle was bumped to `text-base`, which made it visibly larger than nearby UI labels like `Explore reading paths`.

### Correction received
- Match the toggle typography to the surrounding homepage section-label scale instead of the card title scale.

### Fix
- Reduced the toggle label size in `components/LandingViews.tsx` from `text-base` to `text-sm`.

## 2026-03-14 (Highlights toggle dark theme consistency)

### What went wrong
- The dark-mode active nav tab used the amber accent, but the active highlights toggle used a white fill, creating an inconsistent active-state language.

### Correction received
- Match the toggle active color to the same yellow accent used by the homepage nav underline in dark mode.

### Fix
- Updated the selected highlights toggle state in `components/LandingViews.tsx` from `dark:bg-white` to `dark:bg-amber-300`.

## 2026-03-14 (Highlights full-title no-shift layout)

### What went wrong
- The highlights cards were truncating long post titles with ellipses, and the current anti-shift strategy depended on fixed card heights rather than a stable pane layout.

### Correction received
- Show full post titles in both Featured and Popular cards without introducing UI shift when toggling.

### Fix
- Removed title line clamps from the highlights cards in `components/LandingViews.tsx`.
- Replaced the fixed-height card approach with two always-mounted highlight panes inside a measured wrapper that keeps the height of the taller mode while toggling.

## 2026-03-14 (Narrative scaffolding for long-form reading)

### What went right
- A shared markdown outline utility let the heading extractor, HTML renderer, and React markdown component use one stable heading-ID strategy.
- The reading shell stayed client-only while the article markup remained server-rendered, which kept the integration lightweight and aligned with the existing static page model.

### Product decisions made
- Long-form scaffolding appears when a piece has at least 900 words and 3 headings.
- Section effort is based on the word count between one heading and the next.
- Pull-quote treatment is applied automatically to blockquotes.

### Fix
- Added `lib/markdown-headings.ts` for heading extraction, reading-time math, and remark heading anchors.
- Updated `components/Markdown.tsx` to emit stable heading anchors and upgraded blockquotes into a pull-quote treatment.
- Added `components/ReadingShell.tsx` with a sticky progress bar, active-section tracking, desktop TOC, and mobile reading map.
- Integrated the reading shell into post and view detail pages.

## 2026-03-14 (Content relationship graph route)

### What went right
- The existing post, view, and conference loaders already expose canonical HTML URLs and enough label metadata to build a graph without introducing a new content source.
- A hand-rolled SVG plus positioned HTML nodes was sufficient for a mobile-friendly first version, so no graph dependency was needed.

### What went wrong
- Views do not carry their own labels directly, so the graph had to derive view topics from the union of child post labels.

### Fix
- Added `lib/content-graph.ts` to build a cached content/topic graph with label filtering, membership edges, and a one-hop focused neighborhood.
- Added `app/graph/page.tsx` and `components/ContentRelationshipGraph.tsx` for the dedicated exploration route.
- Added a command-palette action for `/graph` so the route is discoverable without editing the content pages.

## 2026-03-14 (Structured sitemap JSON index)

### What went right
- A shared `lib/content-index.ts` normalizer made it possible to add `sitemap.json` without duplicating post/view/conference mapping logic.
- Reusing the normalized dataset in `app/sitemap.md/route.ts` also removed a hardcoded `revalidate = 3600` in favor of the config-driven pattern already used elsewhere.

### What to watch next
- The first JSON schema version is intentionally compact and type-discriminated; if future agent consumers need more fields, extend `ContentIndexItem` in `lib/content-index.ts` rather than branching route-specific mapping again.

## 2026-03-08

### What went right
- Re-reading `AGENT_NOTES.md` first made the current architecture and prior problem areas easy to verify instead of rediscovering.
- The project structure is still coherent: GitHub Issues feed `lib/posts.ts`, `lib/views.ts`, `lib/conferences.ts`, and `lib/now.ts`, and App Router pages stay mostly thin.
- Webhook invalidation in `app/api/revalidate/route.ts` remains the operational center of the site and cleanly covers posts, views, conferences, comments, and `now`.

### What went wrong
- `app/feed.xml/route.ts` and `app/sitemap.md/route.ts` still hardcode `revalidate = 3600` instead of sourcing `config.revalidateSeconds`.
- Lint passes, but warning count is now 8 rather than the previously noted 6; all are `@next/next/no-img-element`.

### Corrections received
- None this session.

### What worked well
- Reading the homepage composition (`app/page.tsx`) together with the data modules gave the fastest accurate mental model of the site.
- A quick lint run after inspection confirmed the repo is currently clean apart from known image warnings.

### What to watch next
- If cache behavior is adjusted, align route-level revalidation constants with `lib/config.ts` to avoid TTL drift.
- `lib/now.ts` still duplicates GitHub REST fetch setup already present in `lib/github.ts`; a shared fetch helper would remove duplicate auth/error behavior.
- If image performance work starts, the warning hotspots are post/view/now detail pages, `components/LandingViews.tsx`, and `components/ConferencePdfViewer.tsx`.

## 2026-03-08 (Bio copy update)

### What went right
- Updated the bio copy consistently across the two active user-facing surfaces: homepage desktop sidebar and mobile `Know Pablo` drawer.
- The second paragraph already matched the requested copy and did not need changes.

### What worked well
- `rg` against the old copy found the exact update scope immediately, avoiding unnecessary edits elsewhere.

## 2026-03-08 (Markdown content URLs)

### What went right
- Added parallel `.md` route handlers for posts, views, and conferences without changing existing HTML routes or visible navigation.
- Centralized markdown URL generation and markdown document formatting in `lib/markdown-exports.ts`, which kept sitemap and webhook changes small.
- Updated `app/sitemap.md/route.ts` to emit markdown URLs for content while leaving top-level page entries unchanged.
- Extended `app/api/revalidate/route.ts` so markdown variants invalidate together with their HTML counterparts.

### What went wrong
- Next's generated route validator types dotted dynamic route handlers like `[slug].md` with `params: Promise<{}>`, which rejected narrower typed route contexts.

### What worked well
- Loosening the route-handler context to `Promise<unknown>` and validating/casting inside the handler resolved the framework typing mismatch cleanly.
- `npx tsc --noEmit` passes after the route handler adjustment.
- `npm run lint` still passes with only the existing 8 `@next/next/no-img-element` warnings.

### What to watch next
- If markdown exports are later expanded to include related links, be explicit about whether those links should point to canonical HTML URLs or the `.md` variants.
- `app/feed.xml/route.ts` still hardcodes `revalidate = 3600`; `sitemap.md` is now aligned with `config.revalidateSeconds`, but `feed.xml` is not yet.

## 2026-03-08 (Markdown URL routing correction)

### What went wrong
- The first implementation used dotted App Router folders like `app/views/[slug].md/route.ts`, which interfered with the expected HTML route behavior.
- The user explicitly corrected that the requirement was an alternative `.md` URL, not a replacement of the existing HTML route behavior.

### Corrections received
- Keep the existing HTML pages canonical and beautiful.
- Make `.md` work only as an alternate URL suffix for posts, views, and conferences.

### What worked well
- Replacing the dotted route folders with `middleware.ts` plus a single internal handler at `app/api/content-markdown/route.ts` preserves `/foo` as HTML and rewrites only `/foo.md`.
- Keeping sitemap output on public `.md` URLs and revalidation on those public paths still works with the middleware-based approach.

### What to watch next
- Avoid using dotted dynamic segment folders in App Router for alternate-format URLs unless route precedence is explicitly verified in the running app.

## 2026-03-08 (Markdown URL rewrite fix)

### Root cause
- The middleware-based interception layer was still too fragile for this use case: the markdown serializer/handler was fine, but public `*.md` content URLs were not resolving consistently through that interception path.
- For alternate-format URLs, explicit route rewrites are a more reliable fit than middleware pattern interception.

### Fix
- Removed `middleware.ts`.
- Added explicit rewrites in `next.config.ts` for:
  - `/:year/:month/:day/:slug.md`
  - `/views/:slug.md`
  - `/conferences/:slug.md`
- Kept the internal markdown renderer at `app/api/content-markdown/route.ts`.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes with only the existing 8 `@next/next/no-img-element` warnings.

### What to watch next
- Rewrites require the Next server to restart before they take effect in a running dev session.

## 2026-03-08 (Markdown URL precedence fix)

### Root cause
- The rewrite config existed, but it was still not taking effect for `*.md` content URLs because plain-array rewrites run as `afterFiles`.
- That meant existing App Router dynamic pages such as `/views/[slug]` and `/[year]/[month]/[day]/[slug]` matched first, treating `foo.md` as the HTML slug and returning 404 before the markdown rewrite was considered.

### Fix
- Moved the markdown URL aliases in `next.config.ts` into `beforeFiles` rewrites so they win before filesystem/app-route matching.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes with only the existing 8 `@next/next/no-img-element` warnings.

### What to watch next
- Any future alternate-format URL that overlaps an existing dynamic route likely needs `beforeFiles`, not the default rewrite phase.

## 2026-03-08 (Markdown URL internal route hardening)

### Root cause
- After rewrite precedence was fixed, the remaining weak point was the internal destination design: public `.md` URLs were still being funneled through a single query-driven handler, which left one more interpolation hop that could fail at runtime.

### Fix
- Replaced the single query-based handler `app/api/content-markdown/route.ts` with explicit dynamic internal handlers:
  - `app/api/content-markdown/post/[year]/[month]/[day]/[slug]/route.ts`
  - `app/api/content-markdown/view/[slug]/route.ts`
  - `app/api/content-markdown/conference/[slug]/route.ts`
- Updated `next.config.ts` rewrites to target those internal paths directly.
- Regenerated Next route types with `npx next typegen .` so `.next/types/validator.ts` reflects the new internal routes.

### Validation
- `npx next typegen .` passes.
- `npx tsc --noEmit` passes.
- `npm run lint` passes with only the existing 8 `@next/next/no-img-element` warnings.

### What to watch next
- Because `next.config.ts` changed again, the dev server must be restarted before testing the `.md` URLs.

## 2026-03-08 (Vercel segment config fix)

### Root cause
- Vercel production build rejected route files that exported `revalidate = config.revalidateSeconds`.
- In Next.js segment config exports, `revalidate` must be statically analyzable; imported config expressions are invalid even when they evaluate to a number.

### Fix
- Replaced non-static `revalidate` exports with the literal `3600` in:
  - `app/sitemap.md/route.ts`
  - `app/api/content-markdown/post/[year]/[month]/[day]/[slug]/route.ts`
  - `app/api/content-markdown/view/[slug]/route.ts`
  - `app/api/content-markdown/conference/[slug]/route.ts`

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes with only the existing 8 `@next/next/no-img-element` warnings.

### What to watch next
- Keep route/page segment config exports literal. If a shared TTL is needed, use shared cached fetchers for runtime behavior and reserve segment config exports for literal values only.

## 2026-03-08 (Product TODO backlog)

### What went right
- Added a root `TODO.md` with a concrete implementation backlog for three next-step features:
  - `sitemap.json` structured context index
  - narrative scaffolding for long-form reading
  - label-based relationship graphs

### What worked well
- The backlog was written against the existing route/data architecture so it points to realistic implementation surfaces (`app/`, `lib/`, `components/`) rather than staying at idea level.

### What went right
- Added conference-page command actions for related content using the same confirmation-list UI pattern as post related posts.
- Implemented:
  - `Show Related Conferences` (shared conference tags)
  - `Show Related Posts` (shared conference tags vs post labels)
- Extended command palette component to support optional related conferences payload.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes (existing warnings unchanged).

## 2026-02-20 (Keyboard navigation for related CMDK lists)

### What went right
- Added keyboard navigation for conference-page related result lists in command confirmation mode:
  - ArrowUp / ArrowDown cycle selection
  - Enter opens selected item
- Preserved existing confirmation UX for non-related commands.

### Implementation notes
- Introduced explicit `relatedConfirmation` state separate from generic confirmation content to keep type safety and predictable rendering.
- Added hover-to-select behavior for mouse + keyboard consistency.

### Validation
- `npx tsc --noEmit` passes.
- `npm run lint` passes (existing warnings unchanged).

## 2026-02-22 (Codebase re-familiarization)

### What went right
- Fast re-onboarding by reading `app/` route entrypoints first (`app/page.tsx`, post/view/now/conference pages), then `lib/` fetch/cache modules.
- Confirmed content model boundaries are still clear:
  - posts from `published` issues excluding `conference`,
  - views from parent/child issue links excluding `conference`,
  - conferences from `published+conference` issues with required `event` + PDF URL resolution.
- Webhook invalidation remains comprehensive across path + tag revalidation, now including conference detail URLs and `conferences` tag.

### Validation
- `npm run lint` passes with 0 errors and 8 warnings, all `@next/next/no-img-element`.

### What to watch next
- `app/feed.xml/route.ts` and `app/sitemap.md/route.ts` still hardcode `revalidate = 3600` instead of `config.revalidateSeconds`.
- `lib/now.ts` still duplicates GitHub REST fetch/header logic from `lib/github.ts`; shared fetch utility would reduce drift risk.
- PDF page-count estimation in `lib/conferences.ts` depends on naive `/Type /Page` counting and can under/over-count on edge PDFs.

## 2026-02-22 (Webhook label-change revalidation bugfix)

### Root cause
- In `app/api/revalidate/route.ts`, `issues` events with `action: labeled|unlabeled` only triggered content revalidation when the changed label was exactly `published` or `conference`.
- Changing any other label (the ones rendered as chips) did trigger the webhook endpoint but skipped `conferences`/`posts` revalidation, so pages could stay stale until TTL expiry.

### Fix
- Added shared `revalidateIssueContent()` helper and reused it for both `labeled|unlabeled` and `edited|closed|reopened` issue actions.
- Added `issueExistsInContentCaches()` guard so label-change events revalidate content when the issue is already present in post/view/conference caches, even if `published`/`conference` was just removed.
- Kept `now` handling intact (`label === "now"` still revalidates `/` and `/now` + `now` tag).

### Validation
- `npm run lint` passes (0 errors; existing 8 `no-img-element` warnings unchanged).
- `npx tsc --noEmit` passes.

## 2026-03-14 (Codebase re-familiarization)

### What went right
- Re-reading `AGENTS.md` and `AGENT_NOTES.md` first made the repo-specific constraints and prior edge cases immediately actionable.
- The architecture is still cleanly split:
  - `app/` handles route composition and metadata,
  - `lib/` handles GitHub ingestion, transformation, caching, and markdown export,
  - `components/` holds reusable UI and command palette behavior.
- The content model remains consistent: posts from `published` issues, views from parent-linked published issues, conferences from `published+conference` issues with required `event` and PDF URL, and `/now` from the latest `now` issue.
- `app/api/revalidate/route.ts` is still the operational center for freshness, covering posts, views, conferences, markdown variants, comments, aggregates, and `/now`.

### Validation
- `npm run lint` passes with 0 errors and 8 warnings, all `@next/next/no-img-element`.

### What to watch next
- `app/feed.xml/route.ts`, `app/sitemap.md/route.ts`, and the three markdown content routes still hardcode `revalidate = 3600` instead of sourcing `config.revalidateSeconds`.
- `lib/now.ts` still duplicates GitHub REST fetch/auth header setup already present in `lib/github.ts`.
- `lib/conferences.ts` page-count estimation is intentionally heuristic and may miscount some PDFs.

## 2026-03-14 (Popular posts via Redis)

### What went right
- Preserved the existing static post-page architecture by tracking reads through a client POST after mount rather than trying to mutate counters during prerender.
- Kept the feature isolated: Redis wiring lives in a dedicated helper, homepage popularity is server-read, and post detail popularity is client-hydrated.
- Homepage composition stayed clean by adding a second editorial rail instead of mixing dynamic popularity into the main posts index.

### What went wrong
- The biggest implementation risk was the `redis@5` transaction API shape; reading the installed typings first avoided guesswork around `multi().execTyped()`.

### What worked well
- Using GitHub issue numbers as Redis keys kept identity stable across permalinks, slug changes, and markdown export variants.
- Wiring publish-time bootstrap into `app/api/revalidate/route.ts` aligned the new feature with the site’s existing freshness model.

### Validation
- `npm run lint`
- `npx tsc --noEmit`

### What to watch next
- If Redis is unavailable, the site now hides popularity rather than failing; that is resilient, but production observability around that path may still be worth adding.
- Read counting currently increments on client mount, which is correct for real visits but can overcount during React Strict Mode development remounts.

## 2026-03-14 (Popularity identity switched to canonical URL)

### What changed
- Switched Redis popularity identity from GitHub issue number to canonical post URL paths like `/2023/12/16/the-job-of-product-managers-is-to-kill-their-jobs`.
- Updated both the per-post counter key and the ranking member to use the URL path directly.

### Why it matters
- The storage model now matches the user-facing permalink identity exactly, which makes manual Redis inspection more intuitive.

### Validation
- `npm run lint`
- `npx tsc --noEmit`

## 2026-03-14 (CSV popularity import script)

### What went right
- Added a standalone importer at `scripts/import-post-reads-from-csv.mjs` that reads `temp/top.csv` and writes both Redis counter keys and the ranking sorted set using canonical post URLs.
- Added a dry-run mode so CSV parsing and Redis key shape can be verified before mutating the database.

### Validation
- `npm run import:top -- --dry-run`
- `npm run lint`

## 2026-03-14 (Homepage highlights toggle redesign)

### What changed
- Replaced the side-by-side `Featured` + `Popular` homepage shelf with a single toggleable highlights module.
- Capped both `Featured` and `Popular` at 3 items to keep the editorial block compact.

### Why it worked better
- The previous two-column layout made the homepage feel visually crowded and forced the reader to compare two competing lists at once.
- A toggle preserves both datasets while restoring a single reading focal point.

### Validation
- `npm run lint`
- `npx tsc --noEmit`

## 2026-03-14 (Parallel TODO implementation integration)

### What went right
- Splitting the three unfinished TODO features into separate workers kept the ownership boundaries clean: sitemap/indexing, narrative scaffolding, and relationship graphs landed without file conflicts.
- A final main-thread integration pass was still necessary, especially to validate shared markdown and route behavior rather than trusting typecheck alone.
- The resulting surface area is coherent:
  - `sitemap.json` now shares normalization logic with `sitemap.md`
  - long-form posts and views share one heading/reading-shell pipeline
  - the relationship graph stays isolated behind a dedicated `/graph` route plus command-palette entry

### What went wrong
- Parallel implementation makes it easier to miss runtime integration edges that static checks do not catch, so shared markdown/anchor handling needed explicit review after the workers finished.
- Shell inspection of bracketed route paths still requires quoting in zsh.

### Validation
- `npx tsc --noEmit`
- `npm run lint`

### What to watch next
- The new reading shell and graph route were validated statically here; a manual browser pass would still be useful to confirm mobile behavior, sticky positioning, and graph legibility with real content.

## 2026-03-14 (Disable popularity increments in local dev)

### Correction received
- Local development page views should not mutate Redis read counters when `LOCAL_DEV` is present in `.env.local`.

### Fix
- Updated `lib/post-popularity.ts` so `trackPostRead()` short-circuits in local dev and returns the current popularity snapshot without incrementing the counter or ranking score.

### Validation
- `npx tsc --noEmit`
- `npm run lint`

## 2026-03-14 (Post metadata popularity simplification)

### Correction received
- Do not show exact read counts in individual post metadata.

### Fix
- Updated `components/PostPopularity.tsx` to remove the inline read-count display and keep only the `Popular #n` cue when applicable.

### Validation
- `npm run lint`

## 2026-03-14 (Reading shell visual de-emphasis)

### Correction received
- The reading progress UI was stealing focus from the article, shifting the prose left, and turning document headings into noisy link-like elements.

### Fix
- Updated `components/ReadingShell.tsx` so the article column stays centered at the original reading width and the progress panel sits off to the right as a secondary utility surface.
- Simplified the reading panel styling: lighter progress bar, quieter borders/backgrounds, and less aggressive active-section treatment.
- Updated `components/Markdown.tsx` so headings keep stable anchor IDs without rendering as inline links or showing the uppercase `LINK` hover label.

### Validation
- `npm run lint`

## 2026-03-14 (Reading shell sticky/layout follow-up)

### Correction received
- The de-emphasized reading shell lost sticky behavior, and the active section treatment should be reduced to a simple yellow straight border rather than a filled state.

### Fix
- Reworked `components/ReadingShell.tsx` desktop layout into a balanced grid with ghost columns so the article remains centered and the right rail stays sticky in normal flow.
- Simplified the reading map palette further and changed the active section state to a plain amber left border with no filled background.

### Validation
- `npm run lint`

## 2026-03-14 (Reading shell top progress removal)

### Correction received
- The fixed progress line at the top of post pages is unnecessary once the right-side reading map exists.

### Fix
- Removed the fixed top-edge progress indicator from `components/ReadingShell.tsx` and kept the reading map as the only progress UI.

### Validation
- `npm run lint`

## 2026-03-14 (Reading map anchor behavior correction)

### Correction received
- Reading map section items should visibly jump to their target sections, while keeping a neutral non-link visual treatment.

### Fix
- Updated `components/ReadingShell.tsx` so section items intercept clicks, smoothly scroll to the matching heading, and update the URL hash.
- Kept the reading map links styled as plain text rows with no blue or underline treatment.

### Validation
- `npm run lint`

## 2026-03-14 (Reading map runtime bug fix)

### Root cause
- The reading map was resolving raw heading IDs, but `rehype-sanitize` prefixes heading IDs in the DOM with `user-content-`, so scroll tracking and click navigation were both targeting elements that did not exist.
- The progress percentage used a heuristic based on viewport fractions and article rect offsets, which could legitimately stop short of 100% even at the bottom of the page.

### Fix
- Added a shared sanitized-heading helper in `lib/markdown-headings.ts`.
- Updated `components/ReadingShell.tsx` so both active-section tracking and click navigation resolve the actual sanitized DOM IDs.
- Replaced progress math with explicit article start/end tracking and a hard 100% once the page bottom is reached.

### Validation
- `npx tsc --noEmit`
- `npm run lint`

## 2026-03-14 (Reading map redundancy cleanup)

### Correction received
- The active section title shown next to overall reading time in the reading map header is redundant because the active section is already highlighted in the list.

### Fix
- Removed the redundant active-section text from the reading map header in `components/ReadingShell.tsx`, keeping only the overall reading time.

### Validation
- `npm run lint`

## 2026-03-14 (Reading map last-section highlight fix)

### Root cause
- Active-section selection was based on a fixed viewport threshold. Near the bottom of a page, the reader could already be in the final section while its heading still had not crossed that threshold, so the previous section remained highlighted.

### Fix
- Updated `components/ReadingShell.tsx` so active-section selection uses absolute heading positions with a reading line inside the viewport, and explicitly promotes the last heading when the page bottom is reached.

### Validation
- `npm run lint`

## 2026-03-14 (Mobile reading progress simplification)

### Correction received
- On mobile, bring back a sticky top progress bar and remove the full reading map card.

### Fix
- Updated `components/ReadingShell.tsx` so small screens show a fixed top-edge progress indicator while the mobile reading-map card is removed entirely.
- Desktop keeps the right-side reading map unchanged.

### Validation
- `npm run lint`

## 2026-03-14 (Blockquote styling rollback)

### Correction received
- The upgraded pull-quote card styling was too opinionated; blockquotes should stay in their original simple editorial treatment.

### Fix
- Reverted `components/Markdown.tsx` blockquotes to the original left-border style instead of the large quote-card treatment.

### Validation
- `npm run lint`
