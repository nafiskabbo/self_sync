"use client";

import {
  OBSERVE_ITEMS,
  POSITIVE_ITEMS,
  type DailyEntry,
  type EntryBoolField,
  type PointsPerItem,
} from "@/lib/types";
import { useEffect, useMemo, useState, useTransition } from "react";
import { PointsHero } from "@/components/points-hero";
import { useSync } from "@/components/sync-provider";
import { computePoints } from "@/lib/points";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  Check,
  CloudUpload,
  Eye,
  Languages,
  Lightbulb,
  Mic2,
  Moon,
  NotebookPen,
  Save,
  Sun,
} from "lucide-react";

type CheckItem = {
  field: EntryBoolField;
  label: string;
  hint?: string;
  points?: number;
  tone?: "default" | "observe" | "optional";
};

type Props = {
  date: string;
  initialEntry: DailyEntry;
  pointsPerItem: PointsPerItem;
  namazItems: CheckItem[];
  growthItems: CheckItem[];
  observeItems: CheckItem[];
  practiceItems: CheckItem[];
  /** Show explicit Save (local + cloud sync) — used on history day pages */
  showSaveButton?: boolean;
};

const TRACKER_ICONS: Record<EntryBoolField, LucideIcon> = {
  fajr: Moon,
  dhuhr: Sun,
  asr: Sun,
  maghrib: Moon,
  isha: Moon,
  roja: Moon,
  new_things_learnt: Lightbulb,
  diary_logged: NotebookPen,
  watched_videos_eating: Eye,
  backbite: Eye,
  lie: Eye,
  mistakes: Eye,
  arabic_class: Languages,
  public_speaking: Mic2,
  brainstorming: Brain,
};

