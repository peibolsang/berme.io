const nonAlphanumeric = /[^a-z0-9-]+/g;
const multipleDashes = /-{2,}/g;

export const slugify = (input: string) => {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(nonAlphanumeric, "-")
    .replace(multipleDashes, "-")
    .replace(/^-+|-+$/g, "");
};
