import {
  PRAYERS,
  PRAYER_MOSQUE_ITEMS,
  type DailyEntry,
  type PrayerMosqueItem,
  type PrayerName,
} from "@/lib/types";

/** none → prayed (partial) → mosque (full) → none */
export type PrayerCompletion = "none" | "done" | "mosque";

export type PrayerMosqueField = PrayerMosqueItem;

export { PRAYER_MOSQUE_ITEMS };

export function isPrayerName(value: string): value is PrayerName {
  return (PRAYERS as readonly string[]).includes(value);
}

export function mosqueFieldFor(prayer: PrayerName): PrayerMosqueField {
  return `${prayer}_mosque`;
}

export function getPrayerCompletion(
  entry: Pick<DailyEntry, PrayerName | PrayerMosqueField>,
  prayer: PrayerName,
): PrayerCompletion {
  if (entry[mosqueFieldFor(prayer)] && entry[prayer]) return "mosque";
  if (entry[prayer]) return "done";
  return "none";
}

export function cyclePrayerCompletion(
  current: PrayerCompletion,
): PrayerCompletion {
  if (current === "none") return "done";
  if (current === "done") return "mosque";
  return "none";
}

export function prayerCompletionPatch(
  prayer: PrayerName,
  state: PrayerCompletion,
): Pick<DailyEntry, PrayerName | PrayerMosqueField> {
  const mosque = mosqueFieldFor(prayer);
  if (state === "none") {
    return { [prayer]: false, [mosque]: false } as Pick<
      DailyEntry,
      PrayerName | PrayerMosqueField
    >;
  }
  if (state === "done") {
    return { [prayer]: true, [mosque]: false } as Pick<
      DailyEntry,
      PrayerName | PrayerMosqueField
    >;
  }
  return { [prayer]: true, [mosque]: true } as Pick<
    DailyEntry,
    PrayerName | PrayerMosqueField
  >;
}

/** Chart fill: none=0, prayed=0.5, mosque=1 */
export function prayerChartValue(
  entry: Pick<DailyEntry, PrayerName | PrayerMosqueField> | undefined,
  prayer: PrayerName,
): number {
  if (!entry) return 0;
  const state = getPrayerCompletion(entry, prayer);
  if (state === "mosque") return 1;
  if (state === "done") return 0.5;
  return 0;
}

export function normalizePrayerMosqueFlags<T extends DailyEntry>(entry: T): T {
  const next = { ...entry };
  for (const prayer of PRAYERS) {
    const mosque = mosqueFieldFor(prayer);
    next[mosque] = Boolean(next[prayer] && next[mosque]);
  }
  return next;
}
