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
    <section className="animate-rise relative overflow-hidden rounded-3xl bg-[var(--moss-deep)] p-5 text-[var(--sidebar-text)] shadow-[0_20px_50px_-28px_rgba(28,58,46,0.8)] sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[var(--saffron)]/25 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-[var(--moss-bright)]/40 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-[var(--saffron-soft)]">
            <Sparkles size={12} />
            Today&apos;s score
          </div>
          <p
            key={points}
            className={`animate-count-pop font-[family-name:var(--font-display)] text-5xl leading-none sm:text-6xl ${
              positive ? "text-white" : "text-[#ffb4a8]"
            }`}
          >
            {points > 0 ? `+${points}` : points}
          </p>
          <p className="mt-2 max-w-xs text-sm text-[var(--sidebar-muted)]">
            Earn through prayers and growth. Observe slips cost points — stay
            honest.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
            <TrendingUp size={16} className="text-[var(--saffron-soft)]" />
            <span>{positiveCount} wins checked</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
            <TrendingDown size={16} className="text-[#ffb4a8]" />
            <span>{observeCount} observe marks</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
            <Flame size={16} className="text-[var(--saffron-soft)]" />
            <span>{positive ? "Building momentum" : "Course-correct today"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
