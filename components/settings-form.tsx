"use client";

import { Bell, Clock, MapPin, Save } from "lucide-react";
import { useState } from "react";
import { useSync } from "@/components/sync-provider";
import {
  ASR_MADHABS,
  CALCULATION_METHODS,
  PRAYERS,
  type AsrMadhab,
  type Settings,
} from "@/lib/types";
import { prayerDisplayName } from "@/lib/prayer-labels";

const COMMON_TIMEZONES = [
  "Asia/Dhaka",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Jakarta",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function SettingsForm({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const { settings, saveSettingsLocal, syncNow } = useSync();
  const [draft, setDraft] = useState<Settings>(settings);
  const [settingsStamp, setSettingsStamp] = useState(settings.updated_at);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  if (settings.updated_at !== settingsStamp) {
    setSettingsStamp(settings.updated_at);
    setDraft(settings);
  }

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((s) => ({ ...s, [key]: value }));
  }

  function saveLocal() {
    setMessage(null);
    setError(null);
    try {
      saveSettingsLocal(draft);
      setMessage("Saved on this device. Sync when ready.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  function saveAndSync() {
    saveSettingsLocal(draft);
    syncNow();
    setMessage("Saved and syncing…");
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        let location_label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } },
          );
          if (res.ok) {
            const data = (await res.json()) as {
              address?: {
                city?: string;
                town?: string;
                state?: string;
                country?: string;
              };
            };
            const a = data.address;
            location_label = [a?.city ?? a?.town, a?.state, a?.country]
              .filter(Boolean)
              .join(", ");
          }
        } catch {
          // keep coords
        }
        const next = { ...draft, latitude, longitude, location_label };
        setDraft(next);
        saveSettingsLocal(next);
        setMessage("Location saved locally");
      },
      () =>
        setError("Could not read location. Allow permission or enter manually."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function enableNotifications() {
    setPushStatus(null);
    if (!vapidPublicKey) {
      setPushStatus("Missing VAPID public key in env");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus(
        "Push not supported. On iOS, install SelfSync to Home Screen first.",
      );
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("Notification permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      if (!res.ok) {
        setPushStatus("Failed to save subscription");
        return;
      }
      setPushStatus("Notifications enabled on this device");
    } catch {
      setPushStatus(
        "Could not enable push. Install as PWA (Add to Home Screen) on iOS.",
      );
    }
  }

  return (
    <div className="space-y-10">
      {message ? <p className="text-sm text-[var(--moss)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--observe)]">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          <MapPin size={20} /> Location &amp; prayer method
        </h2>
        <p className="text-sm text-[var(--muted)]">
          {draft.location_label ?? "No location yet — detect or enter coordinates"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--moss)] px-4 py-2 text-sm font-medium text-white"
          >
            <MapPin size={16} /> Use my location
          </button>
          <button
            type="button"
            onClick={saveLocal}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2 text-sm"
          >
            <Save size={16} /> Save local
          </button>
          <button
            type="button"
            onClick={saveAndSync}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--saffron)] px-4 py-2 text-sm font-medium text-white"
          >
            Save &amp; sync
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Latitude</span>
            <input
              type="number"
              step="any"
              value={draft.latitude ?? ""}
              onChange={(e) =>
                patch(
                  "latitude",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Longitude</span>
            <input
              type="number"
              step="any"
              value={draft.longitude ?? ""}
              onChange={(e) =>
                patch(
                  "longitude",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Calculation method</span>
          <select
            value={draft.calculation_method}
            onChange={(e) => patch("calculation_method", e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Asr method (madhab)</span>
          <select
            value={draft.asr_madhab}
            onChange={(e) => patch("asr_madhab", e.target.value as AsrMadhab)}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          >
            {ASR_MADHABS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Timezone</span>
          <select
            value={draft.timezone}
            onChange={(e) => patch("timezone", e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
            {!COMMON_TIMEZONES.includes(draft.timezone) ? (
              <option value={draft.timezone}>{draft.timezone}</option>
            ) : null}
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          <Bell size={20} /> Notifications
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Mid reminder uses the window midpoint, or pick a custom clock time for
          mid only.
        </p>
        <button
          type="button"
          onClick={enableNotifications}
          className="rounded-xl bg-[var(--saffron)] px-4 py-2 text-sm font-medium text-white"
        >
          Enable notifications
        </button>
        {pushStatus ? (
          <p className="text-sm text-[var(--ink-soft)]">{pushStatus}</p>
        ) : null}

        <div className="space-y-3">
          {PRAYERS.map((prayer) => {
            const pref = draft.notification_prefs[prayer];
            return (
              <div
                key={prayer}
                className="rounded-2xl border border-[var(--line)] bg-white/60 p-3 sm:p-4"
              >
                <p className="mb-2 font-medium">{prayerDisplayName(prayer)}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {(
                    [
                      ["start", "Start"],
                      ["mid", "Mid"],
                      ["before_end_30", "30m before end"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pref[key]}
                        onChange={(e) =>
                          patch("notification_prefs", {
                            ...draft.notification_prefs,
                            [prayer]: { ...pref, [key]: e.target.checked },
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {pref.mid ? (
                  <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <Clock size={16} className="text-[var(--muted)]" />
                    <span className="text-[var(--muted)]">Custom mid time</span>
                    <input
                      type="time"
                      value={pref.mid_time ?? ""}
                      onChange={(e) =>
                        patch("notification_prefs", {
                          ...draft.notification_prefs,
                          [prayer]: {
                            ...pref,
                            mid_time: e.target.value || null,
                          },
                        })
                      }
                      className="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5"
                    />
                    {pref.mid_time ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--muted)] underline"
                        onClick={() =>
                          patch("notification_prefs", {
                            ...draft.notification_prefs,
                            [prayer]: { ...pref, mid_time: null },
                          })
                        }
                      >
                        Use calculated midpoint
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">
                        Optional — opens system clock
                      </span>
                    )}
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={saveLocal}
          className="rounded-xl bg-[var(--moss)] px-4 py-2 text-sm font-medium text-white"
        >
          Save notification prefs
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--moss-deep)]">
          Rewards &amp; points
        </h2>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Week reward text</span>
          <input
            value={draft.week_reward_text}
            onChange={(e) => patch("week_reward_text", e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Week goal points</span>
          <input
            type="number"
            value={draft.week_goal_points}
            onChange={(e) => patch("week_goal_points", Number(e.target.value))}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Month reward text</span>
          <input
            value={draft.month_reward_text}
            onChange={(e) => patch("month_reward_text", e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Month goal points</span>
          <input
            type="number"
            value={draft.month_goal_points}
            onChange={(e) => patch("month_goal_points", Number(e.target.value))}
            className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(draft.points_per_item).map(([key, value]) => (
            <label key={key} className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">
                {key.replaceAll("_", " ")}
              </span>
              <input
                type="number"
                value={value ?? 0}
                onChange={(e) =>
                  patch("points_per_item", {
                    ...draft.points_per_item,
                    [key]: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={saveAndSync}
          className="rounded-xl bg-[var(--moss)] px-4 py-2 text-sm font-medium text-white"
        >
          Save rewards &amp; sync
        </button>
      </section>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
