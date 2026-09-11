import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

export const metadata: Metadata = {
  title: "Views",
  alternates: { canonical: "/views" },
  openGraph: { title: "Views | Pablo Bermejo", url: "/views" },
};

export default function Page() {
  return <ContentIndexPage activeView="views" />;
}
