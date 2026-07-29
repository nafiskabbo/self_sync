-- SelfSync initial schema (single-tenant personal app)
-- Apply in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

-- App settings (exactly one row)
create table if not exists settings (
  id boolean primary key default true check (id),
  latitude double precision,
  longitude double precision,
  location_label text,
  timezone text not null default 'Asia/Dhaka',
  calculation_method text not null default 'Karachi',
  asr_madhab text not null default 'Shafi',
  notification_prefs jsonb not null default '{
    "fajr":{"start":true,"mid":true,"mid_time":null,"before_end_30":true},
    "dhuhr":{"start":true,"mid":true,"mid_time":null,"before_end_30":true},
    "asr":{"start":true,"mid":true,"mid_time":null,"before_end_30":true},
    "maghrib":{"start":true,"mid":true,"mid_time":null,"before_end_30":true},
    "isha":{"start":true,"mid":true,"mid_time":null,"before_end_30":true}
  }'::jsonb,
  week_reward_text text not null default 'Treat yourself — weekly win',
  month_reward_text text not null default 'Treat yourself — monthly win',
  week_goal_points int not null default 100,
  month_goal_points int not null default 400,
  points_per_item jsonb not null default '{
    "fajr":5,"dhuhr":5,"asr":5,"maghrib":5,"isha":5,"roja":10,
    "new_things_learnt":10,"diary_logged":5,"arabic_class":8,
    "public_speaking":8,"brainstorming":5,
    "watched_videos_eating":-5,"backbite":-8,"lie":-8,"mistakes":-3
  }'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists daily_entries (
  date date primary key,
  fajr boolean not null default false,
  dhuhr boolean not null default false,
  asr boolean not null default false,
  maghrib boolean not null default false,
  isha boolean not null default false,
  roja boolean not null default false,
  new_things_learnt boolean not null default false,
  learnt_note text,
  watched_videos_eating boolean not null default false,
  backbite boolean not null default false,
  lie boolean not null default false,
  mistakes boolean not null default false,
  diary_logged boolean not null default false,
  arabic_class boolean not null default false,
  public_speaking boolean not null default false,
  brainstorming boolean not null default false,
  notes text,
  points_earned int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rewards_claimed (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('week', 'month')),
  period_key text not null,
  reward_text text not null,
  points_at_claim int not null,
  claimed_at timestamptz not null default now(),
  unique (period_type, period_key)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists notification_sends (
  id uuid primary key default gen_random_uuid(),
  prayer text not null,
  kind text not null check (kind in ('start', 'mid', 'before_end_30')),
  scheduled_for timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (prayer, kind, scheduled_for)
);

alter table settings enable row level security;
alter table daily_entries enable row level security;
alter table rewards_claimed enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_sends enable row level security;

-- No anon policies: all access via service role from the Next.js server

insert into settings (id) values (true)
on conflict (id) do nothing;
