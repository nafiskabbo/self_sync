import { HistoryClient } from "@/components/history-client";
import { getSettings, listDailyEntries } from "@/lib/data";
import {
  endOfMonth,
  formatDateOnly,
  parseDateOnly,
  startOfMonth,
} from "@/lib/points";
import { localCalendarDate } from "@/lib/prayer";

export const dynamic = "force-dynamic";

function shiftDays(dateStr: string, delta: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDateOnly(d);
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const settings = await getSettings();
  const today = localCalendarDate(settings.timezone);
  const params = await searchParams;
  const month = params.month ?? today.slice(0, 7);
  const from = startOfMonth(`${month}-01`);
  const to = endOfMonth(`${month}-01`);

  const chartFrom = shiftDays(today, -29);
  const chartTo = today;
  // Fetch union of month + last 30 days for charts
  const rangeFrom = chartFrom < from ? chartFrom : from;
  const rangeTo = chartTo > to ? chartTo : to;

  const entries = await listDailyEntries(rangeFrom, rangeTo);
  const monthEntries = entries.filter((e) => e.date >= from && e.date <= to);
  const chartEntries = entries.filter(
    (e) => e.date >= chartFrom && e.date <= chartTo,
  );
  // Include full month for "this month" chart when browsing other months
  const allForClient = entries;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--moss-deep)]">
          History
        </h1>
        <p className="text-[var(--muted)]">
          Calendar or points chart — below threshold days are punishment days
        </p>
      </header>

      <HistoryClient
        month={month}
        today={today}
        monthEntries={monthEntries}
        chartEntries={allForClient.length ? allForClient : chartEntries}
        threshold={settings.daily_points_threshold ?? 20}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
      />
    </div>
  );
}
