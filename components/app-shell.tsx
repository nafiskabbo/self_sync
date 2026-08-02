"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CloudUpload,
  Gift,
  Globe2,
  LogOut,
  Menu,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useSync } from "@/components/sync-provider";

const LINKS = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/converter", label: "Clock", icon: Globe2 },
  { href: "/upcoming", label: "Upcoming", icon: CalendarClock },
  { href: "/personal", label: "Personal", icon: UserRound },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className={`flex ${compact ? "flex-row gap-1" : "flex-col gap-1"}`}>
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--sidebar-active)] text-white shadow-sm"
                    : "text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-[var(--sidebar-text)]"
                } ${compact ? "px-2.5" : ""}`}
              >
            <Icon size={18} strokeWidth={2.2} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { dirty, syncing, syncNow, status, lastSync } = useSync();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-[var(--sidebar)] px-4 py-5 text-[var(--sidebar-text)] lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-1">
          <Image
            src="/logo.svg"
            alt="SelfSync"
            width={40}
            height={40}
            className="rounded-xl"
            priority
            loading="eager"
          />
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl leading-none">
              SelfSync
            </p>
            <p className="mt-1 text-xs text-[var(--sidebar-muted)]">
              Daily rhythm
            </p>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <SyncButton
            dirty={dirty}
            syncing={syncing}
            onSync={syncNow}
            light
          />
          {status ? (
            <p className="px-1 text-xs text-[var(--sidebar-muted)]">{status}</p>
          ) : lastSync ? (
            <p className="px-1 text-xs text-[var(--sidebar-muted)]">
              Last sync {new Date(lastSync).toLocaleTimeString()}
            </p>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-[var(--moss-deep)] hover:bg-[var(--paper-2)]"
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="rounded-lg"
              priority
              loading="eager"
            />
            <span className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
              SelfSync
            </span>
          </Link>
          <SyncButton dirty={dirty} syncing={syncing} onSync={syncNow} />
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col bg-[var(--sidebar)] px-4 py-5 text-[var(--sidebar-text)] shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="" width={36} height={36} className="rounded-xl" />
                <span className="font-[family-name:var(--font-display)] text-xl">
                  SelfSync
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={logout}
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--sidebar-muted)] hover:bg-white/10"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SyncButton({
  dirty,
  syncing,
  onSync,
  light = false,
}: {
  dirty: boolean;
  syncing: boolean;
  onSync: () => void;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSync}
      disabled={syncing}
      title="Sync to cloud"
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
        light
          ? dirty
            ? "bg-[var(--sidebar-active)] text-white"
            : "bg-white/10 text-[var(--sidebar-text)] hover:bg-white/15"
          : dirty
            ? "bg-[var(--saffron)] text-white"
            : "bg-[var(--moss)] text-white"
      }`}
    >
      <CloudUpload size={16} className={syncing ? "animate-pulse" : ""} />
      <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
      {dirty ? (
        <span className="h-2 w-2 rounded-full bg-white/90" aria-hidden />
      ) : null}
    </button>
  );
}
