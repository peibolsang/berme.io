

## 1) Product Requirements Document (PRD)

### 1.1 Overview

Build a **minimalist personal blog website** powered by **GitHub Issues** as the CMS. The site fetches blog posts from a specific GitHub repo (**OctoType**) via GitHub API using a personal API token stored in environment variables.

### 1.2 Goals

1. **Landing page** shows a compact list of all blog posts grouped by **year**.
2. Clicking a post navigates to a permalink with the format:
   `/{year}/{month}/{day}/{slug}`
3. Content source is **GitHub Issues** from repo `OctoType` under a defined filter/convention.
4. If a user requests a **non-existent post permalink**, return a **404**.
5. If a user requests a URL like `/{year}/{month}/{day}` (no slug), the site should **not “go anywhere”** (no post). It should **not show an error**; it should simply **redirect to home** (or show the index list).

### 1.3 Non-goals

* No admin UI, no WYSIWYG editor.
* No comments, likes, or auth.
* No full-text site search (optional later).
* No tags/categories UI beyond what’s needed to filter “blog posts”.

### 1.4 Target Users

* Any visitor reading the blog.
* Owner (you) authoring posts via GitHub Issues.

### 1.5 Success Criteria / Acceptance

* Home lists posts grouped by year, newest first.
* Each post renders from GitHub Issue body as Markdown, with correct title/date.
* Valid permalinks render correctly.
* Invalid `/{y}/{m}/{d}/{slug}` returns 404.
* `/{y}/{m}/{d}` redirects to `/` (200 after redirect) and does not show an error page.
* Works locally with `.env.local` GitHub token.

---

## 2) Content Model: GitHub Issues → Blog Posts

### 2.1 Repository and Filters

* **Repo:** `OctoType` (owner is your GitHub username; agent should make this configurable).
* Use **only Issues** that match:

  * `state = open` OR `state = all` (choose `all` to include historical posts)
  * Must have label: **`blog`** (required)
    This prevents every repo issue from becoming a post.

### 2.2 Post Fields Mapping

Each blog post is derived from one issue:

| Blog Field    | Source                                                     |
| ------------- | ---------------------------------------------------------- |
| `id`          | issue `number` (or `node_id`)                              |
| `title`       | issue `title`                                              |
| `body`        | issue `body` (Markdown)                                    |
| `publishedAt` | issue `created_at` (default)                               |
| `updatedAt`   | issue `updated_at`                                         |
| `slug`        | derived from title (slugify) OR overridden via frontmatter |
| `urlDate`     | from `publishedAt` (YYYY/MM/DD)                            |

### 2.3 Optional Frontmatter (Recommended)

Support **YAML frontmatter** at the top of issue body to override metadata:

```md
---
slug: my-custom-title
publishedAt: 2011-11-08
excerpt: Short teaser text.
draft: false
---
# Actual markdown starts here
```

Rules:

* If `draft: true`, exclude from index and routing.
* If `publishedAt` present, use it for URL + display date.
* If `slug` present, use it; else slugify `title`.
* If no frontmatter exists, everything falls back to issue fields.

### 2.4 Slug Generation

* Lowercase
* Replace spaces with `-`
* Remove non-alphanumerics except `-`
* Collapse multiple `-`
* Example: `"Hello, World!"` → `hello-world`

---

## 3) User Experience & UI Spec

### 3.1 Visual Design

* **Minimalist**: white background, black/gray text, generous whitespace.
* Home shows **only a list** grouped by year.
* No hero section, no cards, no heavy chrome.
* Small typographic hierarchy:

  * Year headings
  * Post title links
  * Optional date inline (subtle)

### 3.2 Home Page Information Architecture

* URL: `/`
* Content: grouped list like:

```
2024
  11-02  Post title
  04-19  Another post

2023
  09-10  ...
```

Requirements:

* Sort posts by `publishedAt` descending.
* Group by year.
* Each item is a link to `/{yyyy}/{mm}/{dd}/{slug}`.
* Keep it performant: pagination is not required initially, but handle up to ~1000 posts.

### 3.3 Post Page

* URL: `/{year}/{month}/{day}/{slug}`
* Render:

  * Title
  * Date
  * Markdown body (GitHub-flavored Markdown)
* Minimal “Back” link to home.

### 3.4 Route Behavior

* `/YYYY/MM/DD/slug`: renders post if exists else **404**
* `/YYYY/MM/DD` (no slug): **redirect to `/`** (no error page)
* Any other unknown route: default Next.js **404**

---

## 4) System & Technical Requirements

### 4.1 Stack

* Next.js (App Router) + TypeScript
* Server-first fetching using GitHub API
* Minimal CSS (either Tailwind or plain CSS). Choose one:

  * **Option A (recommended): Tailwind** for quick minimalist typography
  * **Option B: CSS modules** with a tiny stylesheet

### 4.2 GitHub API Usage

Use GitHub REST API (simpler) or GraphQL (more efficient). Recommended: **REST** for clarity.

Endpoints:

* List issues:
  `GET /repos/{owner}/{repo}/issues?state=all&labels=blog&per_page=100&page=N`
* Notes:

  * Issues API returns PRs too unless filtered; PRs include `pull_request` field — must exclude those.
  * Must paginate until no results.

Auth:

* Use token from env var: `GITHUB_TOKEN`
* Config:

  * `GITHUB_OWNER`
  * `GITHUB_REPO` (default `OctoType`)
  * `GITHUB_LABEL` (default `blog`)

### 4.3 Caching / Performance

* Implement caching with Next.js `fetch` caching + ISR:

  * Home list: `revalidate = 3600` (1 hour) or configurable.
  * Post fetch: also `revalidate = 3600`.
