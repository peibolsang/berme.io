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
