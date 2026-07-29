import { DailyTracker, TRACKER_ICONS } from "@/components/daily-tracker";
import Link from "next/link";
import { getDailyEntry, getSettings } from "@/lib/data";
import { DEFAULT_POINTS_PER_ITEM, PRAYERS } from "@/lib/types";
import { prayerDisplayName } from "@/lib/prayer-labels";

export const dynamic = "force-dynamic";

export default async function HistoryDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return <p>Invalid date</p>;
  }

  const settings = await getSettings();
  const entry = await getDailyEntry(date);
  const pts = { ...DEFAULT_POINTS_PER_ITEM, ...settings.points_per_item };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/history?month=${date.slice(0, 7)}`}
          className="text-sm text-[var(--muted)] hover:text-[var(--moss)]"
        >
          ← History
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--moss-deep)]">
          {date}
        </h1>
      </div>

      <DailyTracker
        key={date}
        date={date}
        initialEntry={entry}
        pointsPerItem={pts}
        namazItems={[
          ...PRAYERS.map((p) => ({
            field: p,
            label: prayerDisplayName(p),
            points: pts[p],
            icon: TRACKER_ICONS[p],
          })),
          {
            field: "roja" as const,
            label: "Roja (optional)",
            hint: "Adds points only — never required",
            points: pts.roja,
            tone: "optional" as const,
            icon: TRACKER_ICONS.roja,
          },
        ]}
        growthItems={[
          {
            field: "new_things_learnt",
            label: "New things learnt",
            points: pts.new_things_learnt,
            icon: TRACKER_ICONS.new_things_learnt,
          },
          {
            field: "diary_logged",
            label: "Wrote diary",
            hint: "Logged times",
            points: pts.diary_logged,
            icon: TRACKER_ICONS.diary_logged,
          },
        ]}
        observeItems={[
          {
            field: "watched_videos_eating",
            label: "Watched YT / videos while eating",
            points: pts.watched_videos_eating,
            tone: "observe",
            icon: TRACKER_ICONS.watched_videos_eating,
          },
          {
            field: "backbite",
            label: "Backbite",
            points: pts.backbite,
            tone: "observe",
            icon: TRACKER_ICONS.backbite,
          },
          {
            field: "lie",
            label: "Lie",
            points: pts.lie,
            tone: "observe",
            icon: TRACKER_ICONS.lie,
          },
          {
            field: "mistakes",
            label: "Mistakes / other mistakes",
            points: pts.mistakes,
            tone: "observe",
            icon: TRACKER_ICONS.mistakes,
          },
        ]}
        practiceItems={[
          {
            field: "arabic_class",
            label: "Arabic learning class",
            points: pts.arabic_class,
            icon: TRACKER_ICONS.arabic_class,
          },
          {
            field: "public_speaking",
            label: "Public speaking",
            points: pts.public_speaking,
            icon: TRACKER_ICONS.public_speaking,
          },
          {
            field: "brainstorming",
            label: "Brainstorming something",
            points: pts.brainstorming,
            icon: TRACKER_ICONS.brainstorming,
          },
        ]}
      />
    </div>
  );
}
