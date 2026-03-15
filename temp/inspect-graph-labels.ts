import { getConferences } from "../lib/conferences";
import { getAllPosts } from "../lib/posts";

const ignored = new Set(["published", "conference", "now"]);
const normalize = (value: string) => value.trim().toLowerCase();

const main = async () => {
  const [posts, conferences] = await Promise.all([getAllPosts(), getConferences()]);
  const items = [...posts, ...conferences];
  const counts = new Map<string, number>();
  const variants = new Map<string, string[]>();

  for (const item of items) {
    for (const raw of item.labels ?? []) {
      const label = normalize(String(raw ?? ""));
      if (!label || ignored.has(label)) {
        continue;
      }
      counts.set(label, (counts.get(label) ?? 0) + 1);
      if (
        label.includes("front") ||
        label.includes("cloud") ||
        label.includes("serverless")
      ) {
        if (!variants.has(label)) {
          variants.set(label, []);
        }
        variants.get(label)?.push(item.title);
      }
    }
  }

  console.log(
    "counts",
    ["frontend", "front-end", "cloud", "cloud-native", "serverless", "serverless-first"].map(
      (key) => [key, counts.get(key) ?? 0],
    ),
  );
  console.log("variants");
  for (const [label, titles] of [...variants.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log("---", label, counts.get(label) ?? 0);
    for (const title of titles.slice(0, 12)) {
      console.log("  ", title);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
