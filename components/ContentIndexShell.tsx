import type { ReactNode } from "react";
import { ExploreNav, type ContentView } from "./ExploreNav";
import { HomeIdentity } from "./HomeLanding";
import styles from "./ContentIndexShell.module.css";

const titles: Record<ContentView, string> = {
  posts: "Writing",
  views: "Views",
  books: "Books",
  conferences: "Talks",
};

export function ContentIndexShell({
  activeView,
  children,
}: {
  activeView: ContentView;
  children: ReactNode;
}) {
  return (
    <div className={styles.page} id="content-index">
      <header className={styles.header}>
        <HomeIdentity />
      </header>

      <main className={styles.main}>
        <h1>{titles[activeView]}</h1>
        <div className={styles.content}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <ExploreNav activeView={activeView} showPrompt={false} />
      </footer>
    </div>
  );
}
