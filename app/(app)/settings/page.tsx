import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Location, notifications, rewards — save locally, sync when ready
        </p>
      </header>
      <SettingsForm
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      />
    </div>
  );
}
