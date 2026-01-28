"use client";

import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CalendarIcon, ChevronDownIcon, TextIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn("flex items-center gap-1 rounded-lg", className)}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

const MenubarMenu = MenubarPrimitive.Menu;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarPortal = MenubarPrimitive.Portal;
const MenubarSub = MenubarPrimitive.Sub;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const label = typeof props.children === "string" ? props.children.toLowerCase() : "";
  const trailingIcon =
    label.startsWith("title only") ? (
      <TextIcon className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
    ) : label.startsWith("date") ? (
      <CalendarIcon className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
    ) : (
      <ChevronDownIcon className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
    );

  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 outline-none data-[highlighted]:bg-zinc-100 data-[state=open]:bg-zinc-100 dark:text-zinc-400 dark:data-[highlighted]:bg-slate-800 dark:data-[state=open]:bg-slate-800",
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        <span className="leading-none">{props.children}</span>
        <span className="inline-flex h-3 w-3 items-center justify-center">
          {trailingIcon}
        </span>
      </span>
    </MenubarPrimitive.Trigger>
  );
});
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
  <MenubarPortal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[180px] rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-100",
        className,
      )}
      {...props}
    />
  </MenubarPortal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-xs text-zinc-600 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-900 dark:text-zinc-200 dark:data-[highlighted]:bg-slate-800",
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-xs text-zinc-600 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-900 dark:text-zinc-200 dark:data-[highlighted]:bg-slate-800",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3 w-3 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-amber-300" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-xs text-zinc-600 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-900 dark:text-zinc-200 dark:data-[highlighted]:bg-slate-800",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3 w-3 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-amber-300" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-zinc-200 dark:bg-slate-700", className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-xs text-zinc-600 outline-none data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-900 dark:text-zinc-200 dark:data-[highlighted]:bg-slate-800",
      className,
    )}
    {...props}
  />
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[180px] rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-100",
      className,
    )}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-[10px] uppercase tracking-[0.2em] text-zinc-400", className)}
    {...props}
  />
);
MenubarShortcut.displayName = "MenubarShortcut";

export {
  Menubar,
  MenubarMenu,
  MenubarGroup,
  MenubarPortal,
  MenubarSub,
  MenubarRadioGroup,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarShortcut,
};
