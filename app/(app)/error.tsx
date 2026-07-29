"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)]">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--muted)]">
        {error.message || "Unexpected error"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[var(--moss)] px-4 py-2 text-sm text-white"
      >
        Try again
      </button>
    </div>
  );
}
