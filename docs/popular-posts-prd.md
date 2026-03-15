# PRD: Popular Posts Backed by Redis Reads

## Summary

Implement a Redis-backed `Popular` posts feature that promotes the most-read articles on the site.

The system should:

- count reads only for blog posts
- rank posts by lifetime reads
- surface the top posts on the homepage
- surface popularity metadata on post detail pages
- preserve counts when post permalinks change
- degrade safely when Redis is unavailable

This document reflects the current production behavior in `berme.io`, not the original first draft of the feature.

## Current Product Behavior

### Homepage

- The homepage has a `Featured` / `Popular` toggle in the posts view.
- `Featured` is editorial and comes from pinned posts.
- `Popular` is dynamic and comes from Redis read counts.
- Both lists are capped at 3 items.
- `Popular` uses the exact ranking order produced by the backend.

### Post Detail Pages

- Visiting a post page triggers a client-side call to a tracking endpoint.
- The UI does not show exact read counts.
- If the post is in the popular set, the page shows `Popular #n`.

### Development

- If `LOCAL_DEV` is truthy, page visits do not increment Redis.
- The app still reads popularity metadata, so the UI can be exercised locally without polluting production-style counts.

## Problem

Editorially featured content is hand-curated and static. It does not reflect actual reader momentum.

The site needs a lightweight popularity layer that:

- turns real readership into a ranking signal
- keeps static post rendering intact
- avoids counting homepage traffic or link prefetch as reads
- can be replicated on other sites with minimal infrastructure

## Goals

- Track reads for posts only.
- Rank posts by lifetime read count.
- Surface the top 3 popular posts on the homepage.
- Surface `Popular #n` on qualifying post pages.
- Preserve popularity when a post URL changes.
- Keep the homepage read-only with respect to popularity storage.
- Make the feature safe enough for public production use without adding heavy infrastructure.

## Non-Goals

- Unique visitor analytics
- Time-windowed ranking like “popular this week”
- Tracking views, conferences, books, or other content types
- Perfect bot protection
- Globally distributed rate limiting across many app instances
- Replacing a full analytics platform

## Primary Users

- Readers who want a quick signal of what content is resonating.
- Editors who want a dynamic complement to manually featured content.
- Developers who want a minimal popularity system that can be reused on another site.

## User Stories

- As a reader, I can switch from `Featured` to `Popular` to see the posts readers are actually visiting most.
- As a reader, when I open a post that is among the most popular, I can see its popularity rank.
- As an editor, I can change a post slug without losing accumulated popularity.
- As a developer, I can disable write-side tracking locally while still testing the UI.

## Functional Requirements

### 1. Track Reads for Posts Only

- The system must only count reads for canonical post URLs.
- A read is recorded when a reader lands on a post detail page.
- Reads must not be recorded from homepage rendering.
- Reads must not be recorded during static generation.

### 2. Homepage Popular Shelf

- The homepage must fetch the current popular posts from Redis-backed ranking data.
- The `Popular` shelf must show at most 3 posts.
- Posts with `0` reads must not appear in the popular shelf.

### 3. Post Detail Popularity Metadata

- Post detail pages must call a read-tracking endpoint after mount.
- The endpoint must return enough metadata to determine whether the post is currently popular.
- The UI must show `Popular #n` when applicable.

### 4. Preserve Popularity Across URL Changes

- If the canonical post URL changes, the old Redis member/key must be migrated to the new URL.
- Old Redis entries must be removed after migration to prevent stale ranking pollution.

### 5. Degrade Gracefully

- If Redis is unavailable, the rest of the site must continue working.
- The homepage should hide the `Popular` content instead of failing the page.
- The post page should simply omit popularity metadata if tracking or reads are unavailable.

## UX Requirements

### Homepage UX

