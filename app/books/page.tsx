import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

// Cache the rendered page; CMS webhooks invalidate its path and data tags.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Books",
  alternates: { canonical: "/books" },
  openGraph: { title: "Books | Pablo Bermejo", url: "/books" },
};

export default function Page() {
  return <ContentIndexPage activeView="books" />;
}
