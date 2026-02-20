import { getGithubToken } from "../../../lib/config";

const ALLOWED_HOSTS = [
  "github.com",
  "raw.githubusercontent.com",
  "objects.githubusercontent.com",
  "githubusercontent.com",
  "user-images.githubusercontent.com",
];

const isAllowedHost = (hostname: string) =>
  ALLOWED_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url");
  if (!urlParam) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(urlParam);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return new Response("Unsupported URL protocol", { status: 400 });
  }
  if (!isAllowedHost(targetUrl.hostname)) {
    return new Response("URL host is not allowed", { status: 400 });
  }

  const headers = new Headers({
    Accept: "application/pdf,*/*",
  });

  const token = getGithubToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const upstream = await fetch(targetUrl.toString(), {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response("Unable to fetch PDF", {
      status: upstream.status,
    });
  }

  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    upstream.headers.get("content-type") || "application/pdf",
  );
  responseHeaders.set("Cache-Control", "public, max-age=300");

  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) {
    responseHeaders.set("Content-Disposition", contentDisposition);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: responseHeaders,
  });
}
