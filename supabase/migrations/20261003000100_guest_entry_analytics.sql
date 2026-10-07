-- Lightweight analytics for browser-only Haneul Guest Mode.
-- Guests are NOT auth.users rows and cannot read this table.
create table if not exists public.haneul_guest_entries (
  id uuid primary key default gen_random_uuid(),
  guest_session_id uuid not null unique,
  guest_name text not null check (char_length(guest_name) between 3 and 64),
  landing_path text not null default '/' check (char_length(landing_path) between 1 and 200),
  entry_mode text not null default 'guest' check (entry_mode='guest'),
  created_at timestamptz not null default now()
);

create index if not exists haneul_guest_entries_created_at
  on public.haneul_guest_entries(created_at desc);

alter table public.haneul_guest_entries enable row level security;
revoke all on table public.haneul_guest_entries from public, anon, authenticated;
grant insert on table public.haneul_guest_entries to anon;

drop policy if exists haneul_guest_entries_anon_insert on public.haneul_guest_entries;
create policy haneul_guest_entries_anon_insert
on public.haneul_guest_entries
for insert to anon
with check (
  entry_mode='guest'
  and char_length(guest_name) between 3 and 64
  and char_length(landing_path) between 1 and 200
);
