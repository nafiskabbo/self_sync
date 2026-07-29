"use client";

import {
  OBSERVE_ITEMS,
  POSITIVE_ITEMS,
  type DailyEntry,
  type EntryBoolField,
  type PointsPerItem,
} from "@/lib/types";
import { useMemo, useState } from "react";
import { PointsHero } from "@/components/points-hero";
import { useSync } from "@/components/sync-provider";
import { computePoints } from "@/lib/points";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  Check,
  Eye,
  Languages,
  Lightbulb,
  Mic2,
  Moon,
  NotebookPen,
  Sun,
} from "lucide-react";

type CheckItem = {
  field: EntryBoolField;
  label: string;
  hint?: string;
  points?: number;
  tone?: "default" | "observe" | "optional";
  icon: LucideIcon;
};

type Props = {
  date: string;
  initialEntry: DailyEntry;
  pointsPerItem: PointsPerItem;
  namazItems: CheckItem[];
  growthItems: CheckItem[];
  observeItems: CheckItem[];
  practiceItems: CheckItem[];
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
  const Icon = item.icon;
  const isObserve = item.tone === "observe";
  const pts = item.points ?? 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
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
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          checked
            ? isObserve
              ? "bg-[var(--observe)] text-white"
              : "bg-[var(--moss)] text-white"
            : "bg-[var(--paper-2)] text-[var(--moss-deep)]"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--ink)]">{item.label}</span>
        {item.hint ? (
          <span className="block text-xs text-[var(--muted)]">{item.hint}</span>
        ) : null}
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
          pts < 0
            ? "bg-[var(--observe-soft)] text-[var(--observe)]"
            : "bg-[var(--saffron-soft)]/50 text-[var(--saffron)]"
        }`}
      >
        {pts > 0 ? `+${pts}` : pts}
      </span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
          checked
            ? `animate-settle ${isObserve ? "border-[var(--observe)] bg-[var(--observe)]" : "border-[var(--moss)] bg-[var(--moss)]"} text-white`
            : "border-[var(--muted)]/40"
        }`}
        aria-hidden
      >
        {checked ? <Check size={14} strokeWidth={3} /> : null}
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
}: {
  title: string;
  items: CheckItem[];
  entry: DailyEntry;
  onToggle: (field: EntryBoolField) => void;
  footer?: React.ReactNode;
}) {
  return (
    <section className="animate-rise space-y-2.5">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
        {title}
      </h2>
      <div className="space-y-2">
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
}: Props) {
  const { getEntry, saveEntryLocal, settings } = useSync();
  const [entry, setEntry] = useState(() => getEntry(date, initialEntry));
  const [notes, setNotes] = useState(() => entry.notes ?? "");
  const [learntNote, setLearntNote] = useState(() => entry.learnt_note ?? "");

  const ptsMap = pointsPerItem ?? settings.points_per_item;

  function persist(next: DailyEntry) {
    const scored = {
      ...next,
      points_earned: computePoints(next, ptsMap),
      updated_at: new Date().toISOString(),
    };
    setEntry(scored);
    saveEntryLocal(scored);
  }

  function onToggle(field: EntryBoolField) {
    const nextValue = !entry[field];
    const next = { ...entry, [field]: nextValue };
    if (field === "new_things_learnt" && !nextValue) {
      next.learnt_note = null;
      setLearntNote("");
    }
    persist(next);
  }

  function saveLearntNote() {
    persist({ ...entry, learnt_note: learntNote.trim() || null });
  }

  function saveNotes() {
    persist({ ...entry, notes: notes.trim() || null });
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
    <div className="space-y-7">
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
      <Section
        title="Growth"
        items={growthItems}
        entry={entry}
        onToggle={onToggle}
        footer={
          <div className="mt-2 space-y-2 rounded-2xl border border-[var(--line)] bg-white/70 p-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              What did you learn?
            </label>
            <textarea
              value={learntNote}
              onChange={(e) => setLearntNote(e.target.value)}
              onBlur={saveLearntNote}
              rows={2}
              placeholder="One sentence is enough…"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--moss)]"
            />
          </div>
        }
      />
      <Section
        title="Observe"
        items={observeItems}
        entry={entry}
        onToggle={onToggle}
      />
      <Section
        title="Practice"
        items={practiceItems}
        entry={entry}
        onToggle={onToggle}
      />

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="Anything worth remembering today…"
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 outline-none focus:border-[var(--moss)]"
        />
      </section>
    </div>
  );
}

export const TRACKER_ICONS = {
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
  book: BookOpen,
} as const;