- `Popular` and `Featured` should coexist as sibling editorial modes, not separate pages.
- The current implementation uses a toggle and not two side-by-side shelves.
- `Popular` should use the same visual theme as `Featured`.
- The popular list should preserve backend order and not reshuffle in the client.

### Post Page UX

- Popularity should feel secondary to the article itself.
- Exact read counts should not be shown in the post metadata.
- Popularity metadata should only appear if the post is actually inside the popular set.

## Technical Architecture

### Storage Model

Use Redis with two data structures:

1. Per-post counter key

```text
site:<namespace>:post:reads:<postUrl>
```

Example:

```text
site:berme.io:post:reads:/2026/01/05/the-holiday-when-software-engineering-changed-forever
```

2. Global ranking sorted set

```text
site:<namespace>:post:reads:ranking
```

- member: canonical `postUrl`
- score: integer read count

### Namespace Requirement

The popularity keys must be namespaced by a stable application name so multiple sites can share the same Redis database safely.

Example:

- `site:berme.io:post:reads:<postUrl>`
- `site:berme.io:post:reads:ranking`

The namespace should be configured through an environment variable like `POPULARITY_NAMESPACE`.

### Why URL Is the Identifier

The implemented system uses canonical post URLs, not GitHub issue numbers.

Reason:

- the read event originates from the page URL
- the homepage and UI already identify posts by URL
- popularity must follow the canonical route shown to readers

Tradeoff:

- URL changes require explicit migration logic

## Backend Components

### `lib/post-popularity.ts`

Core responsibilities:

- validate post URLs used for popularity tracking
- ensure zero-state Redis entries for known posts when needed
- increment reads for a post
- compute the current popularity snapshot for a post
- compute the current top popular posts for the homepage
- migrate popularity between old and new canonical URLs

Key exported behaviors:

- `ensurePostReadTracking(postUrl)`
- `syncPostReadTracking({ currentUrl, previousUrl })`
- `getPostPopularitySnapshot(postUrl, trackedPosts?)`
- `trackPostRead(postUrl, trackedPosts?)`
- `getPopularPosts(posts, limit?)`
- `getPopularityCatalog()`

### `lib/posts.ts`

Provides a lightweight popularity catalog:

- `number`
- `url`
- `title`
- `publishedAt`

This avoids hydrating full post bodies for the hot tracking path.

### `app/api/post-reads/route.ts`

This is the write-side tracking endpoint.

Responsibilities:

- accept JSON input with `postUrl`
- reject malformed payloads
- validate the requested URL against the cached post catalog
- apply request hardening
- increment or skip increment depending on environment/rate-limit rules
- return live popularity metadata

### `app/api/revalidate/route.ts`

Webhook-driven content revalidation must:

- detect the current canonical post URL from webhook payload content
- compare it with the cached pre-revalidation URL
- call `syncPostReadTracking()` so popularity follows the canonical URL

## Ranking Rules

The current ranking algorithm is:

1. read count descending
2. published date descending
3. title ascending
4. URL ascending

This ranking is shared by:

- homepage popular ordering
- per-post `Popular #n`

That shared canonical path is important. Without it, the homepage order and the inline rank badge can disagree on ties.

## API Contract

### Request

```http
POST /api/post-reads
Content-Type: application/json
```

Body:

```json
{
  "postUrl": "/2026/01/05/the-holiday-when-software-engineering-changed-forever"
}
```

### Success Response

```json
{
  "enabled": true,
  "tracked": true,
  "readCount": 42,
  "popularRank": 2,
  "isPopular": true
}
```

Notes:

- `tracked: false` can happen when the request is rate-limited or intentionally not counted, but a popularity snapshot is still returned.
- `popularRank` is `null` when the post is not inside the popular set.
- The current UI ignores `readCount` and only uses `isPopular` and `popularRank`.

### Disabled Response

```json
{
  "enabled": false
}
```

## Request Hardening

The current implementation includes pragmatic abuse controls.

### Same-Origin Checks

