import type { ReactNode } from "react";
import { ExploreNav, type ExploreView } from "./ExploreNav";
import { HomeIdentity } from "./HomeLanding";
import styles from "./ContentIndexShell.module.css";

const titles: Record<ExploreView, string> = {
  posts: "Writing",
  views: "Views",
  books: "Books",
  conferences: "Talks",
  about: "About me",
};

export function ContentIndexShell({
  activeView,
  children,
}: {
  activeView: ExploreView;
  children: ReactNode;
}) {
  return (
    <div className={styles.page} id="content-index" data-view={activeView}>
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
