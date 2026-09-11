import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

export const metadata: Metadata = {
  title: "Talks",
  alternates: { canonical: "/talks" },
  openGraph: { title: "Talks | Pablo Bermejo", url: "/talks" },
};

export default function Page() {
  return <ContentIndexPage activeView="conferences" />;
}
