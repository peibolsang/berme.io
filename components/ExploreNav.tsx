import Link from "next/link";
import styles from "./ExploreNav.module.css";

export type ContentView = "posts" | "views" | "books" | "conferences";
export type ExploreView = ContentView | "about";

const destinations: Array<{
  view: ExploreView;
  label: string;
  href: string;
}> = [
  { view: "posts", label: "Writing", href: "/posts" },
  { view: "views", label: "Views", href: "/views" },
  { view: "books", label: "Books", href: "/books" },
  { view: "conferences", label: "Talks", href: "/talks" },
  { view: "about", label: "About me", href: "/about" },
];

export function ExploreNav({
  activeView,
  showPrompt = true,
}: {
  activeView?: ExploreView;
  showPrompt?: boolean;
}) {
  return (
    <section
      className={styles.bar}
      data-prompt={showPrompt}
      aria-label="Explore Pablo's work"
    >
      {showPrompt ? <p>Start anywhere. The paths connect.</p> : null}
      <nav>
        {destinations.map((destination) => (
          <Link
            key={destination.view}
            href={destination.href}
            aria-current={activeView === destination.view ? "page" : undefined}
          >
            {destination.label} <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
