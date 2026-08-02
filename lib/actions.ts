"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  claimReward,
  deleteAllDailyEntries,
  deleteAllRewardClaims,
  deleteDailyEntries,
  deleteWeightLog,
  getRewardClaim,
  getSettings,
  listDailyEntries,
  listWeightLogs,
  updateSettings,
  upsertDailyEntry,
  upsertWeightLog,
} from "@/lib/data";
import {
  computePoints,
  endOfIsoWeek,
  endOfMonth,
  formatDateOnly,
  isoWeekKey,
  monthKey,
  parseDateOnly,
  startOfIsoWeek,
  startOfMonth,
  sumPoints,
} from "@/lib/points";
import {
  ASR_MADHABS,
  CALCULATION_METHODS,
  PRAYERS,
  type ClearHistoryScope,
  type DailyEntry,
  type NotificationPrefs,
  type Settings,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

const methodIdSet = new Set(CALCULATION_METHODS.map((m) => m.id));
const madhabSet = new Set(ASR_MADHABS.map((m) => m.id));

const settingsSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  location_label: z.string().nullable().optional(),
  timezone: z.string().min(1).optional(),
  calculation_method: z
    .string()
    .refine((v) => methodIdSet.has(v as never), "Invalid calculation method")
    .optional(),
  asr_madhab: z
    .string()
    .refine((v) => madhabSet.has(v as never), "Invalid asr method")
    .optional(),
  notification_prefs: z.record(z.string(), z.any()).optional(),
  week_reward_text: z.string().min(1).optional(),
  month_reward_text: z.string().min(1).optional(),
  week_goal_points: z.number().int().min(1).optional(),
  month_goal_points: z.number().int().min(1).optional(),
  points_per_item: z.record(z.string(), z.number()).optional(),
  height_cm: z.number().positive().nullable().optional(),
  target_bmi: z.number().positive().nullable().optional(),
  first_step_bmi: z.number().positive().nullable().optional(),
  blood_donated_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  blood_wait_days: z.number().int().min(1).max(365).optional(),
  daily_points_threshold: z.number().int().min(0).max(500).optional(),
  updated_at: z.string().optional(),
});

const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fajr: z.boolean(),
  dhuhr: z.boolean(),
  asr: z.boolean(),
  maghrib: z.boolean(),
  isha: z.boolean(),
  roja: z.boolean(),
  new_things_learnt: z.boolean(),
  learnt_note: z.string().nullable(),
  watched_videos_eating: z.boolean(),
  backbite: z.boolean(),
  lie: z.boolean(),
  mistakes: z.boolean(),
  diary_logged: z.boolean(),
  arabic_class: z.boolean(),
  public_speaking: z.boolean(),
  brainstorming: z.boolean(),
  notes: z.string().nullable(),
  points_earned: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

/** Bulk push local changes to Supabase — preferred over per-toggle writes */
export async function syncToCloud(payload: {
  settings?: Settings | null;
  entries?: DailyEntry[];
}): Promise<{
  settings: Settings;
  syncedDates: string[];
}> {
  await requireAuth();
  const cloudSettings = await getSettings();
  let settings = cloudSettings;

  if (payload.settings) {
    const parsed = settingsSchema.parse(payload.settings);
    if (parsed.notification_prefs) {
      const prefs = parsed.notification_prefs as NotificationPrefs;
      for (const prayer of PRAYERS) {
        if (!prefs[prayer]) continue;
        const midTime = prefs[prayer].mid_time;
        if (midTime && !/^([01]?\d|2[0-3]):([0-5]\d)$/.test(midTime)) {
          throw new Error(`Invalid mid time for ${prayer}`);
        }
      }
    }
    const { id: _id, ...rest } = payload.settings;
    void _id;
    settings = await updateSettings({
      ...rest,
      ...parsed,
    } as Partial<Omit<Settings, "id" | "updated_at">>);
  }

  const syncedDates: string[] = [];
  for (const raw of payload.entries ?? []) {
    const entry = entrySchema.parse(raw);
    const points = computePoints(entry, settings.points_per_item);
    await upsertDailyEntry({
      ...entry,
      points_earned: points,
      updated_at: entry.updated_at ?? new Date().toISOString(),
    });
    syncedDates.push(entry.date);
  }

  // Intentionally no revalidatePath — local-first UI must not refresh-loop
  return { settings, syncedDates };
}

