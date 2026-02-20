# GitHub-Issue-Backed Conferences Spec

## Summary
Migrate Conferences from local static entries in `lib/conferences.ts` to GitHub Issues as source of truth, while preserving existing UX and following the app’s cache/revalidation model (`unstable_cache`, tag invalidation, aggregate path revalidation, static route generation).

## Locked Decisions
- Source strategy: GitHub only.
- Modeling: one issue per conference.
- Inclusion: labels `published` + `conference`.
- State rule: same as posts today (open issues only).
- Date: `publishedAt` frontmatter first, fallback to issue `created_at`.
- Mandatory conference frontmatter: `event` only.
- PDF source: issue attachment/body PDF URL.
- Summary: frontmatter `excerpt` first, then body-derived summary.
- Page count and density: auto-calculated.

## Scope
- Replace local conference catalog with GitHub-backed loader.
- Keep existing conferences UI/routes/viewer behavior.
- Ensure conference issues do not appear in posts/views.
- Extend caching and webhook revalidation with `conferences` tag.

Out of scope:
- New admin UI.
- Conferences in RSS feed.
- Standalone `/conferences` index route.

## Data Contract (Conference Issue)

### Labels
- Required labels: `published`, `conference`.

### Frontmatter
- Required:
  - `event`
- Optional:
  - `publishedAt`
  - `slug`
  - `excerpt`
  - `location`

### Field Resolution
- `title`: issue title.
- `date`: `publishedAt` if valid, else issue `created_at`.
- `summary`: `excerpt` if present, else derived from body.
- `pdfPath`: first valid `.pdf` URL found in issue body/attachment links.
- `pageCount`: auto-calculated.
- `contentDensity`: auto-calculated.

## Public Interfaces / Type Changes

### `types.ts`
`Conference` should include:
- `id: string`
- `number: number`
- `slug: string`
- `title: string`
- `event: string`
- `date: string`
- `summary: string`
- `pdfPath: string`
- `pageCount: number`
- `contentDensity: "light" | "medium" | "dense"`
- `location?: string`
- `url: string`

## Implementation Plan

### 1) `lib/conferences.ts`
- Replace static array with async GitHub-backed mapping.
- Fetch conference-eligible issues.
- Parse frontmatter/body and map to `Conference`.
- Resolve slug and URL.
- Resolve PDF URL.
- Auto-calculate page count/density.
- Sort by date desc.
- Export:
  - `getConferences()`
  - `getConferenceBySlug(slug)`
  - `getConferenceYearsGrouped()`

### 2) Exclude conferences from posts/views
- Update posts pipeline to ignore issues with label `conference`.
- Update views pipeline to ignore issues with label `conference`.

### 3) Keep conferences route behavior
- Keep `/conferences/[slug]` route and style behavior unchanged.
- Keep `/conferences` non-existent (404).
- Make conference route async against new `getConferences` loader.

### 4) Search and discovery
- Keep CMD+K conference indexing and navigation behavior.
- Keep homepage `?view=conferences` behavior unchanged.

### 5) SEO/machine-readable
- `sitemap.md`: include conference URLs from new source.
- `llms.txt`: keep conferences links.
- `feed.xml`: unchanged (no conferences).

## Caching Strategy (App-Aligned)

### Conference data cache
Implement `getConferences` via `unstable_cache`:
- key: `['conferences']`
- revalidate: `config.revalidateSeconds`
- tags:
  - `conferences`
  - `github-issues` (source-aligned tag)

Derived helpers must use cached `getConferences` (no separate cache layer).

### Rendering model
- Keep `app/conferences/[slug]/page.tsx` static (`dynamic = "force-static"`).
- `generateStaticParams` and `generateMetadata` derive from cached conferences.

## Revalidation Strategy
Update `app/api/revalidate/route.ts`:

1. Extend content-tag invalidation:
- add `revalidateTag('conferences', 'max')`.

2. Keep aggregate invalidation:
- `/`
- `/feed.xml`
- `/sitemap.md`

3. For `issues` events (`labeled`, `unlabeled`, `edited`, `closed`, `reopened`):
- when conference relevance changes or conference issue updates:
  - revalidate affected `/conferences/[slug]` when resolvable
  - revalidate content tags (including `conferences`)
  - revalidate aggregate paths

4. Keep `issue_comment` behavior unchanged unless explicit conference comment behavior is added later.

## Edge Cases and Fallbacks
- Missing required `event`: exclude issue, warn in dev.
- Missing/invalid date: fallback to `created_at`; if invalid, exclude.
- Missing PDF URL: exclude issue, warn in dev.
- PDF metadata auto-calc failure: fallback to `pageCount = 1`, `contentDensity = 'medium'`.

## Testing and Acceptance Criteria

### Functional
- A `published + conference` issue appears in:
  - `/?view=conferences`
  - CMD+K results
  - `/conferences/[slug]`
- The same issue does not appear in posts or views.
- Date fallback behavior works (`publishedAt` -> `created_at`).
- Summary fallback behavior works (`excerpt` -> body-derived).
- PDF actions still work (open/download).

### Revalidation
- Label add/remove (`published` and/or `conference`) updates visibility after webhook.
- Conference issue edits update detail page and homepage conferences list.
- `sitemap.md` updates accordingly.

### Quality gates
- `npx tsc --noEmit` passes.
- `npm run lint` passes (existing known warnings acceptable).

## Assumptions
- Issue attachment PDF URLs are reachable by the app runtime/build.
- Open-only issue state remains intentional to match current posts behavior.
- Existing conference page UI and viewer behavior remain unchanged during data-source migration.
