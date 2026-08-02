"use client";

import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { LineChart } from "@/components/simple-chart";
import { removeWeightLog } from "@/lib/actions";
import { bmiCategory, computeBmi, formatBmi } from "@/lib/bmi";
import { formatAxisDate, formatLongDate, formatShortDate } from "@/lib/format-date";
import type { WeightLog } from "@/lib/types";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]";

function shiftDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

type ChartMode = "weight" | "bmi";

export function WeightReportsClient({
  logs,
  heightCm,
  today,
  initialFrom,
  initialTo,
}: {
  logs: WeightLog[];
  heightCm: number | null;
  today: string;
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [chartMode, setChartMode] = useState<ChartMode>("weight");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFrom(initialFrom);
    setTo(initialTo);
  }, [initialFrom, initialTo]);

  const chartPoints = useMemo(() => {
    if (chartMode === "bmi") {
      if (!heightCm) return [];
      return logs.map((l) => ({
        label: formatAxisDate(l.date),
        title: formatLongDate(l.date),
        value: computeBmi(l.weight_kg, heightCm) ?? 0,
      }));
    }
    return logs.map((l) => ({
      label: formatAxisDate(l.date),
      title: formatLongDate(l.date),
      value: l.weight_kg,
    }));
  }, [logs, heightCm, chartMode]);

  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    const weights = logs.map((l) => l.weight_kg);
    const first = weights[0];
    const last = weights[weights.length - 1];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    const delta = last - first;
    const latestBmi = heightCm ? computeBmi(last, heightCm) : null;
    return { first, last, min, max, avg, delta, count: logs.length, latestBmi };
  }, [logs, heightCm]);

  const activePreset = useMemo(() => {
    if (to !== today) return null;
    const d7 = shiftDays(today, -6);
    const d30 = shiftDays(today, -29);
    const d90 = shiftDays(today, -89);
    if (from === d7) return 7;
    if (from === d30) return 30;
    if (from === d90) return 90;
    return null;
  }, [from, to, today]);

  function applyRange(nextFrom = from, nextTo = to) {
    router.push(`/personal/reports?from=${nextFrom}&to=${nextTo}`);
  }

  function preset(days: number) {
    const nextFrom = shiftDays(today, -(days - 1));
    setFrom(nextFrom);
    setTo(today);
    applyRange(nextFrom, today);
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeWeightLog(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const DeltaIcon =
    stats && stats.delta > 0.05
      ? ArrowUpRight
      : stats && stats.delta < -0.05
        ? ArrowDownRight
        : Minus;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/personal"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--moss)]"
        >
          <ArrowLeft size={16} />
          Personal
        </Link>
        <p className="text-xs text-[var(--muted)]">
          {formatShortDate(from)} – {formatShortDate(to)}
        </p>
      </div>

      {/* Hero summary */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--moss-deep)] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(243,240,232,0.55) 11px, rgba(243,240,232,0.55) 12px)",
          }}
        />
        <div className="relative grid gap-5 sm:grid-cols-[1.2fr_1fr] sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--saffron-soft)]">
              Range readout
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tabular-nums tracking-tight sm:text-6xl">
              {stats ? stats.last.toFixed(1) : "—"}
              <span className="ml-1.5 text-2xl text-[var(--sidebar-muted)]">
                kg
              </span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--sidebar-muted)]">
              {stats ? (
                <>
                  <DeltaIcon
                    size={16}
                    className={
                      stats.delta < -0.05
                        ? "text-[var(--saffron-soft)]"
                        : stats.delta > 0.05
                          ? "text-[#ffb4a8]"
                          : "text-[var(--sidebar-muted)]"
                    }
                  />
                  <span>
                    {stats.delta >= 0 ? "+" : ""}
                    {stats.delta.toFixed(1)} kg over {stats.count} weigh-in
                    {stats.count === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                "No logs in this window"
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <HeroStat
              label="Average"
              value={stats ? `${stats.avg.toFixed(1)}` : "—"}
              unit="kg"
            />
            <HeroStat
              label="BMI"
              value={stats?.latestBmi != null ? formatBmi(stats.latestBmi) : "—"}
              unit={
                stats?.latestBmi != null ? bmiCategory(stats.latestBmi) : ""
              }
            />
            <HeroStat
              label="Low"
              value={stats ? stats.min.toFixed(1) : "—"}
              unit="kg"
            />
            <HeroStat
              label="High"
              value={stats ? stats.max.toFixed(1) : "—"}
              unit="kg"
            />
          </div>
        </div>
      </section>

      {/* Range controls */}
      <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "7 days", days: 7 },
            { label: "30 days", days: 30 },
            { label: "90 days", days: 90 },
          ].map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => preset(p.days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activePreset === p.days
                  ? "bg-[var(--moss)] text-white"
                  : "border border-[var(--line)] bg-white/70 text-[var(--ink-soft)] hover:border-[var(--moss)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[9rem] flex-1 space-y-1 text-sm">
            <span className="text-xs text-[var(--muted)]">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={fieldClass}
            />
            <span className="block text-[11px] text-[var(--muted)]">
              {formatLongDate(from)}
            </span>
          </label>
          <label className="min-w-[9rem] flex-1 space-y-1 text-sm">
            <span className="text-xs text-[var(--muted)]">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={fieldClass}
            />
            <span className="block text-[11px] text-[var(--muted)]">
              {formatLongDate(to)}
            </span>
          </label>
          <button
            type="button"
            onClick={() => applyRange()}
            className="rounded-xl bg-[var(--moss)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--moss-bright)]"
          >
            Apply
          </button>
        </div>
      </section>

      {/* Chart */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
            Trend
          </h2>
          <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
            {(
              [
                { id: "weight", label: "Weight" },
                { id: "bmi", label: "BMI" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.id === "bmi" && !heightCm}
                onClick={() => setChartMode(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                  chartMode === opt.id
                    ? "bg-[var(--moss)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {!heightCm && chartMode === "bmi" ? (
          <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--muted)]">
            Set height on Personal to unlock BMI trends.
          </p>
        ) : (
          <LineChart
            points={chartPoints}
            height={240}
            valueSuffix={chartMode === "bmi" ? "" : "kg"}
            accent={chartMode === "bmi" ? "var(--saffron)" : "var(--moss)"}
            valueDigits={chartMode === "bmi" ? 1 : 1}
          />
        )}
      </section>

      {error ? <p className="text-sm text-[var(--observe)]">{error}</p> : null}

      {/* Timeline */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
          Weigh-in tape
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-sm text-[var(--muted)]">
            Nothing in this range. Widen the dates or log a weight on Personal.
          </p>
        ) : (
          <ol className="relative space-y-0 border-l border-[var(--line)] ml-3">
            {[...logs].reverse().map((log, idx, arr) => {
              const bmi = computeBmi(log.weight_kg, heightCm ?? 0);
              const older = arr[idx + 1];
              const delta =
                older != null ? log.weight_kg - older.weight_kg : null;
              return (
                <li key={log.id} className="relative pl-6 pb-5 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--moss)] bg-[var(--paper)]" />
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--moss-deep)]">
                        {formatLongDate(log.date)}
                      </p>
                      {log.note ? (
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {log.note}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        BMI {formatBmi(bmi)}
                        {bmi != null ? ` · ${bmiCategory(bmi)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right tabular-nums">
                        <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                          {log.weight_kg.toFixed(1)}
                          <span className="ml-0.5 text-sm text-[var(--muted)]">
                            kg
                          </span>
                        </p>
                        {delta != null && Math.abs(delta) >= 0.05 ? (
                          <p
                            className={`text-xs ${
                              delta < 0
                                ? "text-[var(--moss)]"
                                : "text-[var(--observe)]"
                            }`}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta.toFixed(1)} from prior
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        aria-label="Delete log"
                        disabled={pending}
                        onClick={() => remove(log.id)}
                        className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--observe-soft)] hover:text-[var(--observe)] disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function HeroStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--saffron-soft)]">
        {label}
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-display)] text-xl tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-sans text-[var(--sidebar-muted)]">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}
