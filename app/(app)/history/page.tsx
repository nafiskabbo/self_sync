import Link from "next/link";
import { getSettings, listDailyEntries } from "@/lib/data";
import {
  endOfMonth,
  formatDateOnly,
  parseDateOnly,
  startOfMonth,
} from "@/lib/points";
import { localCalendarDate } from "@/lib/prayer";

export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const d = parseDateOnly(`${month}-01`);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(y, m - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
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
  const entries = await listDailyEntries(from, to);
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const first = parseDateOnly(`${month}-01`);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();

  const cells: Array<{ date: string | null }> = [];
  for (let i = 0; i < startPad; i += 1) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      date: formatDateOnly(new Date(first.getFullYear(), first.getMonth(), d)),
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--moss-deep)]">
          History
        </h1>
        <p className="text-[var(--muted)]">Review and edit any day</p>
      </header>

      <div className="flex items-center justify-between">
        <Link
          href={`/history?month=${shiftMonth(month, -1)}`}
          prefetch={false}
          className="rounded-md px-3 py-1 text-sm hover:bg-[var(--paper-2)]"
        >
          Prev
        </Link>
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          {monthLabel(month)}
        </h2>
        <Link
          href={`/history?month=${shiftMonth(month, 1)}`}
          prefetch={false}
          className="rounded-md px-3 py-1 text-sm hover:bg-[var(--paper-2)]"
        >
          Next
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`pad-${i}`} />;
          const entry = byDate.get(cell.date);
          const isToday = cell.date === today;
          return (
            <Link
              key={cell.date}
              href={`/history/${cell.date}`}
              prefetch={false}
              className={`aspect-square rounded-lg border p-1 text-sm transition hover:border-[var(--moss)] ${
                isToday
                  ? "border-[var(--saffron)]"
                  : "border-[var(--line)]"
              } ${
                entry
                  ? "bg-[var(--moss)]/15 text-[var(--moss-deep)]"
                  : "bg-white/40 text-[var(--ink-soft)]"
              }`}
            >
              <span className="block text-xs">{Number(cell.date.slice(8))}</span>
              {entry ? (
                <span className="block text-[10px] tabular-nums">
                  {entry.points_earned}p
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
