# SelfSync

Personal daily tracker and life-observing web app. Single-user, deployed on Vercel, data in Supabase, prayer notifications via Web Push.

## Purpose

Track namaz, optional roja, daily habits (growth + observe + practice), diary writing, earn points that only go up, claim week/month rewards, and get namaz reminders at the start, mid-window, 30 minutes before end, or a custom time.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- Supabase Postgres (cross-device sync)
- Simple password auth (`AUTH_PASSWORD` + signed cookie)
- `adhan` for prayer times (auto geolocation + all calculation methods)
- Points only go up for positive habits; observe slips now apply negative points
- Local-first edits with Sync button + auto cloud sync every 5 minutes
- Asr madhab (Shafi / Hanafi) in Settings
- Learnt note under “New things learnt”
- Mid notification optional custom clock time
- Left sidebar navigation (drawer on mobile)
- Vercel Analytics
- Web Push (VAPID) + service worker + cron (`/api/cron/prayer-notify`)

## Features

### Today
- Five namaz checkboxes + optional roja (points only when checked; never required)
- Growth: new things learnt, wrote diary (logged times)
- Observe (0 points): videos while eating, backbite, lie, mistakes
- Practice: arabic class, public speaking, brainstorming
- Notes field
- Prayer time strip when location is set

### History
- Month calendar; open any day to edit

### Rewards
- Week and month point totals vs configurable goals
- Custom reward text; claim when goal met
- Prayer streak (consecutive days with all five prayers)
- Claimed history

### Settings
- Use my location / manual lat-lng
- All `adhan` calculation methods
- Timezone
- Per-prayer notification toggles (start, mid, 30m before end, custom HH:mm)
- Enable Web Push on this device
- Reward texts, goals, points-per-item

### Notifications
- Requires PWA install on iOS (Add to Home Screen) and notification permission
- Cron hits `/api/cron/prayer-notify` every minute with `Authorization: Bearer CRON_SECRET`
- Idempotent via `notification_sends` unique key

## Points rules

- Only add. Observe items never deduct.
- Positive items award configured points when checked; unchecking recalculates.
- `points_earned` on each daily row is always recomputed and never negative.

## Local-first sync

Edits save to **localStorage** immediately. Cloud writes happen when you tap **Sync** or automatically every **5 minutes** if there are pending changes. This keeps the UI snappy and reduces Supabase chatter.

## Database

See migrations in [`supabase/migrations/`](supabase/migrations/).

Run `001_init.sql` for new projects, then `002_learnt_asr_points.sql` if you already applied v1.


## Environment

Documented in `.env.example` and README.

## Deploy notes

1. Create a Supabase project and run the migration SQL.
2. Set env vars on Vercel.
3. Deploy. For minute-level prayer pushes: Vercel Pro cron, or an external cron (e.g. cron-job.org) calling the cron URL every minute with `CRON_SECRET`.
4. Open the site on your phone, install as PWA, enable notifications in Settings, set location.
