import { createHash } from "crypto";
import {
  getPopularityCatalog,
  getPostPopularitySnapshot,
  trackPostRead,
} from "../../../lib/post-popularity";

type RequestPayload = {
  postUrl?: string;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const READ_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_COOLDOWN_ENTRIES = 5000;
const readCooldowns = new Map<string, number>();

const buildJsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });

const isLikelyBot = (userAgent: string) =>
  /bot|crawler|spider|preview|facebookexternalhit|slurp|curl|wget|python|node-fetch|headless|lighthouse|render/i.test(
    userAgent,
  );

const hasSameOrigin = (value: string | null, expectedOrigin: string) => {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).origin === expectedOrigin;
  } catch {
    return false;
  }
};

const extractClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "";
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    ""
  ).trim();
};

const cleanupReadCooldowns = (now: number) => {
  if (readCooldowns.size < MAX_COOLDOWN_ENTRIES) {
    return;
  }

  for (const [key, expiresAt] of readCooldowns.entries()) {
    if (expiresAt <= now) {
      readCooldowns.delete(key);
    }
  }
};

const consumeReadCooldown = (clientIp: string, postUrl: string) => {
  if (!clientIp) {
    return false;
  }

  const now = Date.now();
  cleanupReadCooldowns(now);

  const cooldownKey = createHash("sha256")
    .update(`${clientIp}:${postUrl}`)
    .digest("hex");
  const expiresAt = readCooldowns.get(cooldownKey) ?? 0;

  if (expiresAt > now) {
    return true;
  }

  readCooldowns.set(cooldownKey, now + READ_COOLDOWN_MS);
  return false;
};

const shouldTrackRead = (request: Request, postUrl: string) => {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isLikelyBot(userAgent)) {
    return false;
  }

  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");
  const hasTrustedOrigin =
    hasSameOrigin(origin, expectedOrigin) || hasSameOrigin(referer, expectedOrigin);

  if (
    !hasTrustedOrigin &&
    fetchSite !== "same-origin" &&
    fetchSite !== "same-site" &&
    process.env.NODE_ENV === "production"
  ) {
    return false;
  }

  return !consumeReadCooldown(extractClientIp(request), postUrl);
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return buildJsonResponse({ error: "Content-Type must be application/json" }, 415);
  }

  let payload: RequestPayload;

  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return buildJsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const postUrl = String(payload.postUrl ?? "").trim();
  if (
    !postUrl.startsWith("/") ||
    postUrl.length > 256 ||
    postUrl.includes("?") ||
    postUrl.includes("#")
  ) {
    return buildJsonResponse({ error: "Invalid post URL" }, 400);
  }

  const catalog = await getPopularityCatalog();
  if (!catalog.byUrl[postUrl]) {
    return buildJsonResponse({ error: "Post not found" }, 404);
  }

  const shouldIncrement = shouldTrackRead(request, postUrl);
  const popularity = shouldIncrement
    ? await trackPostRead(postUrl, catalog.posts)
    : await getPostPopularitySnapshot(postUrl, catalog.posts);

  if (!popularity) {
    return buildJsonResponse({ enabled: false });
  }

  return buildJsonResponse({
    enabled: true,
    tracked: shouldIncrement,
    ...popularity,
  });
}
