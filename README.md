# SelfSync

Private personal daily tracker for namaz, optional roja, habits, diary logging, points/rewards, and prayer Web Push notifications. Built for one user, Vercel + Supabase.

## Features

- **Today** — check namaz + habits, optional roja, notes, live prayer strip
- **History** — month calendar, edit any day
- **Rewards** — week/month goals, custom reward text, prayer streak, claim flow
- **Settings** — geolocation, all prayer calculation methods, notification prefs, push enable
- **Cross-device** — local-first cache + Sync button / every 5 minutes to Supabase
- **Asr method** — Shafi or Hanafi in Settings
- **Observe** — negative points when marked
- **Learnt notes** — jot what you learned under the checkbox

Points: growth/namaz add; observe items subtract. Roja is optional and only adds.

## Setup

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
3. Copy **Project URL** and **service_role** key (Settings → API)

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in values:

| Variable | Purpose |
|----------|---------|
| `AUTH_PASSWORD` | Your login password |
| `AUTH_SECRET` | Long random string for signing the session cookie |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `CRON_SECRET` | Bearer token for the prayer notify cron |

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Generate secrets:

```bash
openssl rand -base64 32
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in, open **Settings**, set location, enable notifications.

### 5. Verify

```bash
npm run verify
```

## Deploy on Vercel

1. Push the repo and import into Vercel
2. Add the same env vars
3. Deploy

Prayer pushes need a **once-per-minute** hit to `/api/cron/prayer-notify`. Vercel Hobby only allows **daily** crons, so this repo does not define a Vercel cron (that would fail deploy).

**Options:**
1. **Hobby (recommended for free):** point an external cron (e.g. [cron-job.org](https://cron-job.org)) at the URL below, every minute.
2. **Pro:** add this to `vercel.json` and redeploy:

```json
{
  "crons": [{ "path": "/api/cron/prayer-notify", "schedule": "* * * * *" }]
}
```

External cron request:

```text
GET https://YOUR_DOMAIN/api/cron/prayer-notify
Authorization: Bearer YOUR_CRON_SECRET
```

## Prayer notifications on iOS and Android

Web Push only works reliably when:

1. **Location + method** are saved in Settings
2. Notification toggles are enabled for the prayers you want
3. You **install the PWA**
   - **iPhone (iOS 16.4+):** Safari → Share → **Add to Home Screen** → open SelfSync from the home screen icon → Settings → **Enable notifications** → Allow
   - **Android:** Chrome → menu → **Install app** / Add to Home screen → open installed app → Enable notifications
4. An every-minute cron is hitting `/api/cron/prayer-notify` with `CRON_SECRET`

Safari in a normal browser tab **cannot** receive Web Push on iOS. The home-screen app is required.

## App routes

| Path | Purpose |
|------|---------|
| `/login` | Password gate |
| `/` | Today tracker |
| `/history` | Calendar |
| `/history/[date]` | Edit a day |
| `/rewards` | Goals, streak, claim |
| `/settings` | Location, methods, push, rewards |
| `/api/cron/prayer-notify` | Cron sender |

## Docs

Product brief and schema summary: [`project.md`](project.md)
