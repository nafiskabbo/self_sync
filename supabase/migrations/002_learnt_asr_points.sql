-- SelfSync schema updates: learnt notes, asr madhab, points defaults, mid_time prefs

alter table settings
  add column if not exists asr_madhab text not null default 'Shafi';

alter table daily_entries
  add column if not exists learnt_note text;

-- Drop custom kind from notification_sends if present; mid covers custom mid clock
alter table notification_sends drop constraint if exists notification_sends_kind_check;
alter table notification_sends
  add constraint notification_sends_kind_check
  check (kind in ('start', 'mid', 'before_end_30'));

update settings
set
  points_per_item = '{
    "fajr":5,"dhuhr":5,"asr":5,"maghrib":5,"isha":5,"roja":10,
    "new_things_learnt":10,"diary_logged":5,"arabic_class":8,
    "public_speaking":8,"brainstorming":5,
    "watched_videos_eating":-5,"backbite":-8,"lie":-8,"mistakes":-3
  }'::jsonb,
  updated_at = now()
where id = true;
