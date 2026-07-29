import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { SyncProvider } from "@/components/sync-provider";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <SyncProvider initialSettings={settings}>
      <AppShell>{children}</AppShell>
      <ServiceWorkerRegister />
    </SyncProvider>
  );
}
