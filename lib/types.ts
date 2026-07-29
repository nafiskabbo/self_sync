export const AUTH_COOKIE = "selfsync_session";

export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];

export const POSITIVE_ITEMS = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
  "roja",
  "new_things_learnt",
  "diary_logged",
  "arabic_class",
  "public_speaking",
  "brainstorming",
] as const;

export type PositiveItem = (typeof POSITIVE_ITEMS)[number];

export const OBSERVE_ITEMS = [
  "watched_videos_eating",
  "backbite",
  "lie",
  "mistakes",
] as const;

export type ObserveItem = (typeof OBSERVE_ITEMS)[number];

export const ENTRY_BOOL_FIELDS = [
  ...POSITIVE_ITEMS,
  ...OBSERVE_ITEMS,
] as const;

export type EntryBoolField = (typeof ENTRY_BOOL_FIELDS)[number];

export const POINT_ITEMS = [...POSITIVE_ITEMS, ...OBSERVE_ITEMS] as const;
export type PointItem = (typeof POINT_ITEMS)[number];

export const ASR_MADHABS = [
  { id: "Shafi", label: "Standard (Shafi / Maliki / Hanbali)" },
  { id: "Hanafi", label: "Hanafi" },
] as const;

export type AsrMadhab = (typeof ASR_MADHABS)[number]["id"];

export const CALCULATION_METHODS = [
  { id: "MuslimWorldLeague", label: "Muslim World League" },
  { id: "Egyptian", label: "Egyptian General Authority" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "UmmAlQura", label: "Umm al-Qura University, Makkah" },
  { id: "Dubai", label: "Dubai" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { id: "NorthAmerica", label: "ISNA (North America)" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "Qatar", label: "Qatar" },
  { id: "Singapore", label: "Singapore" },
  { id: "Tehran", label: "Institute of Geophysics, Tehran" },
  { id: "Turkey", label: "Diyanet (Turkey)" },
] as const;

export type CalculationMethodId = (typeof CALCULATION_METHODS)[number]["id"];

export const NOTIFICATION_KINDS = [
  "start",
  "mid",
  "before_end_30",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Mid reminder uses calculated midpoint unless mid_time (HH:mm) is set */
export type PrayerNotificationPref = {
  start: boolean;
  mid: boolean;
  mid_time: string | null;
  before_end_30: boolean;
};

export type NotificationPrefs = Record<PrayerName, PrayerNotificationPref>;

export type PointsPerItem = Partial<Record<PointItem, number>>;

export type Settings = {
  id: boolean;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  timezone: string;
  calculation_method: string;
  asr_madhab: AsrMadhab;
  notification_prefs: NotificationPrefs;
  week_reward_text: string;
  month_reward_text: string;
  week_goal_points: number;
  month_goal_points: number;
  points_per_item: PointsPerItem;
  updated_at: string;
};

export type DailyEntry = {
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  roja: boolean;
  new_things_learnt: boolean;
  learnt_note: string | null;
  watched_videos_eating: boolean;
  backbite: boolean;
  lie: boolean;
  mistakes: boolean;
  diary_logged: boolean;
  arabic_class: boolean;
  public_speaking: boolean;
  brainstorming: boolean;
  notes: string | null;
  points_earned: number;
  created_at: string;
  updated_at: string;
};

export type RewardClaimed = {
  id: string;
  period_type: "week" | "month";
  period_key: string;
  reward_text: string;
  points_at_claim: number;
  claimed_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  fajr: { start: true, mid: true, mid_time: null, before_end_30: true },
  dhuhr: { start: true, mid: true, mid_time: null, before_end_30: true },
  asr: { start: true, mid: true, mid_time: null, before_end_30: true },
  maghrib: { start: true, mid: true, mid_time: null, before_end_30: true },
  isha: { start: true, mid: true, mid_time: null, before_end_30: true },
};

export const DEFAULT_POINTS_PER_ITEM: Record<PointItem, number> = {
  fajr: 5,
  dhuhr: 5,
  asr: 5,
  maghrib: 5,
  isha: 5,
  roja: 10,
  new_things_learnt: 10,
  diary_logged: 5,
  arabic_class: 8,
  public_speaking: 8,
  brainstorming: 5,
  watched_videos_eating: -5,
  backbite: -8,
  lie: -8,
  mistakes: -3,
};

export function emptyDailyEntry(date: string): DailyEntry {
  return {
    date,
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    roja: false,
    new_things_learnt: false,
    learnt_note: null,
    watched_videos_eating: false,
    backbite: false,
    lie: false,
    mistakes: false,
    diary_logged: false,
    arabic_class: false,
    public_speaking: false,
    brainstorming: false,
    notes: null,
    points_earned: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function normalizeNotificationPrefs(
  raw: unknown,
): NotificationPrefs {
  const base = structuredClone(DEFAULT_NOTIFICATION_PREFS);
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, Record<string, unknown>>;
  for (const prayer of PRAYERS) {
    const p = obj[prayer];
    if (!p) continue;
    base[prayer] = {
      start: Boolean(p.start ?? true),
      mid: Boolean(p.mid ?? true),
      mid_time:
        typeof p.mid_time === "string"
          ? p.mid_time
          : typeof p.custom === "string"
            ? p.custom
            : null,
      before_end_30: Boolean(p.before_end_30 ?? true),
    };
  }
  return base;
}
