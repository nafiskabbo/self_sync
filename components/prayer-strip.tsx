type PrayerChip = {
  prayer: string;
  label: string;
  time: string;
  done: boolean;
  isNext: boolean;
};

export function PrayerStrip({
  chips,
  nextLabel,
}: {
  chips: PrayerChip[];
  nextLabel: string | null;
}) {
  return (
    <section className="animate-rise space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          Prayer window
        </h2>
        {nextLabel ? (
          <p className="text-sm font-medium text-[var(--saffron)]">{nextLabel}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {chips.map((chip) => (
          <div
            key={chip.prayer}
            className={`rounded-xl px-1 py-2.5 text-center sm:px-2 ${
              chip.done
                ? "bg-[var(--moss)] text-white"
                : chip.isNext
                  ? "bg-[var(--saffron)] text-white ring-2 ring-[var(--saffron-soft)]"
                  : "bg-white/70 text-[var(--ink-soft)]"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wide sm:text-xs ${
                chip.done || chip.isNext ? "text-white/85" : "text-[var(--muted)]"
              }`}
            >
              {chip.label.slice(0, 3)}
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums sm:text-sm">
              {chip.time}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
