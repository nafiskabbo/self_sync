export const COMMON_TIMEZONES = [
  "Asia/Dhaka",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Jakarta",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "UTC",
];

/** Default target zones for the clock converter */
export const DEFAULT_CONVERTER_ZONES = [
  "America/Los_Angeles",
  "Australia/Sydney",
] as const;

export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
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

/** Interpret wall-clock date+time in a timezone as a UTC Date */
export function zonedDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const [hour = "0", minute = "0"] = timeStr.split(":");
  const guessUtc = new Date(
    `${dateStr}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00Z`,
  );
  const offsetMs = getTimeZoneOffsetMs(guessUtc, timeZone);
  return new Date(guessUtc.getTime() - offsetMs);
}

export function partsInZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const hour24 = map.hour === "24" ? "00" : (map.hour ?? "00");
  return {
    year: map.year ?? "",
    month: map.month ?? "",
    day: map.day ?? "",
    weekday: map.weekday ?? "",
    hour: hour24,
    minute: map.minute ?? "00",
    second: map.second ?? "00",
    dateStr: `${map.year}-${map.month}-${map.day}`,
    timeStr: `${hour24}:${map.minute ?? "00"}`,
  };
}

export function formatZoneLabel(timeZone: string, at = new Date()): string {
  try {
    const short =
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "short",
      })
        .formatToParts(at)
        .find((p) => p.type === "timeZoneName")?.value ?? "";
    const city = timeZone.split("/").pop()?.replaceAll("_", " ") ?? timeZone;
    return short ? `${city} (${short})` : city;
  } catch {
    return timeZone;
  }
}

export function formatClockTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatClockDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatOffsetLabel(date: Date, timeZone: string): string {
  try {
    return (
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset",
      })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
}
