-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null check (char_length(path) <= 200),
  visitor text not null default 'Someone' check (char_length(visitor) <= 40),
  city text check (char_length(city) <= 100),
  country text check (char_length(country) <= 100),
  country_code text check (country_code ~ '^[a-z]{2}$')
);

alter table public.visits enable row level security;

-- Visitors may only add rows (and only these columns) and read them; never update or delete.
revoke all on public.visits from anon, authenticated;
grant select on public.visits to anon, authenticated;
grant insert (path, visitor, city, country, country_code) on public.visits to anon, authenticated;

drop policy if exists "anyone can log a visit" on public.visits;
create policy "anyone can log a visit" on public.visits for insert to anon, authenticated with check (true);

drop policy if exists "anyone can read visits" on public.visits;
create policy "anyone can read visits" on public.visits for select to anon, authenticated using (true);
