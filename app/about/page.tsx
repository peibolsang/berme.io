import type { Metadata } from "next";
import Link from "next/link";
import { ContentIndexShell } from "../../components/ContentIndexShell";
import styles from "./page.module.css";

const description =
  "A letter from Pablo Bermejo on technology, people, and exploring agency as the software industry transitions to AI.";

export const metadata: Metadata = {
  title: "About me",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About me | Pablo Bermejo",
    description,
    url: "/about",
    type: "website",
    images: [{ url: "/og-image.png", width: 638, height: 304 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About me | Pablo Bermejo",
    description,
    images: ["/og-image.png"],
  },
};

export default function AboutPage() {
  return (
    <ContentIndexShell activeView="about">
      <article className={styles.letter} aria-label="A letter from Pablo">
        <p className={styles.greeting}>Hi, I’m Pablo.</p>

        <p>
          Fifteen years leading platform products in vertical SaaS have shaped my
          curiosity about how technology works and how it can help people work
          better.
        </p>

        <p>
          My interest in technology always takes me beyond the software itself.
          Software architecture
          leads me into organizational design, and a new AI capability sends me
          back to the economics of building products. I study the foundations,
          connect ideas, and put them to work.
        </p>

        <p>
          Writing helps me figure out what I think. Here, I{" "}
          <Link href="/?view=posts">share what I’m learning</Link>, the connections
          I’m making, and the questions I’m still working through. I hope you find
          something you can bring into your own work, challenge, or build on.
        </p>

        <p>
          If you’re facing a technological change and could use a thoughtful
          partner to work through its implications, write me on{" "}
          <a href="https://x.com/peibolsang">X</a> or{" "}
          <a href="https://www.linkedin.com/in/pablobermejo/">LinkedIn</a>
          . I’d like to hear what you’re trying to figure out.
        </p>
      </article>
    </ContentIndexShell>
  );
}
