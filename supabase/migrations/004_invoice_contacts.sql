-- Saved From / Client contacts for the invoice tool

create table if not exists invoice_contacts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('from', 'client')),
  name text not null,
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoice_contacts_kind_name_idx
  on invoice_contacts (kind, name);

alter table invoice_contacts enable row level security;

-- Seed defaults (idempotent by name+kind)
insert into invoice_contacts (kind, name, email, phone, address)
select
  'from',
  'Sardar Ashraful Islam Dip',
  'ashdip9@gmail.com',
  '',
  'C/O:MD. MOJIBUR RAHMAN SARKER, FLAT-, 9/A,335/5,MAYESHA TOWER,AHMED NAGAR,PAIKPARA,DIG ROAD,MIRPUR-1,DHAKA'
where not exists (
  select 1 from invoice_contacts
  where kind = 'from' and name = 'Sardar Ashraful Islam Dip'
);

insert into invoice_contacts (kind, name, email, phone, address)
select
  'client',
  'Navraj Singh',
  'raj.singhgoraya@outlook.com',
  '',
  '27 lancaster street, Dianella, Western Australia, Australia 6059'
where not exists (
  select 1 from invoice_contacts
  where kind = 'client' and name = 'Navraj Singh'
);
