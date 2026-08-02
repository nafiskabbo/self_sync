import { PersonalClient } from "@/components/personal-client";
import { getLatestWeightLog, listWeightLogs } from "@/lib/data";
import { formatDateOnly, parseDateOnly } from "@/lib/points";

export const dynamic = "force-dynamic";

export default async function PersonalPage() {
  const latest = await getLatestWeightLog();
  const to = latest?.date ?? formatDateOnly(new Date());
  const fromDate = parseDateOnly(to);
  fromDate.setDate(fromDate.getDate() - 29);
  const recent = await listWeightLogs(formatDateOnly(fromDate), to);
  const recentDesc = [...recent].reverse().slice(0, 7);

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          Personal
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Body metrics, weight tracking, and blood donation readiness
        </p>
      </header>
      <PersonalClient recentLogs={recentDesc} latestWeight={latest} />
    </div>
  );
}
