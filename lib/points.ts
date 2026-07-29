import {
  DEFAULT_POINTS_PER_ITEM,
  OBSERVE_ITEMS,
  POSITIVE_ITEMS,
  type DailyEntry,
  type PointItem,
  type PointsPerItem,
} from "@/lib/types";

export function computePoints(
  entry: Pick<DailyEntry, PointItem>,
  pointsPerItem: PointsPerItem = DEFAULT_POINTS_PER_ITEM,
): number {
  let total = 0;
  for (const key of POSITIVE_ITEMS) {
    if (entry[key]) {
      const pts = pointsPerItem[key] ?? DEFAULT_POINTS_PER_ITEM[key] ?? 0;
      total += pts;
    }
  }
  for (const key of OBSERVE_ITEMS) {
    if (entry[key]) {
      const pts = pointsPerItem[key] ?? DEFAULT_POINTS_PER_ITEM[key] ?? 0;
      total += pts; // negative values reduce score
    }
  }
  return total;
}

export function isoWeekKey(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfIsoWeek(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return formatDateOnly(date);
}

export function endOfIsoWeek(dateStr: string): string {
  const start = parseDateOnly(startOfIsoWeek(dateStr));
  start.setDate(start.getDate() + 6);
  return formatDateOnly(start);
}

export function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function endOfMonth(dateStr: string): string {
  const date = parseDateOnly(`${dateStr.slice(0, 7)}-01`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return formatDateOnly(date);
}

export function allFivePrayers(entry: DailyEntry): boolean {
  return entry.fajr && entry.dhuhr && entry.asr && entry.maghrib && entry.isha;
}

export function computePrayerStreak(
  entries: DailyEntry[],
  today: string,
): number {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  let streak = 0;
  const cursor = parseDateOnly(today);

  while (true) {
    const key = formatDateOnly(cursor);
    const entry = byDate.get(key);
    if (!entry || !allFivePrayers(entry)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function sumPoints(entries: DailyEntry[]): number {
  return entries.reduce((sum, e) => sum + e.points_earned, 0);
}
