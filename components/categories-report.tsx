"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  StackedBarChart,
  type StackedBarPoint,
  type StackedBarSegment,
} from "@/components/simple-chart";
import { useSync } from "@/components/sync-provider";
import { formatLongDate, formatShortDate } from "@/lib/format-date";
import { mergeEntriesWithLocal } from "@/lib/merge-local-entries";
import {
  formatDateOnly,
  parseDateOnly,
  startOfIsoWeek,
} from "@/lib/points";
import type { DailyEntry, EntryBoolField } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Check,
  CloudSun,
  Eye,
  Images,
  Languages,
  Lightbulb,
  MessageSquare,
  Mic2,
  Minus,
  Moon,
  MoonStar,
  NotebookPen,
  Star,
  Sun,
  Sunset,
  TrendingUp,
  XCircle,
} from "lucide-react";

type CategoryId = "namaz" | "growth" | "practice" | "observe";
type RangeKey = "30d" | "90d" | "all";
type DisplayMode = "icon" | "text";

type ItemMeta = { label: string; icon: LucideIcon; color: string };

const ITEM_META: Record<EntryBoolField, ItemMeta> = {
  fajr: { label: "Fajr", icon: Moon, color: "#9db4cc" },
  dhuhr: { label: "Dhuhr", icon: Sun, color: "#4f9a6b" },
  asr: { label: "Asr", icon: CloudSun, color: "#2f7c55" },
  maghrib: { label: "Maghrib", icon: Sunset, color: "#d9863e" },
  isha: { label: "Isha", icon: MoonStar, color: "#6b4f8a" },
  roja: { label: "Roja", icon: Star, color: "#e0b04c" },
  new_things_learnt: {
    label: "New things learnt",
    icon: Lightbulb,
    color: "#c47a2c",
  },
  diary_logged: { label: "Wrote diary", icon: NotebookPen, color: "#2f5d4a" },
  arabic_class: { label: "Arabic class", icon: Languages, color: "#2f5d4a" },
  public_speaking: { label: "Public speaking", icon: Mic2, color: "#3f7a60" },
  brainstorming: { label: "Brainstorming", icon: Brain, color: "#c47a2c" },
  watched_videos_eating: {
    label: "Videos while eating",
    icon: Eye,
    color: "#b97b6c",
  },
  backbite: { label: "Backbite", icon: MessageSquare, color: "#b05648" },
  lie: { label: "Lie", icon: AlertTriangle, color: "#964439" },
  mistakes: { label: "Mistakes", icon: XCircle, color: "#7f3327" },
};

const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  accent: string;
  items: EntryBoolField[];
}> = [
  {
    id: "namaz",
    label: "Namaz + Roza",
    icon: Moon,
    accent: "var(--moss)",
    items: ["fajr", "dhuhr", "asr", "maghrib", "isha", "roja"],
  },
  {
    id: "growth",
    label: "Growth",
    icon: TrendingUp,
    accent: "var(--saffron)",
    items: ["new_things_learnt", "diary_logged"],
  },
  {
    id: "practice",
    label: "Practice",
    icon: BookOpen,
    accent: "var(--moss)",
    items: ["arabic_class", "public_speaking", "brainstorming"],
  },
  {
    id: "observe",
    label: "Observe",
    icon: Eye,
    accent: "var(--observe)",
    items: ["watched_videos_eating", "backbite", "lie", "mistakes"],
  },
];

const RANGES: Array<{ id: RangeKey; label: string; days: number | null }> = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

const SEGMENT_ROW = 26;

function shiftDays(dateStr: string, delta: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDateOnly(d);
}

