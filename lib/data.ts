import "server-only";

import { getSupabase } from "@/lib/supabase";
import {
  DEFAULT_POINTS_PER_ITEM,
  emptyDailyEntry,
  normalizeNotificationPrefs,
  type DailyEntry,
  type PointsPerItem,
  type RewardClaimed,
  type Settings,
} from "@/lib/types";

function normalizeEntry(row: DailyEntry | null, date: string): DailyEntry {
  if (!row) return emptyDailyEntry(date);
  return {
    ...emptyDailyEntry(date),
    ...row,
    learnt_note: row.learnt_note ?? null,
  };
}

function normalizeSettings(row: Settings): Settings {
  return {
    ...row,
    asr_madhab: row.asr_madhab === "Hanafi" ? "Hanafi" : "Shafi",
    notification_prefs: normalizeNotificationPrefs(row.notification_prefs),
    points_per_item: {
      ...DEFAULT_POINTS_PER_ITEM,
      ...(row.points_per_item as PointsPerItem),
    },
  };
}

export async function getSettings(): Promise<Settings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("settings")
      .insert({ id: true })
      .select("*")
      .single();
    if (insertError) throw insertError;
    return normalizeSettings(inserted as Settings);
  }

  return normalizeSettings(data as Settings);
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id" | "updated_at">>,
): Promise<Settings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeSettings(data as Settings);
}

export async function getDailyEntry(date: string): Promise<DailyEntry> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  return normalizeEntry(data as DailyEntry | null, date);
}

export async function upsertDailyEntry(
  entry: Omit<DailyEntry, "created_at" | "updated_at"> & {
    created_at?: string;
    updated_at?: string;
  },
): Promise<DailyEntry> {
  const supabase = getSupabase();
  const payload = {
    ...entry,
    updated_at: entry.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(payload, { onConflict: "date" })
    .select("*")
    .single();

  if (error) throw error;
  return normalizeEntry(data as DailyEntry, entry.date);
}

export async function listDailyEntries(
  from: string,
  to: string,
): Promise<DailyEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) =>
    normalizeEntry(row as DailyEntry, (row as DailyEntry).date),
  );
}

export async function deleteDailyEntries(dates: string[]): Promise<void> {
  if (dates.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("daily_entries")
    .delete()
    .in("date", dates);
  if (error) throw new Error(error.message || "Failed to delete entries");
}

export async function deleteAllDailyEntries(): Promise<void> {
  const supabase = getSupabase();
  const { data, error: selectError } = await supabase
    .from("daily_entries")
    .select("date");
  if (selectError) {
    throw new Error(selectError.message || "Failed to list entries");
  }
  const dates = (data ?? []).map((row) => String((row as { date: string }).date));
  if (dates.length === 0) return;

  // Batch deletes to stay within PostgREST URL / payload limits
  const chunkSize = 200;
  for (let i = 0; i < dates.length; i += chunkSize) {
    await deleteDailyEntries(dates.slice(i, i + chunkSize));
  }
}

export async function getRewardClaim(
  periodType: "week" | "month",
  periodKey: string,
): Promise<RewardClaimed | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rewards_claimed")
    .select("*")
    .eq("period_type", periodType)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (error) throw error;
  return (data as RewardClaimed) ?? null;
}

export async function claimReward(input: {
  period_type: "week" | "month";
  period_key: string;
  reward_text: string;
  points_at_claim: number;
}): Promise<RewardClaimed> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rewards_claimed")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data as RewardClaimed;
}

export async function listRewardClaims(limit = 20): Promise<RewardClaimed[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rewards_claimed")
    .select("*")
    .order("claimed_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RewardClaimed[];
}
