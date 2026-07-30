import { ClearDataMenu } from "@/components/clear-data-menu";
import { DailyTracker } from "@/components/daily-tracker";
import { PrayerStrip } from "@/components/prayer-strip";
import { getDailyEntry, getSettings } from "@/lib/data";
import {
  computePrayerWindows,
  formatPrayerTime,
  getNextPrayerHint,
  localCalendarDate,
} from "@/lib/prayer";
import { prayerDisplayName } from "@/lib/prayer-labels";
import { DEFAULT_POINTS_PER_ITEM, PRAYERS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const settings = await getSettings();
  const today = localCalendarDate(settings.timezone);
  const entry = await getDailyEntry(today);
  const pts = { ...DEFAULT_POINTS_PER_ITEM, ...settings.points_per_item };

  let chips: Array<{
    prayer: string;
    label: string;
    time: string;
    done: boolean;
    isNext: boolean;
  }> = [];
  let nextLabel: string | null = null;

  if (settings.latitude != null && settings.longitude != null) {
    const windows = computePrayerWindows(
      new Date(),
      settings.latitude,
      settings.longitude,
      settings.calculation_method,
      settings.asr_madhab,
    );
    const next = getNextPrayerHint(windows);
    chips = windows.map((w) => ({
      prayer: w.prayer,
      label: prayerDisplayName(w.prayer),
      time: formatPrayerTime(w.start, settings.timezone),
      done: Boolean(entry[w.prayer]),
      isNext: next?.prayer === w.prayer,
    }));
    if (next) {
      nextLabel = `Next: ${prayerDisplayName(next.prayer)} at ${formatPrayerTime(next.start, settings.timezone)}`;
    }
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: settings.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] sm:text-sm">
            {formatted}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
            Today
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {settings.latitude == null ? (
            <p className="text-xs text-[var(--saffron)] sm:text-sm">
              Set location in Settings for prayer times.
            </p>
          ) : null}
          <ClearDataMenu compact />
        </div>
      </header>

      {chips.length ? <PrayerStrip chips={chips} nextLabel={nextLabel} /> : null}

      <DailyTracker
        key={today}
        date={today}
        initialEntry={entry}
        pointsPerItem={pts}
        namazItems={[
          ...PRAYERS.map((p) => ({
            field: p,
            label: prayerDisplayName(p),
            points: pts[p],
          })),
          {
            field: "roja" as const,
            label: "Roja (optional)",
            hint: "Adds points only — never required",
            points: pts.roja,
            tone: "optional" as const,
          },
        ]}
        growthItems={[
          {
            field: "new_things_learnt",
            label: "New things learnt",
            points: pts.new_things_learnt,
          },
          {
            field: "diary_logged",
            label: "Wrote diary",
            hint: "Logged times",
            points: pts.diary_logged,
          },
        ]}
        observeItems={[
          {
            field: "watched_videos_eating",
            label: "Watched YT / videos while eating",
            points: pts.watched_videos_eating,
            tone: "observe",
          },
          {
            field: "backbite",
            label: "Backbite",
            points: pts.backbite,
            tone: "observe",
          },
          {
            field: "lie",
            label: "Lie",
            points: pts.lie,
            tone: "observe",
          },
          {
            field: "mistakes",
            label: "Mistakes / other mistakes",
            points: pts.mistakes,
            tone: "observe",
          },
        ]}
        practiceItems={[
          {
            field: "arabic_class",
            label: "Arabic learning class",
            points: pts.arabic_class,
          },
          {
            field: "public_speaking",
            label: "Public speaking",
            points: pts.public_speaking,
          },
          {
            field: "brainstorming",
            label: "Brainstorming something",
            points: pts.brainstorming,
          },
        ]}
      />
    </div>
  );
}
