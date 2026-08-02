import { parseDateOnly } from "@/lib/points";

/** Aug 2 */
export function formatShortDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return parseDateOnly(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Aug 2, 2026 */
export function formatLongDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return parseDateOnly(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Saturday, August 2, 2026 */
export function formatFullDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return parseDateOnly(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Aug ’26 — compact axis labels */
export function formatAxisDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return parseDateOnly(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
