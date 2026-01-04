import type { Book } from "../types";

const books: Book[] = [
  {
    title: "Building Software Platforms",
    description: "A guide to SaaS transition with AWS.",
    coverImage: "/books/software_platforms_cover.png",
    url: "https://leanpub.com/software-platforms",
    cta: "Buy",
    status: "published",
  },
];

export const getBooks = () => books;
