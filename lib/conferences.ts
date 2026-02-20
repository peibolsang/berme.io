import type { Conference } from "../types";

const conferences: Conference[] = [
  {
    id: "constraint-oriented-architectures-universidad-de-oviedo-20260218",
    slug: "constraint-oriented-architectures",
    title: "Constraint-Oriented Architectures",
    event: "Universidad de Oviedo",
    date: "2026-02-18",
    summary:
      "A talk on designing software systems around explicit constraints to improve architectural clarity, decision-making, and delivery outcomes in complex environments.",
    pdfPath:
      "/conferences/[Constraint-Oriented Architectures][Universidad de Oviedo][20260218].pdf",
    pageCount: 38,
    contentDensity: "medium",
  },
];

const toTimestamp = (dateIso: string) => {
  const value = new Date(dateIso).getTime();
  return Number.isNaN(value) ? null : value;
};

const withValidDates = (entries: Conference[]) =>
  entries.filter((entry) => toTimestamp(entry.date) !== null);

export const getConferences = () => {
  const valid = withValidDates(conferences);
  return [...valid].sort((left, right) => {
    const leftDate = toTimestamp(left.date) ?? 0;
    const rightDate = toTimestamp(right.date) ?? 0;
    return rightDate - leftDate;
  });
};

export const getConferenceBySlug = (slug: string): Conference | null =>
  getConferences().find((entry) => entry.slug === slug) ?? null;

export const getConferenceYearsGrouped = () => {
  const grouped = new Map<string, Conference[]>();
  getConferences().forEach((entry) => {
    const year = String(new Date(entry.date).getUTCFullYear());
    const bucket = grouped.get(year) ?? [];
    bucket.push(entry);
    grouped.set(year, bucket);
  });

  return Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([year, items]) => ({
      year,
      items,
    }));
};
