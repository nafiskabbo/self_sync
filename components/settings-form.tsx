"use client";

import { Bell, Clock, MapPin, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { ClearDataMenu } from "@/components/clear-data-menu";
import { useSync } from "@/components/sync-provider";
import { clearRewardClaims } from "@/lib/actions";
import {
  ASR_MADHABS,
  CALCULATION_METHODS,
  PRAYERS,
  type AsrMadhab,
  type Settings,
} from "@/lib/types";
import { prayerDisplayName } from "@/lib/prayer-labels";
import { COMMON_TIMEZONES } from "@/lib/timezones";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]";

export function SettingsForm({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const { settings, saveSettingsLocal, syncNow } = useSync();
  const [draft, setDraft] = useState<Settings>(settings);
  const [settingsStamp, setSettingsStamp] = useState(settings.updated_at);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [rewardsPending, startRewardsClear] = useTransition();
  const [rewardsMsg, setRewardsMsg] = useState<string | null>(null);

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
    <div className="space-y-6 sm:space-y-7">
      {(message || error) && (
        <div className="space-y-1">
          {message ? <p className="text-sm text-[var(--moss)]">{message}</p> : null}
          {error ? <p className="text-sm text-[var(--observe)]">{error}</p> : null}
        </div>
      )}

      <div className="sticky top-12 z-20 -mx-3 flex flex-wrap gap-2 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_92%,transparent)] px-3 py-2 backdrop-blur-md sm:top-0 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm font-medium text-white"
        >
          <MapPin size={14} /> Locate
        </button>
        <button
          type="button"
          onClick={saveLocal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white/80 px-3 py-1.5 text-sm"
        >
          <Save size={14} /> Save local
        </button>
        <button
          type="button"
          onClick={saveAndSync}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--saffron)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Save &amp; sync
        </button>
      </div>

      <section className="space-y-2.5">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
          <MapPin size={18} /> Location &amp; prayer method
        </h2>
        <p className="text-xs text-[var(--muted)] sm:text-sm">
          {draft.location_label ?? "No location yet — detect or enter coordinates"}
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-0.5 text-sm">
            <span className="text-xs text-[var(--muted)]">Latitude</span>
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
              className={fieldClass}
            />
          </label>
          <label className="space-y-0.5 text-sm">
            <span className="text-xs text-[var(--muted)]">Longitude</span>
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
              className={fieldClass}
            />
          </label>
          <label className="col-span-2 space-y-0.5 text-sm sm:col-span-1 lg:col-span-1">
            <span className="text-xs text-[var(--muted)]">Asr madhab</span>
            <select
              value={draft.asr_madhab}
              onChange={(e) => patch("asr_madhab", e.target.value as AsrMadhab)}
              className={fieldClass}
            >
              {ASR_MADHABS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 space-y-0.5 text-sm sm:col-span-1 lg:col-span-1">
            <span className="text-xs text-[var(--muted)]">Timezone</span>
            <select
              value={draft.timezone}
              onChange={(e) => patch("timezone", e.target.value)}
              className={fieldClass}
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
        </div>

        <label className="block space-y-0.5 text-sm">
          <span className="text-xs text-[var(--muted)]">Calculation method</span>
          <select
            value={draft.calculation_method}
            onChange={(e) => patch("calculation_method", e.target.value)}
            className={fieldClass}
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
            <Bell size={18} /> Notifications
          </h2>
          <button
            type="button"
            onClick={enableNotifications}
            className="rounded-lg bg-[var(--saffron)] px-3 py-1.5 text-sm font-medium text-white"
          >
            Enable push
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] sm:text-sm">
          Mid uses window midpoint unless you set a custom clock time.
        </p>
        {pushStatus ? (
          <p className="text-sm text-[var(--ink-soft)]">{pushStatus}</p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRAYERS.map((prayer) => {
            const pref = draft.notification_prefs[prayer];
            return (
              <div
                key={prayer}
                className="rounded-xl border border-[var(--line)] bg-white/60 p-2.5 sm:p-3"
              >
                <p className="mb-1.5 text-sm font-medium">
                  {prayerDisplayName(prayer)}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">
                  {(
                    [
                      ["start", "Start"],
                      ["mid", "Mid"],
                      ["before_end_30", "30m end"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5">
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
                  <label className="mt-2 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                    <Clock size={14} className="text-[var(--muted)]" />
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
                      className="rounded-md border border-[var(--line)] bg-white px-1.5 py-1 text-sm"
                    />
                    {pref.mid_time ? (
                      <button
                        type="button"
                        className="text-[11px] text-[var(--muted)] underline"
                        onClick={() =>
                          patch("notification_prefs", {
                            ...draft.notification_prefs,
                            [prayer]: { ...pref, mid_time: null },
                          })
                        }
                      >
                        Use midpoint
                      </button>
                    ) : (
                      <span className="text-[11px] text-[var(--muted)]">
                        Optional
                      </span>
                    )}
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
          Rewards &amp; points
        </h2>

        <label className="block space-y-0.5 text-sm sm:max-w-xs">
          <span className="text-xs text-[var(--muted)]">
            Daily points threshold (punishment below)
          </span>
          <input
            type="number"
            min={0}
            value={draft.daily_points_threshold ?? 20}
            onChange={(e) =>
              patch("daily_points_threshold", Number(e.target.value))
            }
            className={fieldClass}
          />
          <span className="block text-[11px] text-[var(--muted)]">
            Days scoring under this mark as punishment on History
          </span>
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-0.5 text-sm">
            <span className="text-xs text-[var(--muted)]">Week reward</span>
            <input
              value={draft.week_reward_text}
              onChange={(e) => patch("week_reward_text", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="space-y-0.5 text-sm">
            <span className="text-xs text-[var(--muted)]">
              Week goal points (default 200)
            </span>
            <input
              type="number"
              value={draft.week_goal_points}
              onChange={(e) => patch("week_goal_points", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="space-y-0.5 text-sm">
            <span className="text-xs text-[var(--muted)]">Month reward</span>
            <input
              value={draft.month_reward_text}
              onChange={(e) => patch("month_reward_text", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="space-y-0.5 text-sm">
            <span className="text-xs text-[var(--muted)]">
              Month goal points (default 800)
            </span>
            <input
              type="number"
              value={draft.month_goal_points}
              onChange={(e) => patch("month_goal_points", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(draft.points_per_item).map(([key, value]) => (
            <label key={key} className="space-y-0.5 text-sm">
              <span className="line-clamp-1 text-[11px] capitalize text-[var(--muted)] sm:text-xs">
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
                className={fieldClass}
              />
            </label>
          ))}
        </div>
      </section>
      <section className="space-y-2.5">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--moss-deep)] sm:text-xl">
          Data
        </h2>
        <p className="text-xs text-[var(--muted)] sm:text-sm">
          Clear today&apos;s checkboxes, wipe the last 7 days, or reset all daily
          history (local + cloud). Settings are kept.
        </p>
        <div className="flex flex-wrap gap-2">
          <ClearDataMenu />
          <button
            type="button"
            disabled={rewardsPending}
            onClick={() => {
              if (
                !window.confirm(
                  "Clear all claimed rewards history? This cannot be undone.",
                )
              ) {
                return;
              }
              setRewardsMsg(null);
              startRewardsClear(async () => {
                const result = await clearRewardClaims();
                if (!result.ok) {
                  setRewardsMsg(result.error);
                  return;
                }
                setRewardsMsg(
                  result.cleared === 0
                    ? "No reward claims to clear"
                    : `Cleared ${result.cleared} reward claim${result.cleared === 1 ? "" : "s"}`,
                );
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white/80 px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:border-[var(--observe)]/40 hover:text-[var(--observe)] disabled:opacity-50"
          >
            {rewardsPending ? "Clearing…" : "Clear rewards"}
          </button>
        </div>
        {rewardsMsg ? (
          <p className="text-xs text-[var(--muted)]">{rewardsMsg}</p>
        ) : null}
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
