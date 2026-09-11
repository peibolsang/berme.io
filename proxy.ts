import { NextRequest, NextResponse } from "next/server";

const legacyViews = new Map([
  ["posts", "/posts"],
  ["views", "/views"],
  ["books", "/books"],
  ["conferences", "/talks"],
  ["talks", "/talks"],
  ["about", "/about"],
  ["about-me", "/about"],
]);

export function proxy(request: NextRequest) {
  const destination = legacyViews.get(request.nextUrl.searchParams.get("view") ?? "");
  if (!destination) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.searchParams.delete("view");
  return NextResponse.redirect(url, 308);
}

export const config = { matcher: "/" };
