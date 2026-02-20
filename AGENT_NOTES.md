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