export async function pullCloudBootstrap(dates: string[]): Promise<{
  settings: Settings;
  entries: DailyEntry[];
}> {
  await requireAuth();
  const settings = await getSettings();
  const entries: DailyEntry[] = [];
  if (dates.length) {
    const sorted = [...dates].sort();
    const list = await listDailyEntries(sorted[0], sorted[sorted.length - 1]);
    const wanted = new Set(dates);
    for (const e of list) {
      if (wanted.has(e.date)) entries.push(e);
    }
  }
  return { settings, entries };
}

export async function claimPeriodReward(
  periodType: "week" | "month",
  today: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuth();
  const settings = await getSettings();
  const periodKey =
    periodType === "week" ? isoWeekKey(today) : monthKey(today);
  const existing = await getRewardClaim(periodType, periodKey);
  if (existing) {
    return { ok: false, error: "Already claimed for this period" };
  }

  const from =
    periodType === "week" ? startOfIsoWeek(today) : startOfMonth(today);
  const to = periodType === "week" ? endOfIsoWeek(today) : endOfMonth(today);
  const entries = await listDailyEntries(from, to);
  const total = sumPoints(entries);
  const goal =
    periodType === "week"
      ? settings.week_goal_points
      : settings.month_goal_points;

  if (total < goal) {
    return {
      ok: false,
      error: `Need ${goal} points (have ${total})`,
    };
  }

  const rewardText =
    periodType === "week"
      ? settings.week_reward_text
      : settings.month_reward_text;

  await claimReward({
    period_type: periodType,
    period_key: periodKey,
    reward_text: rewardText,
    points_at_claim: total,
  });

  revalidatePath("/rewards");
  return { ok: true };
}

function datesForClearScope(
  scope: ClearHistoryScope,
  today: string,
): string[] | "all" {
  if (scope === "all") return "all";
  if (scope === "today") return [today];
  const dates: string[] = [];
  const cursor = parseDateOnly(today);
  for (let i = 0; i < 7; i += 1) {
    dates.push(formatDateOnly(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

/** Delete daily entries in cloud for the given scope. Local clear is client-side. */
export async function clearDailyHistory(
  scope: ClearHistoryScope,
  today: string,
): Promise<{ ok: true; cleared: string[] | "all" } | { ok: false; error: string }> {
  await requireAuth();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return { ok: false, error: "Invalid date" };
  }

  const target = datesForClearScope(scope, today);
  try {
    if (target === "all") {
      await deleteAllDailyEntries();
    } else {
      await deleteDailyEntries(target);
    }
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : "Clear failed";
    return { ok: false, error: message || "Clear failed" };
  }

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/rewards");
  return { ok: true, cleared: target };
}

export async function clearRewardClaims(): Promise<
  { ok: true; cleared: number } | { ok: false; error: string }
> {
  await requireAuth();
  try {
    const cleared = await deleteAllRewardClaims();
    revalidatePath("/rewards");
    return { ok: true, cleared };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to clear rewards",
    };
  }
}

const weightLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.number().positive().max(500),
  note: z.string().nullable().optional(),
});

export async function saveWeightLog(input: {
  date: string;
  weight_kg: number;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuth();
  try {
    const parsed = weightLogSchema.parse(input);
    await upsertWeightLog(parsed);
    revalidatePath("/personal");
    revalidatePath("/personal/reports");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save weight",
    };
  }
}

export async function removeWeightLog(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuth();
  if (!id) return { ok: false, error: "Missing id" };
  try {
    await deleteWeightLog(id);
    revalidatePath("/personal");
    revalidatePath("/personal/reports");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to delete weight",
    };
  }
}

export async function fetchWeightLogs(
  from?: string,
  to?: string,
): Promise<
  | { ok: true; logs: Awaited<ReturnType<typeof listWeightLogs>> }
  | { ok: false; error: string }
> {
  await requireAuth();
  try {
    const logs = await listWeightLogs(from, to);
    return { ok: true, logs };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load weights",
    };
  }
}
