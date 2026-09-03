import Link from "next/link";
import styles from "./ExploreNav.module.css";

export type ContentView = "posts" | "views" | "books" | "conferences";

const destinations: Array<{
  view: ContentView;
  label: string;
  href: string;
}> = [
  { view: "posts", label: "Writing", href: "/?view=posts" },
  { view: "views", label: "Views", href: "/?view=views" },
  { view: "books", label: "Books", href: "/?view=books" },
  { view: "conferences", label: "Talks", href: "/?view=conferences" },
];

export function ExploreNav({
  activeView,
  showPrompt = true,
}: {
  activeView?: ContentView;
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