function CheckRow({
  item,
  checked,
  onToggle,
}: {
  item: CheckItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = TRACKER_ICONS[item.field] ?? BookOpen;
  const isObserve = item.tone === "observe";
  const pts = item.points ?? 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition sm:gap-3 sm:px-3 ${
        checked
          ? isObserve
            ? "border-[var(--observe)]/30 bg-[var(--observe-soft)]"
            : "border-[var(--moss)]/25 bg-[color-mix(in_oklab,var(--moss)_10%,white)]"
          : item.tone === "optional"
            ? "border-dashed border-[var(--saffron)]/45 bg-[var(--surface)]"
            : "border-[var(--line)] bg-[var(--surface)] hover:bg-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${
          checked
            ? isObserve
              ? "bg-[var(--observe)] text-white"
              : "bg-[var(--moss)] text-white"
            : "bg-[var(--paper-2)] text-[var(--moss-deep)]"
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight text-[var(--ink)] sm:text-[15px]">
          {item.label}
        </span>
        {item.hint ? (
          <span className="block text-[11px] leading-tight text-[var(--muted)]">
            {item.hint}
          </span>
        ) : null}
      </span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums sm:px-2 sm:text-xs ${
          pts < 0
            ? "bg-[var(--observe-soft)] text-[var(--observe)]"
            : "bg-[var(--saffron-soft)]/50 text-[var(--saffron)]"
        }`}
      >
        {pts > 0 ? `+${pts}` : pts}
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 sm:h-7 sm:w-7 sm:rounded-lg ${
          checked
            ? `animate-settle ${isObserve ? "border-[var(--observe)] bg-[var(--observe)]" : "border-[var(--moss)] bg-[var(--moss)]"} text-white`
            : "border-[var(--muted)]/40"
        }`}
        aria-hidden
      >
        {checked ? <Check size={12} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

function Section({
  title,
  items,
  entry,
  onToggle,
  footer,
  className = "",
}: {
  title: string;
  items: CheckItem[];
  entry: DailyEntry;
  onToggle: (field: EntryBoolField) => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`animate-rise space-y-1.5 ${className}`}>
      <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
        {title}
      </h2>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.field}>
            <CheckRow
              item={item}
              checked={Boolean(entry[item.field])}
              onToggle={() => onToggle(item.field)}
            />
            {footer && item.field === "new_things_learnt" && entry.new_things_learnt
              ? footer
              : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DailyTracker({
  date,
  initialEntry,
  pointsPerItem,
  namazItems,
  growthItems,
  observeItems,
  practiceItems,
  showSaveButton = false,
}: Props) {
  const { getEntry, saveEntryLocal, settings, entryRevision, syncNow, syncing } =
    useSync();
  const [entry, setEntry] = useState(() => getEntry(date, initialEntry));
  const [notes, setNotes] = useState(() => entry.notes ?? "");
  const [learntNote, setLearntNote] = useState(() => entry.learnt_note ?? "");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pendingSave, startSave] = useTransition();

  // Rehydrate only when the date changes or history was cleared — not on every toggle save
  useEffect(() => {
    const next = getEntry(date, initialEntry);
    setEntry(next);
    setNotes(next.notes ?? "");
    setLearntNote(next.learnt_note ?? "");
    setSaveMsg(null);
  }, [date, entryRevision, getEntry, initialEntry]);

  const ptsMap = pointsPerItem ?? settings.points_per_item;

  function buildEntry(patch: Partial<DailyEntry> = {}): DailyEntry {
    return {
      ...entry,
      notes: notes.trim() || null,
      learnt_note: learntNote.trim() || null,
      ...patch,
      points_earned: 0,
      updated_at: new Date().toISOString(),
    };
  }

  function persist(patch: Partial<DailyEntry> = {}) {
    const next = buildEntry(patch);
    const scored = {
      ...next,
      points_earned: computePoints(next, ptsMap),
    };
    setEntry(scored);
    saveEntryLocal(scored);
    return scored;
  }

  function onToggle(field: EntryBoolField) {
    const nextValue = !entry[field];
    const patch: Partial<DailyEntry> = { [field]: nextValue };
    if (field === "new_things_learnt" && !nextValue) {
      patch.learnt_note = null;
      setLearntNote("");
    }
    persist(patch);
    if (showSaveButton) {
      setSaveMsg("Saved on this device · tap Save to sync");
    }
  }

  function saveLearntNote() {
    persist({ learnt_note: learntNote.trim() || null });
  }

  function saveNotes() {
    persist({ notes: notes.trim() || null });
  }

  function saveAndSync() {
    setSaveMsg(null);
    startSave(async () => {
      persist();
      try {
        await syncNow();
        setSaveMsg("Saved and synced to cloud");
      } catch {
        setSaveMsg("Saved locally · sync failed — try Sync in the sidebar");
      }
    });
  }

  const positiveCount = useMemo(
    () => POSITIVE_ITEMS.filter((k) => entry[k]).length,
    [entry],
  );
  const observeCount = useMemo(
    () => OBSERVE_ITEMS.filter((k) => entry[k]).length,
    [entry],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {showSaveButton ? (
        <div className="sticky top-[3.25rem] z-30 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_92%,transparent)] px-3 py-2 shadow-sm backdrop-blur-md lg:top-3">
          <p className="text-xs text-[var(--muted)] sm:text-sm">
            {saveMsg ?? "Edits save on this device. Use Save to sync to the cloud."}
          </p>
          <button
            type="button"
            disabled={pendingSave || syncing}
            onClick={saveAndSync}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--moss)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--moss-bright)] disabled:opacity-60"
          >
            {pendingSave || syncing ? (
              <CloudUpload size={16} className="animate-pulse" />
            ) : (
              <Save size={16} />
            )}
            {pendingSave || syncing ? "Saving…" : "Save"}
          </button>
        </div>
      ) : null}

      <PointsHero
        points={entry.points_earned}
        positiveCount={positiveCount}
        observeCount={observeCount}
      />

      <Section
        title="Namaz"
        items={namazItems}
        entry={entry}
        onToggle={onToggle}
      />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Section
          title="Growth"
          items={growthItems}
          entry={entry}
          onToggle={onToggle}
          footer={
            <div className="mt-1.5 space-y-1.5 rounded-xl border border-[var(--line)] bg-white/70 p-2.5">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                What did you learn?
              </label>
              <textarea
                value={learntNote}
                onChange={(e) => setLearntNote(e.target.value)}
                onBlur={saveLearntNote}
                rows={2}
                placeholder="One sentence is enough…"
                className="w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]"
              />
            </div>
          }
        />
        <Section
          title="Practice"
          items={practiceItems}
          entry={entry}
          onToggle={onToggle}
        />
      </div>

      <Section
        title="Observe"
        items={observeItems}
        entry={entry}
        onToggle={onToggle}
      />

      <section className="space-y-1.5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
          Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={2}
          placeholder="Anything worth remembering today…"
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--moss)]"
        />
      </section>

      {showSaveButton ? (
        <button
          type="button"
          disabled={pendingSave || syncing}
          onClick={saveAndSync}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--moss)] px-3.5 py-2.5 text-sm font-medium text-white hover:bg-[var(--moss-bright)] disabled:opacity-60 sm:w-auto"
        >
          <Save size={16} />
          {pendingSave || syncing ? "Saving…" : "Save day"}
        </button>
      ) : null}
    </div>
  );
}
