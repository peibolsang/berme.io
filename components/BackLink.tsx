import Link from "next/link";

type BackLinkProps = {
  fallbackView?: "posts" | "views" | "books" | "conferences";
  href?: string;
  label?: string;
};

export const BackLink = ({ fallbackView, href, label = "Back" }: BackLinkProps) => {
  const backHref = href ?? (
    fallbackView === "conferences" ? "/talks" : fallbackView ? `/${fallbackView}` : "/"
  );

  return (
    <Link
      href={backHref}
      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    >
      ← {label}
    </Link>
  );
};