- In production, requests are only counted when they come from the same site context.
- `origin` and `referer` are checked when present.
- `sec-fetch-site` is also used as a same-site/same-origin hint.

### Bot Filtering

- Likely bots and headless agents are filtered based on `user-agent`.

### Cooldown

- Reads are throttled in-memory per `IP + postUrl`.
- Current cooldown window: 30 minutes.

Important limitation:

- This cooldown is process-local memory.
- It is not a distributed rate limiter across multiple server instances.

## Local Development Behavior

Environment flag:

```text
LOCAL_DEV=1
```

Truthy values:

- `1`
- `true`
- `yes`
- `on`

Falsy values:

- `0`
- `false`
- empty / unset

Behavior:

- when `LOCAL_DEV` is truthy, `trackPostRead()` returns a snapshot only
- Redis counters and ranking scores are not incremented

## Redis Failure Behavior

If Redis is unavailable:

- tracking endpoint returns `enabled: false`
- homepage `Popular` data resolves to an empty list
- the rest of the site still renders

Redis connection handling must not permanently poison the process after one failed connect attempt. Later requests should retry.

## Revalidation and Lifecycle

### New Post Lifecycle

When a new post becomes published:

- webhook revalidation runs
- content caches refresh
- post popularity tracking can be initialized for the canonical URL

### URL Change Lifecycle

When a canonical post URL changes:

- webhook derives `currentUrl` from the latest issue content
- cached posts still contain `previousUrl`
- `syncPostReadTracking()` merges counts onto `currentUrl`
- stale `previousUrl` counter and ranking member are removed

### Homepage Refresh

- homepage calls `getPopularPosts(posts)`
- this must be read-only
- it must not bootstrap or mutate Redis

## UI Data Contract

The post model supports optional popularity fields:

- `readCount?: number`
- `popularRank?: number | null`
- `isPopular?: boolean`

These are optional so the UI keeps working even if Redis is unavailable.

## Current Implementation Choices

### Chosen

- Redis string key per post plus a sorted set for ranking
- lifetime popularity, not a time window
- URL-based identity
- client-side post-page tracking
- homepage as read-only consumer
- rank badge on post page without raw read counts

### Explicitly Not Chosen

- unique-user/session counting
- analytics cookies
- cross-instance distributed rate limiting
- server-side counting during prerender or route render

## Acceptance Criteria

- Opening a post page increments its Redis count unless `LOCAL_DEV` is truthy.
- The homepage `Popular` shelf shows the top 3 posts with read counts greater than zero.
- Homepage order matches per-post `Popular #n` rank.
- Visiting the homepage does not write anything to Redis for popularity.
- A slug/permalink change preserves existing popularity.
- Redis outages do not break the rest of the site.
- Repeated rapid reads from the same IP for the same post do not increment indefinitely inside the cooldown window.

## Replication Checklist for Another Site

1. Add Redis and expose `REDIS_URL`.
2. Define a canonical post URL format.
3. Build a lightweight post catalog with `url`, `title`, `publishedAt`, and stable internal ID.
4. Implement the Redis helpers:
   - ensure
   - snapshot
   - increment
   - top-list query
   - URL migration
5. Add a `POST /api/post-reads` endpoint with:
   - JSON validation
   - same-origin checks
   - bot filtering
   - per-IP/per-post cooldown
6. Trigger the endpoint from the post detail page after mount.
7. Render a homepage `Popular` shelf using the ranked result.
8. Add migration logic to the content revalidation pipeline so URL changes preserve counts.
9. Add a local-development flag to disable writes.
10. Backfill initial read counts if needed through an import script.

## Optional Future Improvements

- distributed cooldown using Redis instead of in-memory state
- rolling-window popularity, such as 7-day or 30-day rankings
- editorial controls to exclude certain posts from popularity
- analytics segmentation by referrer or geography
- internal admin view for inspecting current counts and ranks
