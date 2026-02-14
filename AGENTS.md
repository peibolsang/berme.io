# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router project.
- `app/` contains route modules and layouts (e.g., `app/page.tsx`, `app/layout.tsx`) and global styles in `app/globals.css`.
- `app/api/revalidate/route.ts` handles GitHub webhook revalidation.
- SEO + machine-readable endpoints live in `app/feed.xml/route.ts`, `app/sitemap.md/route.ts`, `app/robots.txt/route.ts`, and `app/llms.txt/route.ts`.
- `public/` stores static assets served at the site root.
- Config lives at the top level: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, and `postcss.config.mjs`.
- Data access lives in `lib/` (GitHub DAL, posts, comments, caching utilities).
- Shared UI lives in `components/` (Markdown renderer, theme toggle).

## Development Commands
Use npm scripts from `package.json`:
- `npm run lint` runs ESLint for code quality checks.

## Coding Style & Naming Conventions
Follow existing patterns in the `app/` directory:
- Use TypeScript for components and routes (`.tsx`).
- Match the file-based routing names (`page.tsx`, `layout.tsx`).
- Keep styling in `app/globals.css` and prefer Tailwind utility classes where appropriate.
- Formatting is enforced by ESLint; run `npm run lint` before pushing.

## Testing Guidelines
No test framework is currently configured. If you add tests, document the runner and add a script to `package.json`. Prefer colocated tests under `app/` or a top-level `tests/` directory, with names like `*.test.tsx`.

## Features Implemented
- GitHub Issues CMS: posts are issues labeled `published` in `GITHUB_OWNER/GITHUB_REPO`.
- Pinned posts: GitHub pinned issues (GraphQL) are surfaced as a Featured section on the homepage.
- Permalinks: `/{year}/{month}/{day}/{slug}` with redirects for date-only routes.
- Markdown rendering with GFM + sanitization + syntax highlighting.
- Post labels rendered as chips (excluding `published`).
- Comments rendered from GitHub issue comments, with Markdown.
- Optional post cover image via frontmatter `image` rendered above the post title.
- Dark mode with toggle (Radix icons) and split header/body backgrounds.
- SEO routes: `sitemap.md`, `feed.xml`, `robots.txt`, and `llms.txt`.

## Caching & Revalidation Strategy
- Rendering model:
  - Post pages (`app/[year]/[month]/[day]/[slug]/page.tsx`) and view pages (`app/views/[slug]/page.tsx`) are statically generated (`dynamic = "force-static"` + `generateStaticParams`).
  - `/now` is also static (`dynamic = "force-static"`), but without params.
  - Home (`app/page.tsx`) is server-rendered from cached data fetchers.
- Data caches (`unstable_cache`, TTL = `REVALIDATE_SECONDS`, default `3600`):
  - `lib/github.ts`: `getAllBlogIssues`, `getPinnedIssueNumbers`, `getIssuesWithParents`, `getGithubUser`.
  - `lib/posts.ts`: `getAllPosts` (`tags: ["posts"]`).
  - `lib/views.ts`: `getAllViews` (`tags: ["views", "github-issues-with-parents", "posts"]`).
  - `lib/now.ts`: `getNowPost` (`tags: ["now"]`).
- Comments cache:
  - `lib/comments.ts`: `getIssueComments(issueNumber)` uses `unstable_cache` with TTL `300` and tag `comments:<issueNumber>`.
- Route-level revalidation:
  - `app/feed.xml/route.ts` and `app/sitemap.md/route.ts` export `revalidate = config.revalidateSeconds` (driven by `REVALIDATE_SECONDS`, default `3600`).
- Webhook invalidation (`app/api/revalidate/route.ts`):
  - Validates `x-hub-signature-256` using `GITHUB_WEBHOOK_SECRET`.
  - Revalidates aggregate paths via `revalidatePath("/")`, `revalidatePath("/feed.xml")`, `revalidatePath("/sitemap.md")`.
  - Revalidates content tags: `posts`, `views`, `github-issues`, `github-issues-with-parents`, `github-pinned-issues`.
  - `issues` events:
    - `labeled`/`unlabeled` with label `published`: revalidates resolved post URL(s), related view URL (if mapped), content tags, and aggregate paths.
    - `pinned`/`unpinned`: revalidates content tags and aggregate paths.
    - `edited`/`closed`/`reopened`: revalidates resolved post URL(s), related view URL (if mapped), content tags, and aggregate paths.
    - `labeled`/`unlabeled` with label `now`, or edited issue carrying `now` label: revalidates `/`, `/now`, and tag `now`.
  - `issue_comment` `created` event:
    - revalidates resolved post URL(s),
    - revalidates tag `comments:<issueNumber>`,
    - and if the issue has the `now` label, revalidates `/` and `/now`.
- Resilience:
  - `fetchIssuesWithParents()` keeps an in-memory `lastIssuesWithParents` snapshot and falls back to it when GraphQL fails, reducing transient parent-link regressions.

## Commit & Pull Request Guidelines
There is no established commit convention yet (only the initial scaffold commit exists). Use short, imperative messages (e.g., "Add hero section"). For pull requests:
- Include a concise summary of changes and rationale.
- Add screenshots or recordings for UI changes.
- Note any manual test steps (e.g., `npm run lint`, `npm run dev`).

## Security & Configuration Tips
Store secrets in environment files (e.g., `.env.local`) and avoid committing them. Update `next.config.ts` only when project-level behavior changes.
Required env vars for production: `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`. Optional: `GITHUB_OWNER`, `GITHUB_REPO`, `REVALIDATE_SECONDS`. Note: pinned posts require `GITHUB_TOKEN` (GraphQL).

## IMPORTANT: Self-Improvement

- Build a markdown file (@AGENT_NOTES.md) where you log what goes right, what goes wrong, what I corrected, what worked and what didn't. It's kind of scratchpad to take notes on yourself during every session.
- Check these evolving notes in @AGENT_NOTES.md as an input of your implementation.
