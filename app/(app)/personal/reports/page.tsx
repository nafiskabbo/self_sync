import { WeightReportsClient } from "@/components/weight-reports-client";
import { getSettings, listWeightLogs } from "@/lib/data";
import { formatDateOnly, parseDateOnly } from "@/lib/points";
import { localCalendarDate } from "@/lib/prayer";

export const dynamic = "force-dynamic";

function shiftDays(dateStr: string, delta: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDateOnly(d);
}

export default async function PersonalReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const settings = await getSettings();
  const today = localCalendarDate(settings.timezone);
  const params = await searchParams;
  const to =
    params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : today;
  const from =
    params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)
      ? params.from
      : shiftDays(to, -29);

  const logs = await listWeightLogs(from, to);

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          Weight reports
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Trends and weigh-ins across a date range
        </p>
      </header>
      <WeightReportsClient
        logs={logs}
        heightCm={settings.height_cm}
        today={today}
        initialFrom={from}
        initialTo={to}
      />
    </div>
  );
}
