"use client";

import { Clock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSync } from "@/components/sync-provider";
import {
  getConverterZones,
  setConverterZones,
} from "@/lib/local-store";
import {
  COMMON_TIMEZONES,
  formatClockDate,
  formatClockTime,
  formatOffsetLabel,
  formatZoneLabel,
  partsInZone,
  zonedDateTimeToUtc,
} from "@/lib/timezones";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]";

export function ClockConverter() {
  const { settings } = useSync();
  const sourceZone = settings.timezone || "Asia/Dhaka";

  const [now, setNow] = useState(() => new Date());
  const [live, setLive] = useState(true);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [addZone, setAddZone] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getConverterZones();
    setZones(stored);
    const parts = partsInZone(new Date(), sourceZone);
    setDateStr(parts.dateStr);
    setTimeStr(parts.timeStr);
    setHydrated(true);
  }, [sourceZone]);

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const n = new Date();
      setNow(n);
      const parts = partsInZone(n, sourceZone);
      setDateStr(parts.dateStr);
      setTimeStr(parts.timeStr);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [live, sourceZone]);

  const instant = live
    ? now
    : zonedDateTimeToUtc(dateStr || "1970-01-01", timeStr || "00:00", sourceZone);

  function pauseAndEdit(nextDate: string, nextTime: string) {
    setLive(false);
    setDateStr(nextDate);
    setTimeStr(nextTime);
  }

  function useNow() {
    setLive(true);
    const n = new Date();
    setNow(n);
    const parts = partsInZone(n, sourceZone);
    setDateStr(parts.dateStr);
    setTimeStr(parts.timeStr);
  }

  function persistZones(next: string[]) {
    setZones(next);
    setConverterZones(next);
  }

  function removeZone(tz: string) {
    persistZones(zones.filter((z) => z !== tz));
  }

  function handleAddZone() {
    if (!addZone || zones.includes(addZone) || addZone === sourceZone) return;
    persistZones([...zones, addZone]);
    setAddZone("");
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        Loading converter…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--moss-deep)] text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Clock size={18} className="text-[var(--saffron-soft)]" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--saffron-soft)]">
                Your time
              </p>
              <p className="text-sm text-[var(--sidebar-muted)]">
                {formatZoneLabel(sourceZone, instant)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={useNow}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              live
                ? "bg-[var(--saffron)] text-white"
                : "bg-white/10 text-[var(--sidebar-text)] hover:bg-white/15"
            }`}
          >
            <RotateCcw size={13} />
            {live ? "Live now" : "Use now"}
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-end sm:px-5 sm:py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs text-[var(--sidebar-muted)]">Date</span>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => pauseAndEdit(e.target.value, timeStr)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-sm text-white outline-none focus:border-[var(--saffron-soft)] [color-scheme:dark]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[var(--sidebar-muted)]">Time</span>
              <input
                type="time"
                step={60}
                value={timeStr}
                onChange={(e) => pauseAndEdit(dateStr, e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-sm text-white outline-none focus:border-[var(--saffron-soft)] [color-scheme:dark]"
              />
            </label>
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-tight sm:text-4xl">
              {formatClockTime(instant, sourceZone)}
            </p>
            <p className="mt-0.5 text-sm text-[var(--sidebar-muted)]">
              {formatClockDate(instant, sourceZone)} ·{" "}
              {formatOffsetLabel(instant, sourceZone)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
              Client zones
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Same moment in each timezone
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {zones.map((tz) => (
            <article
              key={tz}
              className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 animate-rise"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--moss),var(--saffron))] opacity-80" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--moss-deep)]">
                    {formatZoneLabel(tz, instant)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatOffsetLabel(instant, tz)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${tz}`}
                  onClick={() => removeZone(tz)}
                  className="rounded-lg p-1.5 text-[var(--muted)] opacity-70 transition hover:bg-[var(--observe-soft)] hover:text-[var(--observe)] hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="mt-3 font-[family-name:var(--font-display)] text-3xl tabular-nums text-[var(--ink)]">
                {formatClockTime(instant, tz)}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {formatClockDate(instant, tz)}
              </p>
            </article>
          ))}
        </div>

        {zones.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--muted)]">
            No client zones yet. Add Pacific or Australia below.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 space-y-1">
            <span className="text-xs font-medium text-[var(--ink-soft)]">
              Add timezone
            </span>
            <select
              value={addZone}
              onChange={(e) => setAddZone(e.target.value)}
              className={fieldClass}
            >
              <option value="">Choose a zone…</option>
              {COMMON_TIMEZONES.filter(
                (tz) => tz !== sourceZone && !zones.includes(tz),
              ).map((tz) => (
                <option key={tz} value={tz}>
                  {formatZoneLabel(tz)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleAddZone}
            disabled={!addZone}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--moss)] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[var(--moss-bright)] disabled:opacity-50"
          >
            <Plus size={16} />
            Add zone
          </button>
        </div>
      </section>
    </div>
  );
}
