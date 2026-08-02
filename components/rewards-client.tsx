"use client";

import { Frown, PartyPopper, Trophy } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useSync } from "@/components/sync-provider";
import { claimPeriodReward } from "@/lib/actions";
import { formatLongDate } from "@/lib/format-date";
import { mergeEntriesWithLocal } from "@/lib/merge-local-entries";
import {
  computePrayerStreak,
  endOfIsoWeek,
  endOfMonth,
  startOfIsoWeek,
  startOfMonth,
  sumPoints,
} from "@/lib/points";
import type { DailyEntry, RewardClaimed } from "@/lib/types";

export function RewardsClient({
  today,
  weekEntries: serverWeek,
  monthEntries: serverMonth,
  streakEntries: serverStreak,
  weekGoal,
  weekRewardText,
  weekClaimed,
  weekKey,
  monthGoal,
  monthRewardText,
  monthClaimed,
  monthKey,
  history,
}: {
  today: string;
  weekEntries: DailyEntry[];
  monthEntries: DailyEntry[];
  streakEntries: DailyEntry[];
  weekGoal: number;
  weekRewardText: string;
  weekClaimed: boolean;
  weekKey: string;
  monthGoal: number;
  monthRewardText: string;
  monthClaimed: boolean;
  monthKey: string;
  history: RewardClaimed[];
}) {
  const { settings, entriesVersion, syncNow } = useSync();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [localWeekClaimed, setLocalWeekClaimed] = useState(weekClaimed);
  const [localMonthClaimed, setLocalMonthClaimed] = useState(monthClaimed);
  const [fx, setFx] = useState<"win" | "lose" | null>(null);

  const weekFrom = startOfIsoWeek(today);
  const weekTo = endOfIsoWeek(today);
  const monthFrom = startOfMonth(today);
  const monthTo = endOfMonth(today);
  const streakFrom = serverStreak[0]?.date ?? today;

  const [weekPoints, setWeekPoints] = useState(() => sumPoints(serverWeek));
  const [monthPoints, setMonthPoints] = useState(() => sumPoints(serverMonth));
  const [streak, setStreak] = useState(() =>
    computePrayerStreak(serverStreak, today),
  );

  useEffect(() => {
    const weekMerged = mergeEntriesWithLocal(
      serverWeek,
      weekFrom,
      weekTo,
      settings.points_per_item,
    );
    const monthMerged = mergeEntriesWithLocal(
      serverMonth,
      monthFrom,
      monthTo,
      settings.points_per_item,
    );
    const streakMerged = mergeEntriesWithLocal(
      serverStreak,
      streakFrom,
      today,
      settings.points_per_item,
    );
    setWeekPoints(sumPoints(weekMerged));
    setMonthPoints(sumPoints(monthMerged));
    setStreak(computePrayerStreak(streakMerged, today));
  }, [
    serverWeek,
    serverMonth,
    serverStreak,
    weekFrom,
    weekTo,
    monthFrom,
    monthTo,
    streakFrom,
    today,
    settings.points_per_item,
    entriesVersion,
  ]);

  useEffect(() => {
    if (!fx) return;
    const t = window.setTimeout(() => setFx(null), 2200);
    return () => window.clearTimeout(t);
  }, [fx]);

  function claim(type: "week" | "month") {
    setMsg(null);
    startTransition(async () => {
      await syncNow();
      const result = await claimPeriodReward(type, today);
      if (!result.ok) {
        setFx("lose");
        setMsg(result.error);
        return;
      }
      if (type === "week") setLocalWeekClaimed(true);
      else setLocalMonthClaimed(true);
      setFx("win");
      setMsg("Reward claimed — enjoy it.");
    });
  }

  return (
    <div className="relative space-y-8">
      {fx === "win" ? <ConfettiBurst /> : null}
      {fx === "lose" ? (
        <div className="animate-lose fixed inset-x-0 top-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[var(--observe)]/30 bg-[var(--observe-soft)] px-4 py-3 text-[var(--observe)] shadow-lg">
          <Frown size={22} />
          <div>
            <p className="font-semibold">Not yet</p>
            <p className="text-sm opacity-90">Keep stacking points.</p>
          </div>
        </div>
      ) : null}
      {fx === "win" ? (
        <div className="animate-win-shake fixed inset-x-0 top-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-[var(--moss-deep)] px-4 py-3 text-white shadow-lg">
          <PartyPopper size={22} className="text-[var(--saffron-soft)]" />
          <div>
            <p className="font-semibold">You won!</p>
            <p className="text-sm text-[var(--sidebar-muted)]">
              Treat yourself — you earned it.
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--moss-deep)] p-5 text-white sm:p-6">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--saffron-soft)]">
          Prayer streak
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl">
          {streak}{" "}
          <span className="text-lg text-[var(--sidebar-muted)]">days</span>
        </p>
        <p className="mt-1 text-sm text-[var(--sidebar-muted)]">
          Consecutive days with all five prayers checked
        </p>
      </div>

      {msg && !fx ? <p className="text-sm text-[var(--moss)]">{msg}</p> : null}

      <PeriodCard
        title="This week"
        periodKey={weekKey}
        points={weekPoints}
        goal={weekGoal}
        rewardText={weekRewardText}
        claimed={localWeekClaimed}
        pending={pending}
        onClaim={() => claim("week")}
      />
      <PeriodCard
        title="This month"
        periodKey={monthKey}
        points={monthPoints}
        goal={monthGoal}
        rewardText={monthRewardText}
        claimed={localMonthClaimed}
        pending={pending}
        onClaim={() => claim("month")}
      />

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          Claimed
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No rewards claimed yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-[var(--line)] bg-white/60 px-3 py-2 text-sm"
              >
                <span className="font-medium capitalize">{r.period_type}</span>{" "}
                <span className="text-[var(--muted)]">{r.period_key}</span>
                <p className="text-[var(--ink-soft)]">{r.reward_text}</p>
                <p className="text-xs text-[var(--muted)]">
                  {r.points_at_claim} pts ·{" "}
                  {formatLongDate(r.claimed_at.slice(0, 10))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PeriodCard({
  title,
  periodKey,
  points,
  goal,
  rewardText,
  claimed,
  pending,
  onClaim,
}: {
  title: string;
  periodKey: string;
  points: number;
  goal: number;
  rewardText: string;
  claimed: boolean;
  pending: boolean;
  onClaim: () => void;
}) {
  const pct = Math.min(100, Math.round((Math.max(0, points) / goal) * 100));
  const ready = points >= goal && !claimed;

  return (
    <section className="space-y-3 rounded-3xl border border-[var(--line)] bg-white/65 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          {title}
        </h2>
        <span className="text-xs text-[var(--muted)]">{periodKey}</span>
      </div>
      <p className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <Trophy size={16} className="text-[var(--saffron)]" />
        {rewardText}
      </p>
      <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        {points}
        <span className="text-base text-[var(--muted)]"> / {goal}</span>
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--paper-2)]">
        <div
          className="h-full rounded-full bg-[var(--moss)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {claimed ? (
        <p className="text-sm font-medium text-[var(--moss)]">
          Claimed for this period
        </p>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={onClaim}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 ${
            ready
              ? "animate-pulse-glow bg-[var(--saffron)]"
              : "bg-[var(--moss)]"
          }`}
        >
          {ready ? "Claim reward" : "Try claim"}
        </button>
      )}
    </section>
  );
}

function ConfettiBurst() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  const colors = ["#c47a2c", "#2f5d4a", "#e8b86d", "#1c3a2e", "#f3f0e8"];
  return (
    <>
      {pieces.map((i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 17) % 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${1.4 + (i % 5) * 0.2}s`,
            animationDelay: `${(i % 7) * 0.05}s`,
          }}
        />
      ))}
    </>
  );
}
