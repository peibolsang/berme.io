# TODO

Implementation backlog for the next product-facing improvements on `berme.io`.

## 1. `sitemap.json` structured context index for agents

### Goal
Expose a deterministic machine-readable content index for posts, views, conferences, and core site metadata.

### Deliverables
- [x] Add `app/sitemap.json/route.ts`
- [x] Return a stable JSON schema with:
  - [x] site metadata (`site`, `generatedAt`, `baseUrl`)
  - [x] content items with `id`, `type`, `title`, `htmlUrl`, `markdownUrl`
  - [x] timestamps (`publishedAt`, `updatedAt`)
  - [x] labels / taxonomy fields
  - [x] relationship fields (`view`, related labels, conference event/location)
  - [x] summary/excerpt fields
- [x] Include posts from `lib/posts.ts`
- [x] Include views from `lib/views.ts`
- [x] Include conferences from `lib/conferences.ts`
- [x] Reuse markdown URL generation from `lib/markdown-exports.ts`
- [x] Keep route-level `revalidate` static and aligned with current `3600` pattern

### Implementation notes
- Build a shared normalizer in `lib/` so `sitemap.md`, `sitemap.json`, and future agent endpoints do not duplicate mapping logic.
- Prefer canonical HTML URLs plus explicit `.md` URLs rather than making agents infer one from the other.
- Add a top-level schema version field for future compatibility.

### Validation
- [x] Verify route returns valid JSON with all content types present
- [x] Verify webhook-driven revalidation includes `/sitemap.json`
- [x] Add `sitemap.json` reference to `llms.txt` if useful

## 2. Better narrative scaffolding for long posts

### Goal
Make long-form reading feel guided, lighter, and more intentional without changing the current editorial tone.

### Deliverables
- [x] Reading progress indicator on post and view pages
- [x] Sticky section navigation generated from markdown headings
- [x] Estimated effort per section, not just whole-post reading time
- [x] Inline pull-quote treatment for strong sentences / blockquotes

### Implementation notes
- [x] Add a heading extractor in `lib/markdown-render.ts` or a sibling utility that can produce section metadata from markdown.
- [x] Extend `components/Markdown.tsx` to emit stable heading anchors consistently.
- [x] Add a client-side reading shell component for:
  - [x] progress tracking
  - [x] active section highlighting
  - [x] sticky table of contents
- [x] Apply first to:
  - [x] `app/[year]/[month]/[day]/[slug]/page.tsx`
  - [x] `app/views/[slug]/page.tsx`
- Keep visual language consistent with the existing post/view layouts; do not turn pages into generic docs pages.

### Product details to settle
- [x] Define the threshold for “long post” before scaffolding appears
- [x] Decide whether section effort is based on word count or heading depth
- [x] Decide whether pull quotes are automatic (from blockquotes) or editorial/frontmatter-driven

### Validation
- [x] Desktop and mobile sticky navigation behavior
- [x] Anchor links and deep-linking
- [x] No regressions to markdown rendering or reading flow

## 3. Content relationship graphs based on labels

### Goal
Turn labels into a visible relationship graph so readers can explore adjacent ideas instead of only moving linearly.

### Deliverables
- [x] Build a graph data model from labels across posts, views, and conferences
- [x] Add a visual graph component with connected nodes
- [x] Surface the graph on content pages and/or a dedicated exploration route
- [x] Make graph interactions open canonical HTML pages, not `.md` routes

### Graph model
- [x] Nodes:
  - [x] posts
  - [x] views
  - [x] conferences
  - [x] optional topic/label nodes
- [x] Edges:
  - [x] shared labels
  - [x] post-to-view membership
  - [x] conference-to-post/topic similarity by label

### Implementation notes
- [x] Start with server-generated graph data in `lib/` and a client renderer in `components/`.
- [x] Keep the first version simple:
  - [x] one-hop neighborhood around the current item
  - [x] node size by connection count
  - [x] color by type (`post`, `view`, `conference`, `topic`)
- [x] Consider a dedicated route like `app/graph/page.tsx` after embedding a smaller inline graph on content pages.
- If graph layout becomes complex, use a lightweight visualization library only after confirming hand-rolled SVG is insufficient.

### Product details to settle
- [x] Whether labels should be shown raw or normalized into curated topics
- [x] Whether low-signal labels should be excluded
- [x] Whether graph density should be capped to preserve readability

### Validation
- [x] Graph remains legible on mobile
- [x] Interaction is keyboard accessible
- [x] No misleading relationships from weak/shared labels

## Recommended order

1. `sitemap.json`
2. narrative scaffolding
3. relationship graphs

## Why this order

- `sitemap.json` creates structured machine-readable foundations that other AI/discovery features can reuse.
- narrative scaffolding improves the reading experience immediately on existing content pages.
- relationship graphs are highest upside, but they depend on stronger metadata and careful curation to avoid noisy results.

## 4. Popular posts backed by Redis reads

### Goal
Surface the site’s most-read posts as a first-class editorial feature, pairing a dynamic `Popular` rail with the existing `Featured` shelf.

### Deliverables
- [ ] Add Redis-backed post read tracking in `lib/`
- [ ] Create and maintain one Redis entry per post plus a ranking index
- [ ] Increment reads when a visitor lands on a post URL
- [ ] Add `app/api/post-reads/route.ts` for tracking reads and returning live popularity metadata
- [ ] Show a new `Popular` shelf next to `Featured` in the homepage posts view
- [ ] Show inline read/popularity metadata on post detail pages
- [ ] Bootstrap new published posts into Redis during webhook-driven content revalidation

### Implementation notes
- Use GitHub issue number as the stable post identifier in Redis.
- Keep post pages statically generated; hydrate popularity client-side so reads do not couple to prerendering or prefetch.
- Use a sorted-set ranking plus per-post counters so top-5 lookup and exact read counts are both straightforward.
- Hide the feature gracefully when Redis is unavailable instead of breaking the rest of the site.

### Validation
- [ ] Verify new published posts receive Redis entries
- [ ] Verify post visits increment reads
- [ ] Verify the homepage `Popular` rail shows the top 5 posts by reads
- [ ] Verify post detail pages show exact reads and `Popular #n` when applicable
