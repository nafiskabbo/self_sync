"use client";

import { DEFAULT_CONVERTER_ZONES } from "@/lib/timezones";
import type { DailyEntry, Settings, UpcomingEvent } from "@/lib/types";

const ENTRY_PREFIX = "selfsync:entry:";
const SETTINGS_KEY = "selfsync:settings";
const DIRTY_KEY = "selfsync:dirty";
const LAST_SYNC_KEY = "selfsync:lastSync";
const CONVERTER_ZONES_KEY = "selfsync:converterZones";
const UPCOMING_EVENTS_KEY = "selfsync:upcomingEvents";

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

export function listLocalEntryDates(): string[] {
  if (typeof window === "undefined") return [];
  const dates: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(ENTRY_PREFIX)) {
      dates.push(key.slice(ENTRY_PREFIX.length));
    }
  }
  return dates.sort();
}

export function removeLocalEntry(date: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${ENTRY_PREFIX}${date}`);
  const dirty = getDirty();
  dirty.entries = dirty.entries.filter((d) => d !== date);
  writeJson(DIRTY_KEY, dirty);
}

export function removeLocalEntries(dates: string[]) {
  for (const date of dates) {
    removeLocalEntry(date);
  }
}

export function clearAllLocalEntries() {
  removeLocalEntries(listLocalEntryDates());
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

export function getConverterZones(): string[] {
  const stored = readJson<string[]>(CONVERTER_ZONES_KEY);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.filter((z) => typeof z === "string" && z.length > 0);
  }
  return [...DEFAULT_CONVERTER_ZONES];
}

export function setConverterZones(zones: string[]) {
  writeJson(CONVERTER_ZONES_KEY, zones);
}

export function getUpcomingEvents(): UpcomingEvent[] {
  const stored = readJson<UpcomingEvent[]>(UPCOMING_EVENTS_KEY);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.clientName === "string" &&
        typeof e.date === "string" &&
        typeof e.time === "string",
    )
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

export function setUpcomingEvents(events: UpcomingEvent[]) {
  writeJson(UPCOMING_EVENTS_KEY, events);
}

export function upsertUpcomingEvent(event: UpcomingEvent) {
  const events = getUpcomingEvents().filter((e) => e.id !== event.id);
  events.push(event);
  setUpcomingEvents(events);
}

export function removeUpcomingEvent(id: string) {
  setUpcomingEvents(getUpcomingEvents().filter((e) => e.id !== id));
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
