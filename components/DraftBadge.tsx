type DraftBadgeProps = {
  className?: string;
  prominent?: boolean;
};

export const DraftBadge = ({
  className = "",
  prominent = false,
}: DraftBadgeProps) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full border border-dashed border-amber-600/60 bg-amber-50/80 font-semibold uppercase leading-none tracking-[0.16em] text-amber-800 dark:border-amber-300/50 dark:bg-amber-300/10 dark:text-amber-200 ${
      prominent ? "px-2.5 py-1 text-[10px]" : "px-2 py-[3px] text-[9px]"
    } ${className}`}
  >
    Draft
  </span>
);
