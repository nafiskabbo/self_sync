-- Mosque bonus for each prayer: prayed = base points, mosque = +extra points

alter table daily_entries
  add column if not exists fajr_mosque boolean not null default false,
  add column if not exists dhuhr_mosque boolean not null default false,
  add column if not exists asr_mosque boolean not null default false,
  add column if not exists maghrib_mosque boolean not null default false,
  add column if not exists isha_mosque boolean not null default false;

-- Clear invalid mosque flags if prayer itself was never marked
update daily_entries
set
  fajr_mosque = fajr_mosque and fajr,
  dhuhr_mosque = dhuhr_mosque and dhuhr,
  asr_mosque = asr_mosque and asr,
  maghrib_mosque = maghrib_mosque and maghrib,
  isha_mosque = isha_mosque and isha
where
  (fajr_mosque and not fajr)
  or (dhuhr_mosque and not dhuhr)
  or (asr_mosque and not asr)
  or (maghrib_mosque and not maghrib)
  or (isha_mosque and not isha);

update settings
set
  points_per_item = coalesce(points_per_item, '{}'::jsonb) || '{
    "fajr_mosque": 5,
    "dhuhr_mosque": 5,
    "asr_mosque": 5,
    "maghrib_mosque": 5,
    "isha_mosque": 5
  }'::jsonb,
  updated_at = now()
where id = true;
