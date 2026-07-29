"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      const next = search.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-sm space-y-5 rounded-3xl border border-[var(--line)] bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8"
    >
      <div className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt="SelfSync"
          width={48}
          height={48}
          className="rounded-2xl"
          priority
        />
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--moss-deep)]">
            SelfSync
          </p>
          <p className="text-sm text-[var(--muted)]">Private daily tracker</p>
        </div>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--muted)]">Password</span>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--moss)]"
        />
      </label>
      {error ? (
        <p className="text-sm text-[var(--observe)]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-xl bg-[var(--moss)] py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Opening…" : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
