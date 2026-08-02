-- Personal health profile, weight logs, daily points threshold, updated point defaults

alter table settings
  add column if not exists height_cm double precision,
  add column if not exists target_bmi double precision,
  add column if not exists first_step_bmi double precision,
  add column if not exists blood_donated_at date,
  add column if not exists blood_wait_days int not null default 90,
  add column if not exists daily_points_threshold int not null default 20;

-- Goal defaults: 200/week, 800/month (~4 weeks)
update settings
set
  week_goal_points = 200,
  month_goal_points = 800,
  points_per_item = coalesce(points_per_item, '{}'::jsonb) || '{
    "watched_videos_eating":-5,
    "backbite":-10,
    "lie":-10,
    "mistakes":-5
  }'::jsonb,
  updated_at = now()
where id = true;

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  weight_kg double precision not null check (weight_kg > 0 and weight_kg < 500),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weight_logs_date_idx on weight_logs (date desc);

alter table weight_logs enable row level security;
