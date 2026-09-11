import { HomeLanding } from "../components/HomeLanding";
import type { FeaturedWriting } from "../components/FeaturedWritingStack";
import { getAllPosts } from "../lib/posts";

const landingFallback: FeaturedWriting[] = [
  {
    title: "A practical theory of software platforms",
    href: "/posts",
  },
  {
    title: "Building the AI future teams can actually adopt",
    href: "/posts",
  },
  {
    title: "The infinite product manager",
    href: "/posts",
  },
];

export default async function Home() {
  let landingPosts = landingFallback;

  try {
    const posts = await getAllPosts();
    const candidates = [
      ...posts.filter((post) => post.pinned),
      ...posts.filter((post) => !post.pinned),
    ].filter(
      (post, index, entries) =>
        entries.findIndex((entry) => entry.url === post.url) === index,
    );
    const livePosts = candidates.slice(0, 3).map((post) => ({
      title: post.title,
      href: post.url,
    }));

    landingPosts = [...livePosts, ...landingFallback]
      .filter(
        (entry, index, entries) =>
          entries.findIndex(
            (candidate) =>
              candidate.href === entry.href && candidate.title === entry.title,
          ) === index,
      )
      .slice(0, 3);
  } catch {
    // Keep the public landing page available when the remote CMS is unavailable.
  }

  return <HomeLanding featuredPosts={landingPosts} />;
}
