import { slugify } from "./slugify";

export const buildViewSlug = (title: string, number: number) => {
  const base = slugify(title);
  if (!base) {
    return String(number);
  }
  return `${base}-${number}`;
};
