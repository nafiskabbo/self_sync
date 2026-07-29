"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  claimReward,
  getRewardClaim,
  getSettings,
  listDailyEntries,
  updateSettings,
  upsertDailyEntry,
} from "@/lib/data";
import {
  computePoints,
  endOfIsoWeek,
  endOfMonth,
  isoWeekKey,
  monthKey,
  startOfIsoWeek,
  startOfMonth,
  sumPoints,
} from "@/lib/points";
import {
  ASR_MADHABS,
  CALCULATION_METHODS,
  PRAYERS,
  type DailyEntry,
  type NotificationPrefs,
  type PointsPerItem,
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

export type { PointsPerItem };
