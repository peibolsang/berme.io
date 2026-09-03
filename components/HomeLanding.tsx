import Image from "next/image";
import Link from "next/link";
import {
  FeaturedWritingStack,
  type FeaturedWriting,
} from "./FeaturedWritingStack";
import { ExploreNav } from "./ExploreNav";
import styles from "./HomeLanding.module.css";

const Mark = () => (
  <span className={styles.logoFrame} aria-hidden="true">
    <Image
      className={`${styles.logoImage} ${styles.logoLight}`}
      src="/pblogoblack.png"
      alt=""
      fill
      sizes="80px"
    />
    <Image
      className={`${styles.logoImage} ${styles.logoDark}`}
      src="/pblogo.png"
      alt=""
      fill
      sizes="80px"
    />
  </span>
);

const StudioLink = ({ className }: { className: string }) => (
  <Link className={`${styles.currentLink} ${className}`} href="/now">
    In the studio now <span aria-hidden="true">→</span>
  </Link>
);

export function HomeIdentity({ className = "" }: { className?: string }) {
  return (
    <Link
      className={`${styles.identity} ${className}`}
      href="/"
      aria-label="Pablo Bermejo, home"
    >
      <Mark />
      <span className={styles.name}>
        <span>Pablo</span>
        <span>Bermejo</span>
      </span>
    </Link>
  );
}

export function HomeLanding({ featuredPosts }: { featuredPosts: FeaturedWriting[] }) {
  return (
    <main className={styles.landing} id="landing-home">
      <header className={styles.header}>
        <HomeIdentity />
        <StudioLink className={styles.mobileCurrentLink} />
      </header>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Product leader · writer · builder</p>
          <h1>What are you curious about?</h1>
          <p className={styles.lead}>
            After fifteen years leading platform products in vertical SaaS, I
            study new technology from first principles, connect ideas, and test
            them in practice. Then I share what I learn in service of something
            greater.
          </p>
        </div>
        <div className={styles.featureColumn}>
          <StudioLink className={styles.desktopCurrentLink} />
          <FeaturedWritingStack entries={featuredPosts} />
        </div>
      </section>

      <ExploreNav />
    </main>
  );
}
