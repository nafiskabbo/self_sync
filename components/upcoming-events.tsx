"use client";

import {
  CalendarPlus,
  ExternalLink,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getUpcomingEvents,
  removeUpcomingEvent,
  upsertUpcomingEvent,
} from "@/lib/local-store";
import type { UpcomingEvent } from "@/lib/types";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]";

type Draft = {
  id: string | null;
  clientName: string;
  date: string;
  time: string;
  meetingUrl: string;
  notes: string;
};

function emptyDraft(today: string): Draft {
  return {
    id: null,
    clientName: "",
    date: today,
    time: "10:00",
    meetingUrl: "",
    notes: "",
  };
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventInstant(e: Pick<UpcomingEvent, "date" | "time">): number {
  return Date.parse(`${e.date}T${e.time}:00`);
}

function formatWhen(date: string, time: string): string {
  const ms = Date.parse(`${date}T${time}:00`);
  if (Number.isNaN(ms)) return `${date} ${time}`;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

function isPast(e: UpcomingEvent, now = Date.now()): boolean {
  return eventInstant(e) < now;
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(todayLocal()));
  const [formOpen, setFormOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvents(getUpcomingEvents());
    setHydrated(true);
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: UpcomingEvent[] = [];
    const gone: UpcomingEvent[] = [];
    for (const e of events) {
      if (isPast(e, now)) gone.push(e);
      else up.push(e);
    }
    gone.reverse();
    return { upcoming: up, past: gone };
  }, [events]);

  function openCreate() {
    setDraft(emptyDraft(todayLocal()));
    setError(null);
    setFormOpen(true);
  }

  function openEdit(event: UpcomingEvent) {
    setDraft({
      id: event.id,
      clientName: event.clientName,
      date: event.date,
      time: event.time,
      meetingUrl: event.meetingUrl ?? "",
      notes: event.notes ?? "",
    });
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setError(null);
  }

  function save() {
    setError(null);
    const clientName = draft.clientName.trim();
    if (!clientName) {
      setError("Client name is required.");
      return;
    }
    if (!draft.date || !draft.time) {
      setError("Date and time are required.");
      return;
    }

    const event: UpcomingEvent = {
      id: draft.id ?? crypto.randomUUID(),
      clientName,
      date: draft.date,
      time: draft.time,
      meetingUrl: draft.meetingUrl.trim() || null,
      notes: draft.notes.trim() || null,
      createdAt: draft.id
        ? (events.find((e) => e.id === draft.id)?.createdAt ??
          new Date().toISOString())
        : new Date().toISOString(),
    };

    upsertUpcomingEvent(event);
    setEvents(getUpcomingEvents());
    closeForm();
  }

  function remove(id: string) {
    removeUpcomingEvent(id);
    setEvents(getUpcomingEvents());
    if (draft.id === id) closeForm();
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        Loading events…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Stored on this device only — no notifications
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--moss)] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[var(--moss-bright)]"
        >
          <CalendarPlus size={16} />
          Add event
        </button>
      </div>

      {formOpen ? (
        <section className="animate-rise space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)]">
              {draft.id ? "Edit event" : "New event"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--paper-2)]"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-[var(--ink-soft)]">
                Client name
              </span>
              <input
                type="text"
                value={draft.clientName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, clientName: e.target.value }))
                }
                placeholder="Acme Corp"
                className={fieldClass}
                autoFocus
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[var(--ink-soft)]">
                Date
              </span>
              <input
                type="date"
                value={draft.date}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, date: e.target.value }))
                }
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-[var(--ink-soft)]">
                Time
              </span>
              <input
                type="time"
                value={draft.time}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, time: e.target.value }))
                }
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-[var(--ink-soft)]">
                Meeting URL{" "}
                <span className="font-normal text-[var(--muted)]">(optional)</span>
              </span>
              <input
                type="url"
                value={draft.meetingUrl}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, meetingUrl: e.target.value }))
                }
                placeholder="https://meet.google.com/…"
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-[var(--ink-soft)]">
                Notes{" "}
                <span className="font-normal text-[var(--muted)]">(optional)</span>
              </span>
              <textarea
                value={draft.notes}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: e.target.value }))
                }
                rows={3}
                placeholder="Agenda, prep, timezone reminder…"
                className={`${fieldClass} resize-y`}
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm text-[var(--observe)]">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-xl bg-[var(--moss)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--moss-bright)]"
            >
              {draft.id ? "Save changes" : "Add event"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <EventList
        title="Coming up"
        empty="No upcoming events. Add one when you book a client call."
        events={upcoming}
        onEdit={openEdit}
        onRemove={remove}
      />

      {past.length > 0 ? (
        <EventList
          title="Past"
          empty=""
          events={past}
          muted
          onEdit={openEdit}
          onRemove={remove}
        />
      ) : null}
    </div>
  );
}

function EventList({
  title,
  empty,
  events,
  muted = false,
  onEdit,
  onRemove,
}: {
  title: string;
  empty: string;
  events: UpcomingEvent[];
  muted?: boolean;
  onEdit: (e: UpcomingEvent) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <h2
        className={`font-[family-name:var(--font-display)] text-lg ${
          muted ? "text-[var(--muted)]" : "text-[var(--moss-deep)]"
        }`}
      >
        {title}
      </h2>

      {events.length === 0 ? (
        empty ? (
          <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            {empty}
          </p>
        ) : null
      ) : (
        <ul className="space-y-2.5">
          {events.map((event) => (
            <li
              key={event.id}
              className={`animate-rise rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 ${
                muted ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-[var(--moss-deep)]">
                    {event.clientName}
                  </p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {formatWhen(event.date, event.time)}
                  </p>
                  {event.notes ? (
                    <p className="whitespace-pre-wrap text-sm text-[var(--muted)]">
                      {event.notes}
                    </p>
                  ) : null}
                  {event.meetingUrl ? (
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[var(--moss)] underline-offset-2 hover:underline"
                    >
                      Join meeting
                      <ExternalLink size={13} />
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="Edit event"
                    onClick={() => onEdit(event)}
                    className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--paper-2)] hover:text-[var(--moss)]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete event"
                    onClick={() => onRemove(event.id)}
                    className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--observe-soft)] hover:text-[var(--observe)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
