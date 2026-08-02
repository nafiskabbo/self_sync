import { ClockConverter } from "@/components/clock-converter";

export const dynamic = "force-dynamic";

export default function ConverterPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          Clock
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Convert your time to client zones — edit the clock to plan meetings
        </p>
      </header>
      <ClockConverter />
    </div>
  );
}
