"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { BarChart } from "@/components/simple-chart";
import { useSync } from "@/components/sync-provider";
import { formatAxisDate, formatLongDate } from "@/lib/format-date";
import { mergeEntriesWithLocal } from "@/lib/merge-local-entries";
import {
  endOfMonth,
  formatDateOnly,
  parseDateOnly,
  startOfMonth,
} from "@/lib/points";
import type { DailyEntry } from "@/lib/types";

type ViewMode = "calendar" | "chart";
type ChartRange = "7d" | "30d" | "month";

function monthLabel(month: string) {
  const d = parseDateOnly(`${month}-01`);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(y, m - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function shiftDays(dateStr: string, delta: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDateOnly(d);
}

export function HistoryClient({
  month,
  today,
  monthEntries,
  chartEntries,
  threshold,
  rangeFrom,
  rangeTo,
}: {
  month: string;
  today: string;
  monthEntries: DailyEntry[];
  chartEntries: DailyEntry[];
  threshold: number;
  rangeFrom: string;
  rangeTo: string;
}) {
  const { settings, entriesVersion } = useSync();
  const [view, setView] = useState<ViewMode>("calendar");
  const [range, setRange] = useState<ChartRange>("7d");
  const [localMonthEntries, setLocalMonthEntries] = useState(monthEntries);
  const [localChartEntries, setLocalChartEntries] = useState(chartEntries);

  const monthFrom = startOfMonth(`${month}-01`);
  const monthTo = endOfMonth(`${month}-01`);

  useEffect(() => {
    setLocalMonthEntries(
      mergeEntriesWithLocal(
        monthEntries,
        monthFrom,
        monthTo,
        settings.points_per_item,
      ),
    );
    setLocalChartEntries(
      mergeEntriesWithLocal(
        chartEntries,
        rangeFrom,
        rangeTo,
        settings.points_per_item,
      ),
    );
  }, [
    monthEntries,
    chartEntries,
    monthFrom,
    monthTo,
    rangeFrom,
    rangeTo,
    settings.points_per_item,
    entriesVersion,
  ]);

  const byDate = useMemo(
    () => new Map(localMonthEntries.map((e) => [e.date, e])),
    [localMonthEntries],
  );
  const chartByDate = useMemo(
    () => new Map(localChartEntries.map((e) => [e.date, e])),
    [localChartEntries],
  );

  const first = parseDateOnly(`${month}-01`);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();

  const cells: Array<{ date: string | null }> = [];
  for (let i = 0; i < startPad; i += 1) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      date: formatDateOnly(new Date(first.getFullYear(), first.getMonth(), d)),
    });
  }

  const chartPoints = useMemo(() => {
    let from: string;
    let to: string = today;
    if (range === "7d") {
      from = shiftDays(today, -6);
    } else if (range === "30d") {
      from = shiftDays(today, -29);
    } else {
      from = monthFrom;
      to = monthTo;
    }

    const points: Array<{
      label: string;
      title: string;
      value: number;
      muted?: boolean;
    }> = [];
    const cursor = parseDateOnly(from);
    const end = parseDateOnly(to);
    while (cursor <= end) {
      const key = formatDateOnly(cursor);
      const entry = chartByDate.get(key);
      const value = entry?.points_earned ?? 0;
      points.push({
        label: formatAxisDate(key),
        title: formatLongDate(key),
        value,
        muted: entry ? value < threshold : false,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }, [range, today, monthFrom, monthTo, chartByDate, threshold]);

  const punishmentCount = chartPoints.filter((p) => p.muted).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
          {(
            [
              { id: "calendar", label: "Calendar" },
              { id: "chart", label: "Chart" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setView(opt.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === opt.id
                  ? "bg-[var(--moss)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <p className="text-xs text-[var(--muted)]">
            Below {threshold}p = punishment day
          </p>
          <Link
            href="/history/reports"
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--moss)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[var(--moss-bright)]"
          >
            <BarChart3 size={14} />
            View All
          </Link>
        </div>
      </div>

      {view === "calendar" ? (
        <>
          <div className="flex items-center justify-between">
            <Link
              href={`/history?month=${shiftMonth(month, -1)}`}
              prefetch={false}
              className="rounded-md px-3 py-1 text-sm hover:bg-[var(--paper-2)]"
            >
              Prev
            </Link>
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              {monthLabel(month)}
            </h2>
            <Link
              href={`/history?month=${shiftMonth(month, 1)}`}
              prefetch={false}
              className="rounded-md px-3 py-1 text-sm hover:bg-[var(--paper-2)]"
            >
              Next
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, i) => {
              if (!cell.date) return <div key={`pad-${i}`} />;
              const entry = byDate.get(cell.date);
              const isToday = cell.date === today;
              const punishment =
                entry != null && entry.points_earned < threshold;
              return (
                <Link
                  key={cell.date}
                  href={`/history/${cell.date}`}
                  prefetch={false}
                  title={formatLongDate(cell.date)}
                  className={`aspect-square rounded-lg border p-1 text-sm transition hover:border-[var(--moss)] ${
                    isToday
                      ? "border-[var(--saffron)]"
                      : punishment
                        ? "border-[var(--observe)]/50"
                        : "border-[var(--line)]"
                  } ${
                    punishment
                      ? "bg-[var(--observe-soft)] text-[var(--observe)]"
                      : entry
                        ? "bg-[var(--moss)]/15 text-[var(--moss-deep)]"
                        : "bg-white/40 text-[var(--ink-soft)]"
                  }`}
                >
                  <span className="block text-xs">
                    {Number(cell.date.slice(8))}
                  </span>
                  {entry ? (
                    <span className="block text-[10px] tabular-nums">
                      {entry.points_earned}p
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "7d", label: "Last 7 days" },
                { id: "30d", label: "Last 30 days" },
                { id: "month", label: "This month" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  range === opt.id
                    ? "bg-[var(--moss)] text-white"
                    : "border border-[var(--line)] bg-white/70 text-[var(--ink-soft)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <BarChart
            points={chartPoints}
            height={240}
            valueSuffix="p"
            threshold={threshold}
          />
          <p className="text-sm text-[var(--muted)]">
            {punishmentCount > 0
              ? `${punishmentCount} day${punishmentCount === 1 ? "" : "s"} below the ${threshold}p threshold (marked in observe red).`
              : `No days below the ${threshold}p threshold in this range.`}
          </p>
        </div>
      )}
    </div>
  );
}
