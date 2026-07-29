"use client";

import type { DailyEntry, Settings } from "@/lib/types";

const ENTRY_PREFIX = "selfsync:entry:";
const SETTINGS_KEY = "selfsync:settings";
const DIRTY_KEY = "selfsync:dirty";
const LAST_SYNC_KEY = "selfsync:lastSync";

export type DirtyState = {
  entries: string[]; // dates
  settings: boolean;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalEntry(date: string): DailyEntry | null {
  return readJson<DailyEntry>(`${ENTRY_PREFIX}${date}`);
}

export function setLocalEntry(entry: DailyEntry, markDirty = true) {
  writeJson(`${ENTRY_PREFIX}${entry.date}`, entry);
  if (markDirty) markEntryDirty(entry.date);
}

export function getLocalSettings(): Settings | null {
  return readJson<Settings>(SETTINGS_KEY);
}

export function setLocalSettings(settings: Settings, markDirty = true) {
  writeJson(SETTINGS_KEY, settings);
  if (markDirty) {
    const dirty = getDirty();
    dirty.settings = true;
    writeJson(DIRTY_KEY, dirty);
  }
}

export function getDirty(): DirtyState {
  return readJson<DirtyState>(DIRTY_KEY) ?? { entries: [], settings: false };
}

export function markEntryDirty(date: string) {
  const dirty = getDirty();
  if (!dirty.entries.includes(date)) dirty.entries.push(date);
  writeJson(DIRTY_KEY, dirty);
}

export function clearDirty(synced: Partial<DirtyState>) {
  const dirty = getDirty();
  if (synced.settings) dirty.settings = false;
  if (synced.entries) {
    dirty.entries = dirty.entries.filter((d) => !synced.entries!.includes(d));
  }
  writeJson(DIRTY_KEY, dirty);
}

export function isDirty(): boolean {
  const d = getDirty();
  return d.settings || d.entries.length > 0;
}

export function getLastSync(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSync(iso: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

/** Prefer local if it has a newer updated_at */
export function mergeEntry(
  server: DailyEntry,
  local: DailyEntry | null,
): DailyEntry {
  if (!local) return server;
  const s = Date.parse(server.updated_at);
  const l = Date.parse(local.updated_at);
  if (Number.isNaN(l)) return server;
  if (Number.isNaN(s) || l >= s) return local;
  return server;
}

export function mergeSettings(
  server: Settings,
  local: Settings | null,
): Settings {
  if (!local) return server;
  const s = Date.parse(server.updated_at);
  const l = Date.parse(local.updated_at);
  if (Number.isNaN(l)) return server;
  if (Number.isNaN(s) || l >= s) return local;
  return server;
}
