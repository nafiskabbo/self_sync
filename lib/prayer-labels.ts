import type { PrayerName } from "@/lib/types";

export function prayerDisplayName(prayer: PrayerName): string {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}
