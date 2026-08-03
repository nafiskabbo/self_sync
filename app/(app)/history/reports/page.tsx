import { CategoriesReport } from "@/components/categories-report";
import { getSettings, listDailyEntries } from "@/lib/data";
import { localCalendarDate } from "@/lib/prayer";

export const dynamic = "force-dynamic";

export default async function HistoryReportsPage() {
  const settings = await getSettings();
  const today = localCalendarDate(settings.timezone);
  const entries = await listDailyEntries("2000-01-01", today);

  return (
    <CategoriesReport
      serverEntries={entries}
      today={today}
      threshold={settings.daily_points_threshold ?? 20}
    />
  );
}
