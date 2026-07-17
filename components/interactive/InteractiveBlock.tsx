import { parseInteractiveSpec } from "@/lib/interactive/registry";
import { InteractiveRenderer } from "./registry";

type InteractiveBlockProps = {
  source: string;
};

export const InteractiveBlock = ({ source }: InteractiveBlockProps) => {
  const result = parseInteractiveSpec(source);

  if (!result.ok) {
    return (
      <aside
        className="interactive-breakout my-12 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        <p className="m-0 font-semibold">Interactive block unavailable</p>
        <p className="mb-0 mt-2">{result.error}</p>
      </aside>
    );
  }

  return <InteractiveRenderer spec={result.spec} />;
};
