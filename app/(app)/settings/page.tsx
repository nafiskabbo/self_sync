import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--moss-deep)]">
          Settings
        </h1>
        <p className="text-[var(--muted)]">
          Location, Asr method, notifications, rewards — saved locally, sync when
          ready
        </p>
      </header>
      <SettingsForm
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      />
    </div>
  );
}
