"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) => (
  <DayPicker
    showOutsideDays={showOutsideDays}
    className={cn("p-2", className)}
    classNames={{
      root: "w-full",
      months: "flex flex-col gap-4",
      month: "space-y-4",
      month_caption: "flex items-center justify-between",
      caption_label:
        "text-base font-semibold text-zinc-700 dark:text-zinc-100",
      dropdowns: "flex items-center gap-2",
      dropdown:
        "rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-200",
      dropdown_root: "flex items-center gap-2",
      nav: "flex items-center gap-2",
      button_previous:
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100",
      button_next:
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100",
      chevron: "h-4 w-4",
      month_grid: "w-full border-collapse",
      weekdays: "flex",
      weekday: "w-9 text-xs font-semibold text-zinc-500 dark:text-zinc-500",
      weeks: "mt-2 flex flex-col gap-1",
      week: "flex w-full",
      day:
        "relative h-9 w-9 p-0 text-center text-sm text-zinc-600 dark:text-zinc-300",
      day_button:
        "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-slate-800",
      selected:
        "bg-rose-400 text-white hover:bg-rose-400 dark:bg-rose-400 dark:text-white dark:hover:bg-rose-400",
      today: "text-zinc-900 dark:text-zinc-100",
      outside: "text-zinc-300 dark:text-zinc-600",
      disabled: "text-zinc-300 opacity-60 dark:text-zinc-700",
      range_middle:
        "aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-zinc-100",
      hidden: "invisible",
      ...classNames,
    }}
    components={{
      Chevron: ({ className: iconClassName, orientation, ...iconProps }) => {
        const classes = cn("h-4 w-4", iconClassName);
        if (orientation === "right") {
          return <ChevronRightIcon className={classes} {...iconProps} />;
        }
        if (orientation === "up") {
          return <ChevronUpIcon className={classes} {...iconProps} />;
        }
        if (orientation === "down") {
          return <ChevronDownIcon className={classes} {...iconProps} />;
        }
        return <ChevronLeftIcon className={classes} {...iconProps} />;
      },
    }}
    {...props}
  />
);

Calendar.displayName = "Calendar";
