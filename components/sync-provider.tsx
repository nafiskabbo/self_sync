"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  clearDailyHistory,
  syncToCloud,
} from "@/lib/actions";
import {
  clearAllLocalEntries,
  clearDirty,
  getDirty,
  getLastSync,
  getLocalEntry,
  getLocalSettings,
  isDirty,
  listLocalEntryDates,
  mergeEntry,
  mergeSettings,
  removeLocalEntries,
  setLastSync,
  setLocalEntry,
  setLocalSettings,
} from "@/lib/local-store";
import { formatDateOnly, parseDateOnly } from "@/lib/points";
import {
  emptyDailyEntry,
  type ClearHistoryScope,
  type DailyEntry,
  type Settings,
} from "@/lib/types";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

type SyncContextValue = {
  settings: Settings;
  dirty: boolean;
  syncing: boolean;
  lastSync: string | null;
  status: string | null;
  entryRevision: number;
  syncNow: () => void;
  saveEntryLocal: (entry: DailyEntry) => void;
  saveSettingsLocal: (settings: Settings) => void;
  getEntry: (date: string, serverFallback: DailyEntry) => DailyEntry;
  clearHistory: (
    scope: ClearHistoryScope,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

function initSettings(server: Settings): Settings {
  if (typeof window === "undefined") return server;
  const local = getLocalSettings();
  const merged = mergeSettings(server, local);
  if (!local) setLocalSettings(server, false);
  return merged;
}

function lastNDates(today: string, n: number): string[] {
  const dates: string[] = [];
  const cursor = parseDateOnly(today);
  for (let i = 0; i < n; i += 1) {
    dates.push(formatDateOnly(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

export function SyncProvider({
  initialSettings,
  children,
}: {
  initialSettings: Settings;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState(() => initSettings(initialSettings));
  const [dirty, setDirty] = useState(() =>
    typeof window === "undefined" ? false : isDirty(),
  );
  const [lastSync, setLastSyncState] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getLastSync(),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [entryRevision, setEntryRevision] = useState(0);
  const [syncing, startSync] = useTransition();
  const serverStampRef = useRef(initialSettings.updated_at);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Adopt newer server settings only when the stamp actually changes
  if (initialSettings.updated_at !== serverStampRef.current) {
    serverStampRef.current = initialSettings.updated_at;
    const local = getLocalSettings();
    const merged = mergeSettings(initialSettings, local);
    if (merged.updated_at !== settings.updated_at) {
      setSettings(merged);
    }
  }

  const syncNow = useCallback(() => {
    startSync(async () => {
      setStatus(null);
      try {
        const dirtyState = getDirty();
        const localSettings = dirtyState.settings
          ? (getLocalSettings() ?? settingsRef.current)
          : null;
        const entries = dirtyState.entries
          .map((d) => getLocalEntry(d))
          .filter((e): e is DailyEntry => Boolean(e));

        if (!localSettings && entries.length === 0) {
          const now = new Date().toISOString();
          setLastSync(now);
          setLastSyncState(now);
          setStatus("Already in sync");
          setDirty(false);
          return;
        }

        const result = await syncToCloud({
          settings: localSettings,
          entries,
        });
        setSettings(result.settings);
        setLocalSettings(result.settings, false);
        clearDirty({
          settings: Boolean(localSettings),
          entries: result.syncedDates,
        });
        const now = new Date().toISOString();
        setLastSync(now);
        setLastSyncState(now);
        setDirty(isDirty());
        setStatus("Synced to cloud");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Sync failed");
      }
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (isDirty()) syncNow();
    }, SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [syncNow]);

  const saveEntryLocal = useCallback((entry: DailyEntry) => {
    const next = { ...entry, updated_at: new Date().toISOString() };
    setLocalEntry(next, true);
    setDirty(true);
    setStatus("Saved locally · pending sync");
  }, []);

  const saveSettingsLocal = useCallback((next: Settings) => {
    const stamped = { ...next, updated_at: new Date().toISOString() };
    setLocalSettings(stamped, true);
    setSettings(stamped);
    setDirty(true);
    setStatus("Saved locally · pending sync");
  }, []);

  const getEntry = useCallback(
    (date: string, serverFallback: DailyEntry) => {
      const local = getLocalEntry(date);
      const merged = mergeEntry(serverFallback, local);
      if (!local) setLocalEntry(merged, false);
      return merged;
    },
    [],
  );

  const clearHistory = useCallback(
    async (scope: ClearHistoryScope) => {
      const today = (() => {
        try {
          return new Intl.DateTimeFormat("en-CA", {
            timeZone: settingsRef.current.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());
        } catch {
          return formatDateOnly(new Date());
        }
      })();

      const dates =
        scope === "all"
          ? listLocalEntryDates()
          : scope === "today"
            ? [today]
            : lastNDates(today, 7);

      if (scope === "all") {
        clearAllLocalEntries();
      } else {
        removeLocalEntries(dates);
        // Seed empty local so open trackers remount cleanly without cloud rehydrate
        for (const date of dates) {
          setLocalEntry(emptyDailyEntry(date), false);
        }
      }

      setDirty(isDirty());
      setEntryRevision((n) => n + 1);
      setStatus(
        scope === "today"
          ? "Cleared today"
          : scope === "last7"
            ? "Cleared last 7 days"
            : "Cleared all history",
      );

      const result = await clearDailyHistory(scope, today);
      if (!result.ok) {
        setStatus(result.error);
        return { ok: false as const, error: result.error };
      }
      return { ok: true as const };
    },
    [],
  );

  const value = useMemo(
    () => ({
      settings,
      dirty,
      syncing,
      lastSync,
      status,
      entryRevision,
      syncNow,
      saveEntryLocal,
      saveSettingsLocal,
      getEntry,
      clearHistory,
    }),
    [
      settings,
      dirty,
      syncing,
      lastSync,
      status,
      entryRevision,
      syncNow,
      saveEntryLocal,
      saveSettingsLocal,
      getEntry,
      clearHistory,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
