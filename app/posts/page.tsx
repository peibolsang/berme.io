import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

export const metadata: Metadata = {
  title: "Writing",
  alternates: { canonical: "/posts" },
  openGraph: { title: "Writing | Pablo Bermejo", url: "/posts" },
};

export default function Page() {
  return <ContentIndexPage activeView="posts" />;
}
