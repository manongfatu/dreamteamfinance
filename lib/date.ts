export const MONTHS = [
  { index: 0, name: "January", slug: "january" },
  { index: 1, name: "February", slug: "february" },
  { index: 2, name: "March", slug: "march" },
  { index: 3, name: "April", slug: "april" },
  { index: 4, name: "May", slug: "may" },
  { index: 5, name: "June", slug: "june" },
  { index: 6, name: "July", slug: "july" },
  { index: 7, name: "August", slug: "august" },
  { index: 8, name: "September", slug: "september" },
  { index: 9, name: "October", slug: "october" },
  { index: 10, name: "November", slug: "november" },
  { index: 11, name: "December", slug: "december" },
];

export function monthSlugToIndex(slug: string): number {
  return MONTHS.find((m) => m.slug === slug)?.index ?? 0;
}

export function indexToMonthName(index: number): string {
  return MONTHS[index]?.name ?? "January";
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
