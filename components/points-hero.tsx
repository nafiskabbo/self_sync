"use client";

import { Flame, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

export function PointsHero({
  points,
  positiveCount,
  observeCount,
}: {
  points: number;
  positiveCount: number;
  observeCount: number;
}) {
  const positive = points >= 0;

  return (
    <section className="animate-rise relative overflow-hidden rounded-2xl bg-[var(--moss-deep)] px-4 py-3.5 text-[var(--sidebar-text)] sm:px-5 sm:py-4">
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[var(--saffron)]/25 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <div className="mb-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-[var(--saffron-soft)]">
              <Sparkles size={10} />
              Today&apos;s score
            </div>
            <p
              key={points}
              className={`animate-count-pop font-[family-name:var(--font-display)] text-3xl leading-none sm:text-4xl ${
                positive ? "text-white" : "text-[#ffb4a8]"
              }`}
            >
              {points > 0 ? `+${points}` : points}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5">
            <TrendingUp size={14} className="text-[var(--saffron-soft)]" />
            <span>{positiveCount} wins</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5">
            <TrendingDown size={14} className="text-[#ffb4a8]" />
            <span>{observeCount} observe</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5">
            <Flame size={14} className="text-[var(--saffron-soft)]" />
            <span>{positive ? "On track" : "Reset"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
