"use client";

import { Eraser, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useSync } from "@/components/sync-provider";
import type { ClearHistoryScope } from "@/lib/types";

const OPTIONS: Array<{
  scope: ClearHistoryScope;
  label: string;
  detail: string;
  confirm: string;
  danger?: boolean;
}> = [
  {
    scope: "today",
    label: "Clear today",
    detail: "Reset checkboxes and points for the current date.",
    confirm: "Clear today’s checkboxes and points?",
  },
  {
    scope: "last7",
    label: "Clear last 7 days",
    detail: "Wipe checkboxes and points for today and the prior 6 days.",
    confirm: "Clear the last 7 days of tracking data?",
  },
  {
    scope: "all",
    label: "Reset all history",
    detail: "Delete every daily entry locally and in the cloud.",
    confirm: "Delete ALL daily history? This cannot be undone.",
    danger: true,
  },
];

export function ClearDataMenu({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const { clearHistory } = useSync();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ClearHistoryScope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function close() {
    if (pending) return;
    setOpen(false);
    setSelected(null);
    setError(null);
  }

  function runClear() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await clearHistory(selected);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setSelected(null);
      router.refresh();
    });
  }

  const selectedOption = OPTIONS.find((o) => o.scope === selected) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSelected(null);
          setError(null);
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white/80 text-sm text-[var(--ink-soft)] transition hover:border-[var(--observe)]/40 hover:text-[var(--observe)] ${
          compact ? "px-2.5 py-1.5" : "px-3 py-1.5"
        }`}
      >
        <Eraser size={14} />
        Clear
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={close}
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="fixed inset-0 z-50 m-auto w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-[0_24px_60px_-28px_rgba(28,58,46,0.65)] open:flex open:flex-col backdrop:bg-black/45 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]"
            >
              Clear data
            </h2>
            <p id={descId} className="mt-0.5 text-xs text-[var(--muted)]">
              Choose what to reset. Settings and reward claims stay.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={pending}
            onClick={close}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 px-4 py-3">
          {OPTIONS.map((option) => {
            const active = selected === option.scope;
            return (
              <label
                key={option.scope}
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition ${
                  active
                    ? option.danger
                      ? "border-[var(--observe)] bg-[var(--observe-soft)]"
                      : "border-[var(--moss)] bg-[color-mix(in_oklab,var(--moss)_10%,white)]"
                    : "border-[var(--line)] bg-white/70 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="clear-scope"
                  className="mt-1"
                  checked={active}
                  disabled={pending}
                  onChange={() => {
                    setSelected(option.scope);
                    setError(null);
                  }}
                />
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-medium ${
                      option.danger ? "text-[var(--observe)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
                    {option.detail}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {selectedOption ? (
          <p
            className={`mx-4 mb-2 rounded-lg px-3 py-2 text-xs ${
              selectedOption.danger
                ? "bg-[var(--observe-soft)] text-[var(--observe)]"
                : "bg-[var(--paper-2)] text-[var(--ink-soft)]"
            }`}
          >
            {selectedOption.confirm}
          </p>
        ) : null}

        {error ? (
          <p className="mx-4 mb-2 text-xs text-[var(--observe)]">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button
            type="button"
            disabled={pending}
            onClick={close}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || pending}
            onClick={runClear}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
              selectedOption?.danger
                ? "bg-[var(--observe)]"
                : "bg-[var(--moss)]"
            }`}
          >
            {pending ? "Clearing…" : "Clear"}
          </button>
        </div>
      </dialog>
    </>
  );
}
