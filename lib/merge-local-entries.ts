"use client";

import {
  getLocalEntry,
  listLocalEntryDates,
  mergeEntry,
} from "@/lib/local-store";
import { computePoints } from "@/lib/points";
import {
  emptyDailyEntry,
  type DailyEntry,
  type PointsPerItem,
} from "@/lib/types";

/** Merge cloud rows with localStorage so History/Rewards reflect unsynced edits. */
export function mergeEntriesWithLocal(
  serverEntries: DailyEntry[],
  from: string,
  to: string,
  pointsPerItem: PointsPerItem,
): DailyEntry[] {
  const byDate = new Map<string, DailyEntry>();

  for (const entry of serverEntries) {
    if (entry.date >= from && entry.date <= to) {
      byDate.set(entry.date, entry);
    }
  }

  for (const date of listLocalEntryDates()) {
    if (date < from || date > to) continue;
    if (!byDate.has(date)) {
      byDate.set(date, emptyDailyEntry(date));
    }
  }

  const out: DailyEntry[] = [];
  for (const [date, server] of byDate) {
    const merged = mergeEntry(server, getLocalEntry(date));
    out.push({
      ...merged,
      points_earned: computePoints(merged, pointsPerItem),
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
