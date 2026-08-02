import { RewardsClient } from "@/components/rewards-client";
import {
  getRewardClaim,
  getSettings,
  listDailyEntries,
  listRewardClaims,
} from "@/lib/data";
import {
  endOfIsoWeek,
  endOfMonth,
  formatDateOnly,
  isoWeekKey,
  monthKey,
  parseDateOnly,
  startOfIsoWeek,
  startOfMonth,
} from "@/lib/points";
import { localCalendarDate } from "@/lib/prayer";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const settings = await getSettings();
  const today = localCalendarDate(settings.timezone);
  const weekFrom = startOfIsoWeek(today);
  const weekTo = endOfIsoWeek(today);
  const monthFrom = startOfMonth(today);
  const monthTo = endOfMonth(today);

  const streakFromDate = parseDateOnly(today);
  streakFromDate.setDate(streakFromDate.getDate() - 90);
  const streakFrom = formatDateOnly(streakFromDate);

  const [weekEntries, monthEntries, streakEntries, weekClaim, monthClaim, history] =
    await Promise.all([
      listDailyEntries(weekFrom, weekTo),
      listDailyEntries(monthFrom, monthTo),
      listDailyEntries(streakFrom, today),
      getRewardClaim("week", isoWeekKey(today)),
      getRewardClaim("month", monthKey(today)),
      listRewardClaims(30),
    ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--moss-deep)]">
          Rewards
        </h1>
        <p className="text-[var(--muted)]">
          Points only go up. Claim when you hit the goal.
        </p>
      </header>
      <RewardsClient
        today={today}
        weekEntries={weekEntries}
        monthEntries={monthEntries}
        streakEntries={streakEntries}
        weekGoal={settings.week_goal_points}
        weekRewardText={settings.week_reward_text}
        weekClaimed={Boolean(weekClaim)}
        weekKey={isoWeekKey(today)}
        monthGoal={settings.month_goal_points}
        monthRewardText={settings.month_reward_text}
        monthClaimed={Boolean(monthClaim)}
        monthKey={monthKey(today)}
        history={history}
      />
    </div>
  );
}
