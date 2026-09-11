import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

// Cache the rendered page; CMS webhooks invalidate its path and data tags.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Writing",
  alternates: { canonical: "/posts" },
  openGraph: { title: "Writing | Pablo Bermejo", url: "/posts" },
};

export default function Page() {
  return <ContentIndexPage activeView="posts" />;
}
