# Content index caching

`/`, `/posts`, `/views`, `/books`, and `/talks` explicitly use `dynamic = "force-static"`. Next.js prerenders their HTML and React Server Component payloads, making them eligible for the full route cache and automatic link prefetching in production. The index routes do not read request cookies, headers, or search parameters. Legacy query URLs redirect before rendering through `proxy.ts`.

The GitHub data access layer uses tagged `unstable_cache` entries. Its existing `REVALIDATE_SECONDS` interval (3600 seconds by default) remains a fallback for missed webhook deliveries.

For publication and other content changes, the signed GitHub webhook at `/api/revalidate` expires the content data tags with `{ expire: 0 }` and invalidates the affected detail pages and all aggregate routes, including the four indexes. The response lists the invalidated paths. Opening an issue already carrying a public content label also triggers invalidation.

Invalidation is on demand: the next request regenerates the page using fresh data; the webhook does not eagerly build every page. Existing browser sessions can retain previously prefetched content until refresh or client-cache expiry.

Index generation lets CMS errors propagate so failed regeneration cannot replace a successful cached page with a rendered error message. The landing page retains its existing fallback featured links.

## Verification

Run `npm run lint` and `npm run build`. The build should list all five routes as static (`○`), with a revalidation interval inherited from their cached data. With `npm run start`, request each route and check `x-nextjs-cache: HIT` and a shared-cache `Cache-Control` policy; development mode does not demonstrate production caching. On Vercel, inspect `x-vercel-cache` instead.

To test webhook invalidation locally, send a correctly signed GitHub `issues` event to `/api/revalidate`, confirm that `/posts`, `/views`, `/books`, and `/talks` are included in the response, and request the indexes again. Never use an unsigned request or change production CMS content solely for this test.
