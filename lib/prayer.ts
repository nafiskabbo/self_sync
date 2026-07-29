import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import type {
  AsrMadhab,
  CalculationMethodId,
  NotificationKind,
  NotificationPrefs,
  PrayerName,
  Settings,
} from "@/lib/types";
import { PRAYERS } from "@/lib/types";

export { PRAYERS };

const METHOD_MAP: Record<
  CalculationMethodId,
  () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>
> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Kuwait: CalculationMethod.Kuwait,
  Qatar: CalculationMethod.Qatar,
  Singapore: CalculationMethod.Singapore,
  Tehran: CalculationMethod.Tehran,
  Turkey: CalculationMethod.Turkey,
};

export type PrayerWindow = {
  prayer: PrayerName;
  start: Date;
  end: Date;
};

export type ScheduledNotification = {
  prayer: PrayerName;
  kind: NotificationKind;
  at: Date;
  title: string;
  body: string;
};

function resolveParams(methodId: string, asrMadhab: AsrMadhab = "Shafi") {
  const factory =
    METHOD_MAP[methodId as CalculationMethodId] ?? CalculationMethod.Karachi;
  const params = factory();
  params.madhab = asrMadhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export function computePrayerWindows(
  date: Date,
  latitude: number,
  longitude: number,
  methodId: string,
  asrMadhab: AsrMadhab = "Shafi",
): PrayerWindow[] {
  const coords = new Coordinates(latitude, longitude);
  const params = resolveParams(methodId, asrMadhab);
  const times = new PrayerTimes(coords, date, params);
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = new PrayerTimes(coords, tomorrow, params);

  return [
    { prayer: "fajr", start: times.fajr, end: times.sunrise },
    { prayer: "dhuhr", start: times.dhuhr, end: times.asr },
    { prayer: "asr", start: times.asr, end: times.maghrib },
    { prayer: "maghrib", start: times.maghrib, end: times.isha },
    { prayer: "isha", start: times.isha, end: tomorrowTimes.fajr },
  ];
}

export function getNextPrayerHint(
  windows: PrayerWindow[],
  now = new Date(),
): { prayer: PrayerName; start: Date } | null {
  for (const w of windows) {
    if (w.start > now) {
      return { prayer: w.prayer, start: w.start };
    }
  }
  return null;
}

function prayerLabel(prayer: PrayerName): string {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}

function parseCustomTime(
  date: Date,
  custom: string,
  timeZone: string,
): Date | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(custom.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayParts = formatter.formatToParts(date);
  const y = dayParts.find((p) => p.type === "year")?.value;
  const m = dayParts.find((p) => p.type === "month")?.value;
  const d = dayParts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return null;

  const guessUtc = new Date(
    `${y}-${m}-${d}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
  );
  const offsetMs = getTimeZoneOffsetMs(guessUtc, timeZone);
  return new Date(guessUtc.getTime() - offsetMs);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "0" : map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - date.getTime();
}

export function localCalendarDate(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function buildScheduledNotifications(
  settings: Pick<
    Settings,
    | "latitude"
    | "longitude"
    | "calculation_method"
    | "asr_madhab"
    | "timezone"
    | "notification_prefs"
  >,
  day: Date = new Date(),
): ScheduledNotification[] {
  if (settings.latitude == null || settings.longitude == null) return [];

  const windows = computePrayerWindows(
    day,
    settings.latitude,
    settings.longitude,
    settings.calculation_method,
    settings.asr_madhab ?? "Shafi",
  );
  const prefs = settings.notification_prefs as NotificationPrefs;
  const out: ScheduledNotification[] = [];

  for (const w of windows) {
    const pref = prefs[w.prayer];
    if (!pref) continue;
    const label = prayerLabel(w.prayer);

    if (pref.start) {
      out.push({
        prayer: w.prayer,
        kind: "start",
        at: w.start,
        title: `${label} starts`,
        body: `It's time for ${label} prayer.`,
      });
    }

    if (pref.mid) {
      const midAt = pref.mid_time
        ? parseCustomTime(day, pref.mid_time, settings.timezone)
        : new Date((w.start.getTime() + w.end.getTime()) / 2);
      if (midAt) {
        out.push({
          prayer: w.prayer,
          kind: "mid",
          at: midAt,
          title: pref.mid_time
            ? `${label} — mid reminder`
            : `${label} — mid window`,
          body: pref.mid_time
            ? `Custom mid-time reminder for ${label}.`
            : `Halfway through the ${label} prayer window.`,
        });
      }
    }

    if (pref.before_end_30) {
      const before = new Date(w.end.getTime() - 30 * 60 * 1000);
      if (before > w.start) {
        out.push({
          prayer: w.prayer,
          kind: "before_end_30",
          at: before,
          title: `${label} ending soon`,
          body: `About 30 minutes left in the ${label} window.`,
        });
      }
    }
  }

  return out;
}

export function formatPrayerTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function prayerDisplayName(prayer: PrayerName): string {
  return prayerLabel(prayer);
}
