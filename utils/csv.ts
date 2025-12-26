import type { Entry } from "@domain/finance";
import { indexToMonthName } from "@lib/date";

function toCsvValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function entriesToCsv(entries: Entry[]): string {
  const header = ["Title", "Amount", "Type", "Category", "Date", "Notes"];
  const rows = entries.map((e) => [e.title, e.amount, e.entryType, e.category, new Date(e.date).toISOString(), e.notes ?? ""]);
  const lines = [header, ...rows].map((cols) => cols.map(toCsvValue).join(","));
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

export function exportMonthCsv(monthIndex: number, entries: Entry[]) {
  const csv = entriesToCsv(entries);
  const monthName = indexToMonthName(monthIndex);
  downloadCsv(`finance_${monthName}.csv`, csv);
}

export function exportYearCsv(year: number, entries: Entry[]) {
  const csv = entriesToCsv(entries);
  downloadCsv(`finance_${year}.csv`, csv);
}
