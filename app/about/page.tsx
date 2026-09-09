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
          I’m curious about how technology works, and what happens to people’s
          work when it changes.
        </p>

        <p>
          I’ve spent fifteen years leading platform products in vertical SaaS.
          That experience keeps my curiosity grounded in what new technology
          makes possible for the people who have to use it.
        </p>

        <p>
          I tend to follow questions across boundaries. Software architecture
          leads me into organizational design, and a new AI capability sends me
          back to the economics of building products. I study the foundations,
          connect ideas, and put them to work.
        </p>

        <p>
          Right now, I’m exploring the sociotechnical implications of agency as
          our industry transitions to AI. I’m interested in how delegating work
          to machines changes human judgment, responsibility, and the way we
          organize ourselves.
        </p>

        <p>
          Writing helps me figure out what I think. Here, I{" "}
          <Link href="/?view=posts">share that process</Link>, including the doubts
          and connections that make it interesting. I hope you find something you
          can bring into your own work, challenge, or build on.
        </p>

        <p>
          If you’re facing a technological change and could use a thoughtful
          partner to work through its implications, write me on{" "}
          <a href="https://x.com/peibolsang">X</a> or{" "}
          <a href="https://www.linkedin.com/in/pablobermejo/">LinkedIn</a>
          . I’d like to hear what you’re trying to figure out.
        </p>

        <p className={styles.signature}>Pablo</p>
      </article>
    </ContentIndexShell>
  );
}
