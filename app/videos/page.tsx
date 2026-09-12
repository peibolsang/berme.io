import type { Metadata } from "next";
import { ContentIndexPage } from "../../components/ContentIndexPage";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Videos",
  description: "Videos by Pablo Bermejo on software engineering and reliable agents.",
  alternates: { canonical: "/videos" },
  openGraph: { title: "Videos | Pablo Bermejo", url: "/videos" },
};

export default function Page() {
  return <ContentIndexPage activeView="videos" />;
}
