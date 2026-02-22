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