function weekdayOf(dateStr: string): string {
  return parseDateOnly(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

export function CategoriesReport({
  serverEntries,
  today,
  threshold,
}: {
  serverEntries: DailyEntry[];
  today: string;
  threshold: number;
}) {
  const { settings, entriesVersion } = useSync();
  const [category, setCategory] = useState<CategoryId>("namaz");
  const [range, setRange] = useState<RangeKey>("all");
  const [display, setDisplay] = useState<DisplayMode>("icon");

  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];

  const firstDate = useMemo(
    () => serverEntries[0]?.date ?? today,
    [serverEntries, today],
  );

  const rangeFrom = useMemo(() => {
    const selected = RANGES.find((r) => r.id === range);
    if (range === "all" || !selected?.days) return firstDate;
    return shiftDays(today, -(selected.days - 1));
  }, [range, firstDate, today]);

  const merged = useMemo(
    () => {
      void entriesVersion;
      return mergeEntriesWithLocal(
        serverEntries,
        rangeFrom,
        today,
        settings.points_per_item,
      );
    },
    [
      serverEntries,
      rangeFrom,
      today,
      settings.points_per_item,
      entriesVersion,
    ],
  );

  const mergedMap = useMemo(
    () => new Map(merged.map((e) => [e.date, e])),
    [merged],
  );

  const allDays = useMemo(() => {
    const days: string[] = [];
    const cursor = parseDateOnly(rangeFrom);
    const end = parseDateOnly(today);
    while (cursor <= end) {
      days.push(formatDateOnly(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [rangeFrom, today]);

  const chartPoints: StackedBarPoint[] = useMemo(() => {
    const perDay = allDays.map((date) => {
      const entry = mergedMap.get(date);
      return {
        date,
        counts: cat.items.map((item) => (entry?.[item] ? 1 : 0)),
      };
    });

    if (perDay.length <= 150) {
      return perDay.map((d) => ({
        label: formatShortDate(d.date),
        title: formatLongDate(d.date),
        counts: d.counts,
      }));
    }

    const buckets = new Map<string, { days: number; sums: number[] }>();
    for (const d of perDay) {
      const key = startOfIsoWeek(d.date);
      const bucket = buckets.get(key) ?? {
        days: 0,
        sums: cat.items.map(() => 0),
      };
      bucket.days += 1;
      d.counts.forEach((c, i) => {
        bucket.sums[i] += c;
      });
      buckets.set(key, bucket);
    }

    return [...buckets.entries()].map(([key, bucket]) => {
      const span = Math.min(bucket.days, 7);
      return {
        label: formatShortDate(key),
        title: `${formatShortDate(key)} – ${formatShortDate(shiftDays(key, 6))}`,
        counts: bucket.sums.map((sum) => Math.min(1, sum / span)),
      };
    });
  }, [allDays, mergedMap, cat]);

  const chartSegments: StackedBarSegment[] = useMemo(
    () =>
      cat.items.map((item) => ({
        id: item,
        label: ITEM_META[item].label,
        color: ITEM_META[item].color,
      })),
    [cat],
  );

  const records = useMemo(() => {
    const rows = allDays
      .map((date) => ({ date, entry: mergedMap.get(date) }))
      .filter(
        (row): row is { date: string; entry: DailyEntry } =>
          Boolean(row.entry && cat.items.some((i) => Boolean(row.entry![i]))),
      );
    return rows.reverse();
  }, [allDays, mergedMap, cat]);

  const itemStats = useMemo(
    () =>
      cat.items.map((item) => {
        let count = 0;
        let perfect = 0;
        for (const row of records) {
          if (row.entry[item]) count += 1;
          if (cat.items.every((i) => row.entry[i])) perfect += 1;
        }
        return {
          item,
          count,
          perfect,
          pct: allDays.length
            ? Math.round((count / allDays.length) * 100)
            : 0,
        };
      }),
    [cat, records, allDays.length],
  );

  const perfectDays =
    itemStats.length > 0
      ? Math.max(...itemStats.map((s) => s.perfect))
      : 0;

  return (
    <div className="space-y-5">
      <Link
        href="/history"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--moss)]"
      >
        ← History
      </Link>

      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          History reports
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Detailed graphs and records for every tracked habit
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1"
          role="tablist"
          aria-label="Report category"
        >
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "text-white shadow-sm"
                    : "text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
                }`}
                style={active ? { background: c.accent } : undefined}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1"
            role="group"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  range === r.id
                    ? "bg-[var(--moss)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div
            className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1"
            role="group"
            aria-label="Column display"
          >
            <button
              type="button"
              title="Icons only"
              aria-pressed={display === "icon"}
              onClick={() => setDisplay("icon")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition ${
                display === "icon"
                  ? "bg-[var(--moss)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
              }`}
            >
              <Images size={15} />
            </button>
            <button
              type="button"
              title="Icons + labels"
              aria-pressed={display === "text"}
              onClick={() => setDisplay("text")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition ${
                display === "text"
                  ? "bg-[var(--moss)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
              }`}
            >
              <Images size={15} />
              <span className="text-[10px] font-bold leading-none">Aa</span>
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {itemStats.map(({ item, count, pct }) => {
            const meta = ITEM_META[item];
            const Icon = meta.icon;
            return (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                title={meta.label}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: meta.color }}
                >
                  <Icon size={15} />
                </span>
                {display === "text" ? (
                  <span className="text-sm font-medium leading-tight">
                    {meta.label}
                  </span>
                ) : null}
                <span className="ml-auto pl-1 text-sm font-semibold tabular-nums">
                  {count}
                </span>
                <span className="text-[11px] text-[var(--muted)] tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[var(--muted)]">
          {records.length} tracked {records.length === 1 ? "day" : "days"} ·{" "}
          {perfectDays} perfect {perfectDays === 1 ? "day" : "days"} (all{" "}
          {cat.items.length} {cat.items.length === 1 ? "item" : "items"} done)
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
            Graph
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {cat.items.map((item) => {
              const meta = ITEM_META[item];
              const Icon = meta.icon;
              return (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: meta.color }}
                  />
                  <Icon size={13} style={{ color: meta.color }} />
                  {display === "text" ? <span>{meta.label}</span> : null}
                </span>
              );
            })}
          </div>
        </div>
        <StackedBarChart
          points={chartPoints}
          segments={chartSegments}
          height={38 + cat.items.length * SEGMENT_ROW}
        />
        {threshold > 0 ? (
          <p className="text-xs text-[var(--muted)]">
            Daily points below {threshold}p are punishment days — check the
            points column in Records.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
          Records
        </h2>
        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No {cat.label.toLowerCase()} records in this range yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper-2)]/60 text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="sticky left-0 bg-[var(--paper-2)]/70 px-3 py-2.5 text-left font-semibold">
                    Date
                  </th>
                  {cat.items.map((item) => {
                    const meta = ITEM_META[item];
                    const Icon = meta.icon;
                    return (
                      <th
                        key={item}
                        className="px-2 py-2.5 text-center font-semibold"
                        title={meta.label}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Icon size={15} style={{ color: meta.color }} />
                          {display === "text" ? (
                            <span className="normal-case">{meta.label}</span>
                          ) : null}
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map(({ date, entry }, idx) => (
                  <tr
                    key={date}
                    className={`border-b border-[var(--line)] transition last:border-0 hover:bg-white/70 ${
                      entry.points_earned < threshold
                        ? "bg-[var(--observe-soft)]/40"
                        : ""
                    }`}
                  >
                    <td
                      className={`sticky left-0 px-3 py-2 ${
                        entry.points_earned < threshold
                          ? "bg-[var(--observe-soft)]/70"
                          : "bg-[var(--paper)]"
                      }`}
                    >
                      <Link
                        href={`/history/${date}`}
                        prefetch={false}
                        className="flex items-center gap-2"
                        title={formatLongDate(date)}
                      >
                        <span className="font-medium text-[var(--ink)]">
                          {formatShortDate(date)}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          {weekdayOf(date)}
                        </span>
                        {date === today ? (
                          <span className="rounded-full bg-[var(--saffron)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Today
                          </span>
                        ) : null}
                        {idx === 0 ? (
                          <span className="rounded-full bg-[var(--moss)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--moss)]">
                            Latest
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    {cat.items.map((item) => {
                      const checked = Boolean(entry[item]);
                      const meta = ITEM_META[item];
                      return (
                        <td
                          key={item}
                          className="px-2 py-2 text-center"
                          title={`${meta.label}: ${checked ? "Done" : "Not done"}`}
                        >
                          {checked ? (
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-white"
                              style={{ background: meta.color }}
                            >
                              <Check size={13} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)]">
                              <Minus size={13} strokeWidth={2.2} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-soft)]">
                      {entry.points_earned}p
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}