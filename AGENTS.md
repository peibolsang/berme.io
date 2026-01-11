# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router project.
- `app/` contains route modules and layouts (e.g., `app/page.tsx`, `app/layout.tsx`) and global styles in `app/globals.css`.
- `app/api/revalidate/route.ts` handles GitHub webhook revalidation.
- `public/` stores static assets served at the site root.
- Config lives at the top level: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, and `postcss.config.mjs`.
- Data access lives in `lib/` (GitHub DAL, posts, comments, caching utilities).
- Shared UI lives in `components/` (Markdown renderer, theme toggle).

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
- `npm run dev` starts the local dev server on `http://localhost:3000`.
- `npm run build` creates the production build.
- `npm run start` serves the production build locally (run after `build`).
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
- SEO routes: `sitemap.xml`, `feed.xml`, `robots.txt`.

## Caching & Revalidation Strategy
- Post pages are statically generated (`dynamic = "force-static"` with `generateStaticParams`) and updated only via webhook revalidation.
- Aggregation data (posts list, views, pinned issues, issues-with-parents) cached via `unstable_cache` with TTL `REVALIDATE_SECONDS` (default 3600).
- Comments cached via `unstable_cache` in `lib/comments.ts` with tag `comments:<issueNumber>` and TTL 300s.
- Revalidation webhook in `app/api/revalidate/route.ts`:
  - Issue labeled `published` → `revalidatePath(postUrl)` + `revalidatePath("/")` + `revalidateTag(posts/views/pinned/issues-with-parents)`
  - Issue edited → `revalidatePath(postUrl)` + `revalidatePath("/")` + `revalidateTag(posts/views/pinned/issues-with-parents)`
  - Comment created → `revalidatePath(postUrl)` + `revalidateTag(comments:<issueNumber>)`
  - Aggregates also revalidate `/feed.xml` and `/sitemap.xml` on post changes.
- Webhook signature validated with `GITHUB_WEBHOOK_SECRET`.
- GraphQL parent-issue lookups fall back to the last successful snapshot to avoid view parents leaking into posts during transient failures.

## Commit & Pull Request Guidelines
There is no established commit convention yet (only the initial scaffold commit exists). Use short, imperative messages (e.g., "Add hero section"). For pull requests:
- Include a concise summary of changes and rationale.
- Add screenshots or recordings for UI changes.
- Note any manual test steps (e.g., `npm run lint`, `npm run dev`).

## Security & Configuration Tips
Store secrets in environment files (e.g., `.env.local`) and avoid committing them. Update `next.config.ts` only when project-level behavior changes.
Required env vars for production: `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`. Optional: `GITHUB_OWNER`, `GITHUB_REPO`, `REVALIDATE_SECONDS`. Note: pinned posts require `GITHUB_TOKEN` (GraphQL).
