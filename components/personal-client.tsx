"use client";

import {
  Droplets,
  LineChart as LineChartIcon,
  Plus,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { LineChart } from "@/components/simple-chart";
import { useSync } from "@/components/sync-provider";
import { saveWeightLog } from "@/lib/actions";
import {
  bloodEligibility,
  bmiCategory,
  computeBmi,
  formatBmi,
  weightForBmi,
} from "@/lib/bmi";
import { formatAxisDate, formatLongDate, formatShortDate } from "@/lib/format-date";
import { localCalendarDate } from "@/lib/prayer";
import type { Settings, WeightLog } from "@/lib/types";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]";

export function PersonalClient({
  recentLogs,
  latestWeight,
}: {
  recentLogs: WeightLog[];
  latestWeight: WeightLog | null;
}) {
  const router = useRouter();
  const { settings, saveSettingsLocal, syncNow } = useSync();
  const [draft, setDraft] = useState({
    height_cm: settings.height_cm?.toString() ?? "",
    target_bmi: settings.target_bmi?.toString() ?? "",
    first_step_bmi: settings.first_step_bmi?.toString() ?? "",
    blood_donated_at: settings.blood_donated_at ?? "",
    blood_wait_days: settings.blood_wait_days?.toString() ?? "90",
  });
  const [stamp, setStamp] = useState(settings.updated_at);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  if (settings.updated_at !== stamp) {
    setStamp(settings.updated_at);
    setDraft({
      height_cm: settings.height_cm?.toString() ?? "",
      target_bmi: settings.target_bmi?.toString() ?? "",
      first_step_bmi: settings.first_step_bmi?.toString() ?? "",
      blood_donated_at: settings.blood_donated_at ?? "",
      blood_wait_days: settings.blood_wait_days?.toString() ?? "90",
    });
  }

  const heightCm = Number(draft.height_cm) || null;
  const currentWeight = latestWeight?.weight_kg ?? null;
  const currentBmi = computeBmi(currentWeight ?? 0, heightCm ?? 0);
  const targetBmi = Number(draft.target_bmi) || null;
  const firstStepBmi = Number(draft.first_step_bmi) || null;
  const targetWeight = weightForBmi(targetBmi ?? 0, heightCm ?? 0);
  const firstStepWeight = weightForBmi(firstStepBmi ?? 0, heightCm ?? 0);

  const today = localCalendarDate(settings.timezone);
  const blood = bloodEligibility(
    draft.blood_donated_at || null,
    Number(draft.blood_wait_days) || 90,
  );

  const sparkPoints = useMemo(
    () =>
      [...recentLogs]
        .reverse()
        .map((l) => ({
          label: formatAxisDate(l.date),
          title: formatLongDate(l.date),
          value: l.weight_kg,
        })),
    [recentLogs],
  );

  function saveProfile() {
    setMessage(null);
    setError(null);
    const height = draft.height_cm.trim() ? Number(draft.height_cm) : null;
    const target = draft.target_bmi.trim() ? Number(draft.target_bmi) : null;
    const first = draft.first_step_bmi.trim() ? Number(draft.first_step_bmi) : null;
    const wait = Number(draft.blood_wait_days) || 90;

    if (height != null && (!(height > 0) || height > 300)) {
      setError("Height must be a positive number in cm.");
      return;
    }
    if (target != null && (!(target > 0) || target > 60)) {
      setError("Projected BMI looks invalid.");
      return;
    }
    if (first != null && (!(first > 0) || first > 60)) {
      setError("First-step BMI looks invalid.");
      return;
    }

    const next: Settings = {
      ...settings,
      height_cm: height,
      target_bmi: target,
      first_step_bmi: first,
      blood_donated_at: draft.blood_donated_at.trim() || null,
      blood_wait_days: wait,
    };
    saveSettingsLocal(next);
    void syncNow();
    setMessage("Saved · syncing to cloud");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {message ? (
          <p className="mr-auto text-sm text-[var(--moss)]">{message}</p>
        ) : null}
        {error ? (
          <p className="mr-auto text-sm text-[var(--observe)]">{error}</p>
        ) : null}
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--saffron)] px-3.5 py-2 text-sm font-medium text-white hover:brightness-105"
        >
          <Plus size={16} />
          Record weight
        </button>
        <button
          type="button"
          onClick={saveProfile}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--moss)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--moss-bright)]"
        >
          <Save size={16} />
          Save
        </button>
      </div>

      {/* Hero: the scale reading */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--moss-deep)] px-5 py-6 text-white sm:px-7 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(243,240,232,0.55) 11px, rgba(243,240,232,0.55) 12px)",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--saffron-soft)]">
              On the scale
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tabular-nums tracking-tight sm:text-6xl">
              {currentWeight != null ? currentWeight.toFixed(1) : "—"}
              <span className="ml-1.5 text-2xl text-[var(--sidebar-muted)]">
                kg
              </span>
            </p>
            <p className="mt-2 text-sm text-[var(--sidebar-muted)]">
              {latestWeight
                ? `Logged ${formatLongDate(latestWeight.date)}`
                : "No weight logged yet"}
              {heightCm ? ` · ${heightCm} cm` : ""}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--saffron-soft)]">
              BMI now
            </p>
            <p className="font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {formatBmi(currentBmi)}
            </p>
            <p className="text-sm text-[var(--sidebar-muted)]">
              {bmiCategory(currentBmi)}
            </p>
          </div>
        </div>

        <BmiTrack
          current={currentBmi}
          firstStep={firstStepBmi}
          projected={targetBmi}
          firstStepKg={firstStepWeight}
          projectedKg={targetWeight}
        />
      </section>

      {/* Profile + goals */}
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
            Body profile
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs text-[var(--muted)]">Height (cm)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={draft.height_cm}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, height_cm: e.target.value }))
                }
                className={fieldClass}
                placeholder="170"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-[var(--muted)]">First-step BMI</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={draft.first_step_bmi}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, first_step_bmi: e.target.value }))
                }
                className={fieldClass}
                placeholder="26"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-xs text-[var(--muted)]">Projected BMI</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={draft.target_bmi}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, target_bmi: e.target.value }))
                }
                className={fieldClass}
                placeholder="22.5"
              />
            </label>
          </div>
          {(firstStepWeight != null || targetWeight != null) && (
            <p className="text-xs text-[var(--muted)]">
              {firstStepWeight != null
                ? `First step ≈ ${firstStepWeight.toFixed(1)} kg`
                : null}
              {firstStepWeight != null && targetWeight != null ? " · " : null}
              {targetWeight != null
                ? `Projected ≈ ${targetWeight.toFixed(1)} kg`
                : null}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--moss)_14%,white)] text-[var(--moss)]">
              <Droplets size={18} />
            </span>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
                Blood donation
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Whole blood wait ≈ 3 months (editable)
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs text-[var(--muted)]">Last donated</span>
              <input
                type="date"
                value={draft.blood_donated_at}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, blood_donated_at: e.target.value }))
                }
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-[var(--muted)]">Wait days</span>
              <input
                type="number"
                min={1}
                max={365}
                value={draft.blood_wait_days}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, blood_wait_days: e.target.value }))
                }
                className={fieldClass}
              />
            </label>
          </div>
          <div
            className={`rounded-xl px-3 py-2.5 text-sm ${
              blood.eligible
                ? "bg-[color-mix(in_oklab,var(--moss)_12%,white)] text-[var(--moss-deep)]"
                : "bg-[var(--observe-soft)] text-[var(--observe)]"
            }`}
          >
            {blood.eligible ? (
              draft.blood_donated_at ? (
                <>Eligible to donate again.</>
              ) : (
                <>No date set — eligible if otherwise cleared.</>
              )
            ) : (
              <>
                Wait {blood.daysRemaining} more day
                {blood.daysRemaining === 1 ? "" : "s"} — next{" "}
                {blood.nextDate ? formatShortDate(blood.nextDate) : "—"}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Weight history summary */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
              Recent weigh-ins
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Latest seven logs on this device&apos;s cloud data
            </p>
          </div>
          <Link
            href="/personal/reports"
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink-soft)] hover:border-[var(--moss)]"
          >
            <LineChartIcon size={16} />
            Reports
          </Link>
        </div>

        {sparkPoints.length > 1 ? (
          <LineChart points={sparkPoints} height={170} valueSuffix="kg" />
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {recentLogs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
              No weigh-ins yet. Tap Record weight to start the tape.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {recentLogs.map((log, idx) => {
                const bmi = computeBmi(log.weight_kg, heightCm ?? 0);
                const prev = recentLogs[idx + 1];
                const delta =
                  prev != null ? log.weight_kg - prev.weight_kg : null;
                return (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--moss-deep)]">
                        {formatLongDate(log.date)}
                      </p>
                      {log.note ? (
                        <p className="truncate text-xs text-[var(--muted)]">
                          {log.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="font-medium text-[var(--ink)]">
                        {log.weight_kg.toFixed(1)} kg
                        {delta != null && Math.abs(delta) >= 0.05 ? (
                          <span
                            className={`ml-1.5 text-xs ${
                              delta < 0
                                ? "text-[var(--moss)]"
                                : "text-[var(--observe)]"
                            }`}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta.toFixed(1)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        BMI {formatBmi(bmi)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Link
          href="/personal/reports"
          prefetch={false}
          className="inline-block text-sm text-[var(--moss)] underline-offset-2 hover:underline"
        >
          View all records →
        </Link>
      </section>

      <WeightLogDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        defaultDate={today}
        defaultWeight={currentWeight}
        onSaved={() => {
          setLogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function BmiTrack({
  current,
  firstStep,
  projected,
  firstStepKg,
  projectedKg,
}: {
  current: number | null;
  firstStep: number | null;
  projected: number | null;
  firstStepKg: number | null;
  projectedKg: number | null;
}) {
  const values = [current, firstStep, projected].filter(
    (v): v is number => v != null && !Number.isNaN(v),
  );
  if (values.length < 2) {
    return (
      <p className="relative mt-5 text-sm text-[var(--sidebar-muted)]">
        Set first-step and projected BMI to see your path on the tape.
      </p>
    );
  }

  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const span = max - min || 1;
  const pct = (v: number) => `${((v - min) / span) * 100}%`;

  return (
    <div className="relative mt-6 space-y-2">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--saffron-soft)]">
        BMI path
      </p>
      <div className="relative h-3 rounded-full bg-white/15">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--saffron),var(--saffron-soft))] opacity-80"
          style={{
            width:
              current != null && projected != null
                ? pct(Math.max(current, projected))
                : "100%",
          }}
        />
        {current != null ? (
          <Marker left={pct(current)} label={`Now ${formatBmi(current)}`} />
        ) : null}
        {firstStep != null ? (
          <Marker
            left={pct(firstStep)}
            label={`Step ${formatBmi(firstStep)}${firstStepKg != null ? ` · ${firstStepKg.toFixed(0)}kg` : ""}`}
          />
        ) : null}
        {projected != null ? (
          <Marker
            left={pct(projected)}
            label={`Goal ${formatBmi(projected)}${projectedKg != null ? ` · ${projectedKg.toFixed(0)}kg` : ""}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function Marker({ left, label }: { left: string; label: string }) {
  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left }}
    >
      <span className="block h-4 w-4 rounded-full border-2 border-white bg-[var(--saffron)] shadow" />
      <span className="absolute left-1/2 top-5 w-max -translate-x-1/2 text-[10px] text-[var(--sidebar-muted)]">
        {label}
      </span>
    </div>
  );
}

function WeightLogDialog({
  open,
  onClose,
  defaultDate,
  defaultWeight,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultWeight: number | null;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [date, setDate] = useState(defaultDate);
  const [weight, setWeight] = useState(
    defaultWeight != null ? String(defaultWeight) : "",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setDate(defaultDate);
      setWeight(defaultWeight != null ? String(defaultWeight) : "");
      setNote("");
      setError(null);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, defaultDate, defaultWeight]);

  function save() {
    setError(null);
    const kg = Number(weight);
    if (!date || !(kg > 0)) {
      setError("Enter a valid date and weight.");
      return;
    }
    startTransition(async () => {
      const result = await saveWeightLog({
        date,
        weight_kg: kg,
        note: note.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-[0_24px_60px_-28px_rgba(28,58,46,0.65)] open:flex open:flex-col backdrop:bg-black/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <h2
          id={titleId}
          className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]"
        >
          Log weight
        </h2>
        <button
          type="button"
          aria-label="Close"
          disabled={pending}
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--paper-2)]"
        >
          <X size={16} />
        </button>
      </div>
      <div className="space-y-3 px-4 py-3">
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--muted)]">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
          {date ? (
            <span className="block text-xs text-[var(--muted)]">
              {formatLongDate(date)}
            </span>
          ) : null}
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--muted)]">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={fieldClass}
            autoFocus
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--muted)]">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass}
            placeholder="Morning, after workout…"
          />
        </label>
        {error ? (
          <p className="text-xs text-[var(--observe)]">{error}</p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--paper-2)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </dialog>
  );
}
