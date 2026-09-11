import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

export const metadata: Metadata = {
  title: "Books",
  alternates: { canonical: "/books" },
  openGraph: { title: "Books | Pablo Bermejo", url: "/books" },
};

export default function Page() {
  return <ContentIndexPage activeView="books" />;
}