* Add a simple in-memory cache module as a fallback (optional), but rely primarily on Next’s caching.

### 4.4 Data Access Layer (DAL)

Create a small library:

* `lib/github.ts`

  * `fetchAllBlogIssues(): Promise<Issue[]>`
  * `getAllPosts(): Promise<Post[]>` (maps issues → posts; applies frontmatter; filters drafts; sorts)
  * `getPostByPermalink(y,m,d,slug): Promise<Post | null>`

### 4.5 Markdown Rendering

* Use `react-markdown` + `remark-gfm`
* Sanitize HTML:

  * Either disable raw HTML or sanitize via `rehype-sanitize`
* Code highlighting optional.

### 4.6 SEO

* `<title>` and meta description (use excerpt if available).
* OpenGraph basics for post pages.
* `robots.txt` and `sitemap.xml`:

  * Generate sitemap from posts list (server route).
* RSS feed:

  * `/feed.xml` from posts list (nice-to-have but easy).

### 4.7 Error Handling

* If GitHub token missing:

  * In dev: show clear error message.
  * In prod: return friendly “Service unavailable” message on home.
* If GitHub API rate-limited:

  * Return cached content if available; otherwise show a minimal error state.

### 4.8 Security

* Token must never be exposed to client:

  * Only server components / route handlers call GitHub API.
* Ensure no `NEXT_PUBLIC_` token usage.
* Avoid rendering untrusted HTML from markdown unless sanitized.

---

## 5) App Routes & Component Spec (Next.js App Router)

### 5.1 Routes

1. `app/page.tsx`

   * Home (year-grouped list)
2. `app/[year]/[month]/[day]/page.tsx`

   * Redirect to `/` (no error)
3. `app/[year]/[month]/[day]/[slug]/page.tsx`

   * Post page (404 if not found)
4. `app/not-found.tsx`

   * Minimal 404
5. Optional:

   * `app/sitemap.xml/route.ts`
   * `app/feed.xml/route.ts`
   * `app/robots.txt/route.ts`

### 5.2 Type Definitions

Create `types.ts`:

```ts
export type Post = {
  id: string;
  number: number;
  title: string;
  slug: string;
  publishedAt: string; // ISO
  updatedAt: string;   // ISO
  excerpt?: string;
  body: string;        // markdown without frontmatter
  url: string;         // /YYYY/MM/DD/slug
};
```

### 5.3 Matching a Permalink

To resolve a post for `/{y}/{m}/{d}/{slug}`:

* Fetch all posts (cached) and find:

  * same slug
  * same date components (publishedAt → y/m/d)
* If no match, return null → `notFound()`.

(Alternative: build a map keyed by `YYYY-MM-DD|slug` for O(1).)

---

## 6) Testing Requirements

### 6.1 Unit Tests (minimum)

* slugify function
* frontmatter parsing (present/absent, draft filtering)
* permalink matching logic

### 6.2 Integration / Smoke

* Home renders list with mocked GitHub API response.
* Post route renders markdown for a known permalink.
* Non-existent permalink returns 404.
* `/YYYY/MM/DD` redirects to `/`.

---

## 7) Configuration & Local Setup

### 7.1 Environment Variables

`.env.local`:

```
GITHUB_TOKEN=ghp_xxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=OctoType
GITHUB_LABEL=blog
REVALIDATE_SECONDS=3600
```

### 7.2 Running

* `npm install`
* `npm run dev`
* Visit `/`

---

## 8) Delivery Checklist (What “Done” Means)

* ✅ Home page grouped by year, minimal layout
* ✅ Post page renders markdown
* ✅ Correct permalink format
* ✅ 404 for unknown post permalinks
* ✅ `/YYYY/MM/DD` redirects to home
* ✅ GitHub Issues label filter implemented
* ✅ Token server-only, never shipped to client
* ✅ Basic SEO metadata + sitemap/feed (if implemented)

---

## 9) Coding-Agent Execution Plan (Context Engineering Instructions)

Use this section verbatim as the “agent prompt” if you want.

### 9.1 Agent Role & Constraints

You are implementing a Next.js App Router site. Keep the design minimalist. Do not add unrelated features. Prefer small, readable modules.

### 9.2 Steps

1. Inspect existing repo structure and Next.js version.
2. Add env var support and a config module `lib/config.ts`.
3. Implement `lib/slugify.ts`.
4. Implement `lib/frontmatter.ts` (parse YAML frontmatter safely).
5. Implement `lib/github.ts` with pagination and PR filtering.
6. Implement `lib/posts.ts` mapping issues → posts and caching.
7. Create routes: home, post, redirect day route, not-found.
8. Add markdown renderer component.
9. Add minimal styling (Tailwind or tiny CSS).
10. Add tests.
11. Ensure `npm run build` passes.

### 9.3 “Don’t Get Stuck” Rules

* If uncertain about a choice, choose the simplest path that meets PRD.
* If token missing, fail gracefully with a clear message.
* Avoid client-side fetching of GitHub.
* Avoid heavy UI libraries.

---

## 10) Notes / Defaults (Make Decisions Explicit)

* Default publish date = issue `created_at` unless frontmatter overrides.
* Default slug = slugified `title` unless frontmatter overrides.
* Only issues labeled `blog` are posts.
* Draft posts are excluded.
* `/YYYY/MM/DD` redirects to `/`.

---

If you want, I can also produce a **single “Codex-ready” prompt** that includes: repo scanning instructions, a file-by-file patch plan, and exact dependencies to install—so you can paste once and let the agent run end-to-end.
