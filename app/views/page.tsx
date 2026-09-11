import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

// Cache the rendered page; CMS webhooks invalidate its path and data tags.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Views",
  alternates: { canonical: "/views" },
  openGraph: { title: "Views | Pablo Bermejo", url: "/views" },
};

export default function Page() {
  return <ContentIndexPage activeView="views" />;
}
