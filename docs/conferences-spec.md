# Conferences Feature Spec

## Summary
Add a new `Conferences` content section to the homepage tabs (next to `Books`) backed by static local metadata + PDF files, with deep-linkable conference detail pages (`/conferences/[slug]`) and an embedded React/PDF.js viewer so users can browse presentations without leaving the site.

## Product Decisions Locked
- Data source: Manual metadata file + local PDF assets.
- Navigation: New homepage tab `Conferences`; keep `Posts` as default tab.
- Content organization: Group conferences by year.
- Required metadata: `title`, `event`, `date`, `summary`, `pdfPath`.
- Discovery scope: Homepage tab + conference detail routes + command palette search.
- Viewer tech: `react-pdf` (PDF.js).
- Asset storage: `public/conferences/*.pdf`.
- SEO scope: Include conference URLs in `sitemap.md`, not `feed.xml`.
- `llms.txt`: Add conferences links.
- Mobile behavior: Show first-page preview + open/download controls.
- Failure fallback: “Open in new tab” + “Download PDF”.

## Implementation Design

### 1) Data Model and Static Catalog
- Add `Conference` type in `types.ts`:
  - `id: string`
  - `slug: string`
  - `title: string`
  - `event: string`
  - `date: string` (ISO date)
  - `summary: string`
  - `pdfPath: string` (e.g. `/conferences/devopscon-2024.pdf`)
  - `location?: string` (optional for future-proofing)
- Add `lib/conferences.ts`:
  - Static array catalog.
  - `getConferences(): Conference[]` sorted descending by date.
  - `getConferenceBySlug(slug: string): Conference | null`.
  - `getConferenceYearsGrouped(): Array<{ year: string; items: Conference[] }>`.

### 2) Routes and Pages
- Do not provide a standalone `/conferences` index route (align with no standalone `/views` or `/books` route).
- Add detail page `app/conferences/[slug]/page.tsx`:
  - Metadata + summary + event/date.
  - Embedded React/PDF.js viewer area.
  - Explicit buttons:
    - `Open PDF in new tab`
    - `Download PDF`
- Add `generateStaticParams` for conference detail pages.
- Add `generateMetadata` for list/detail routes (title, description, canonical).

### 3) PDF Viewer Behavior
- Install/use `react-pdf` with PDF.js worker configuration.
- Desktop:
  - Embedded viewer with at least page navigation and zoom controls.
- Mobile:
  - Render first page preview and keep primary CTA buttons visible above fold.
- Error state:
  - If render fails, show message + `Open in new tab` + `Download PDF`.
- Loading state:
  - Skeleton/loading indicator while PDF loads.

### 4) Homepage Tab Integration
- Update `components/LandingViews.tsx`:
  - Extend tab options to include `conferences`.
  - Add `Conferences` tab panel with grouped-by-year listing.
  - Preserve existing query-param behavior:
    - `?view=conferences` activates conferences tab.
    - no `view` param defaults to posts.
- Update `app/page.tsx`:
  - Fetch conferences data and pass into `LandingViews`.
- Keep styling language consistent with existing cards/lists.

### 5) Command Palette Integration
- Update `components/CommandPalette.tsx`:
  - Extend props to accept `conferences`.
  - Index conferences as a searchable kind.
  - Result click goes to `/conferences/{slug}`.
  - Include summary text for search matching.
- Keep current filters/sorting semantics; conferences participate like posts/views/books where applicable.

### 6) SEO and Machine-Readable Endpoints
- Update `app/sitemap.md/route.ts`:
  - Add conference list + detail URLs to entries.
  - Add `kind: "conference"` in sitemap entry type union.
  - Use conference date as `lastModified`.
- Do not add conferences to `app/feed.xml/route.ts`.
- Update `app/llms.txt/route.ts`:
  - Add link to `/?view=conferences`.

### 7) Optional Supporting Refactor (Within Scope)
- Keep change focused; no broad refactor of posts/views.
- Reuse existing list-item patterns for consistency.
- Keep all conference content static and local (no GitHub API wiring).

## Public Interfaces / Type Changes
- `types.ts`: new exported `Conference` type.
- `lib/conferences.ts`: new exported helpers:
  - `getConferences`
  - `getConferenceBySlug`
  - `getConferenceYearsGrouped`
- `components/LandingViews.tsx`: props expanded with `conferences: Conference[]`.
- `components/CommandPalette.tsx`: props expanded with `conferences: Conference[]`.
- `app/sitemap.md/route.ts`: sitemap entry `kind` union expanded with `"conference"`.

## Edge Cases and Failure Modes
- Missing/malformed date in conference catalog:
  - Exclude item at runtime and log in dev mode.
- Invalid `pdfPath`:
  - Detail page still renders metadata and shows fallback action buttons.
- PDF.js render error or unsupported environment:
  - Show fallback actions immediately.
- Empty conference catalog:
  - Conferences tab shows explicit empty-state copy.

## Testing and Validation Plan
- Static/type checks:
  - `npm run lint` passes (warnings unchanged unless intentionally addressed).
- Functional scenarios:
  - Homepage tabs include `Conferences` and switch via URL query param.
  - `/?view=conferences` opens conferences panel.
  - `/conferences` returns 404.
  - `/conferences/{slug}` resolves valid entries and 404s unknown slug.
  - Embedded PDF viewer loads on desktop for valid PDFs.
  - Mobile layout shows preview + actionable buttons.
  - PDF failure path shows open/download fallback.
  - Command palette returns conference hits and navigates correctly.
  - `sitemap.md` includes conference URLs.
  - `feed.xml` unchanged (no conference items).
- `llms.txt` includes conferences links.

## Acceptance Criteria
- Users can discover conferences from main tab navigation and command palette.
- Users can open a conference detail page and view PDFs on-site via React/PDF.js.
- Users always have non-embedded access via open/download actions.
- Conferences are statically generated, local-asset-based, and independent from GitHub Issues.
- SEO/machine outputs reflect conferences exactly as scoped (`sitemap.md`, `llms.txt`, not RSS).

## Assumptions and Defaults
- Conference files are committed under `public/conferences/`.
- Metadata is manually curated in code for now (no CMS/import pipeline).
- Existing visual system and component patterns remain intact.
- No auth/privacy controls are required for PDFs.
