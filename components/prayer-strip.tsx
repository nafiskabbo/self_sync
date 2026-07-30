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
    <section className="animate-rise space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-1.5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
          Prayer window
        </h2>
        {nextLabel ? (
          <p className="text-xs font-medium text-[var(--saffron)] sm:text-sm">
            {nextLabel}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
        {chips.map((chip) => (
          <div
            key={chip.prayer}
            className={`rounded-lg px-0.5 py-2 text-center sm:rounded-xl sm:px-1.5 sm:py-2.5 ${
              chip.done
                ? "bg-[var(--moss)] text-white"
                : chip.isNext
                  ? "bg-[var(--saffron)] text-white ring-2 ring-[var(--saffron-soft)]"
                  : "bg-white/70 text-[var(--ink-soft)]"
            }`}
          >
            <p
              className={`text-[9px] uppercase tracking-wide sm:text-[10px] ${
                chip.done || chip.isNext ? "text-white/85" : "text-[var(--muted)]"
              }`}
            >
              {chip.label.slice(0, 3)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums sm:text-sm">
              {chip.time}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
