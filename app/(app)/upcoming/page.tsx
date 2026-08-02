import { UpcomingEvents } from "@/components/upcoming-events";

export const dynamic = "force-dynamic";

export default function UpcomingPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          Upcoming
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Client meetings and reminders — stays on this device
        </p>
      </header>
      <UpcomingEvents />
    </div>
  );
}
