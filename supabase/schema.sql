-- =============================================================================
-- WalkIn Locals — Full Supabase Schema (run in SQL Editor)
-- =============================================================================
-- Safe to run on a fresh project OR an existing database (idempotent).
-- Paste the entire file into: Supabase Dashboard → SQL → New query → Run
--
-- Includes:
--   • Types, tables, RLS policies, triggers, RPCs, indexes
--   • Party size 1–6, inactivity warning column, Paid-status RLS guard
--   • Avatar storage bucket + scoped policies (no public listing)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Custom types
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('Guest', 'Host', 'Admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type match_status as enum ('Pending', 'Hold', 'Accepted', 'Denied', 'Paid');
  end if;
end $$;

alter type match_status add value if not exists 'Hold';

-- ---------------------------------------------------------------------------
-- 2. Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                              uuid primary key references auth.users (id) on delete cascade,
  first_name                      text,
  last_name                       text,
  full_name                       text,
  role                            user_role,
  neighborhood                    text,
  origin_location                 text,
  bio                             text,
  avatar_url                      text,
  phone                           text,
  contact_email                   text,
  id_verified                     boolean not null default false,
  age_verified                    boolean not null default false,
  date_of_birth                   date,
  stripe_verification_session_id  text,
  stripe_account_id               text,
  payouts_enabled                 boolean not null default false,
  is_active                       boolean not null default false,
  last_activity_at                timestamptz not null default now(),
  inactivity_warning_sent_at      timestamptz,
  latitude                        double precision,
  longitude                       double precision,
  created_at                      timestamptz not null default now()
);

-- Backfill columns on older databases
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role user_role;
alter table public.profiles add column if not exists neighborhood text;
alter table public.profiles add column if not exists origin_location text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists id_verified boolean not null default false;
alter table public.profiles add column if not exists age_verified boolean not null default false;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists stripe_verification_session_id text;
alter table public.profiles add column if not exists stripe_account_id text;
alter table public.profiles add column if not exists payouts_enabled boolean not null default false;
alter table public.profiles add column if not exists is_active boolean not null default false;
alter table public.profiles add column if not exists last_activity_at timestamptz not null default now();
alter table public.profiles add column if not exists inactivity_warning_sent_at timestamptz;
alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- Host neighbourhood → approximate map coordinates (privacy-safe centroids)
create or replace function public.sync_profile_coordinates()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'Host' and new.neighborhood is not null and trim(new.neighborhood) <> '' then
    case lower(trim(new.neighborhood))
      when 'ballsbridge' then new.latitude := 53.328; new.longitude := -6.229;
      when 'city centre' then new.latitude := 53.3498; new.longitude := -6.2603;
      when 'city center' then new.latitude := 53.3498; new.longitude := -6.2603;
      when 'clontarf' then new.latitude := 53.363; new.longitude := -6.201;
      when 'docklands' then new.latitude := 53.347; new.longitude := -6.24;
      when 'drumcondra' then new.latitude := 53.369; new.longitude := -6.256;
      when 'dun laoghaire' then new.latitude := 53.294; new.longitude := -6.136;
      when 'glasnevin' then new.latitude := 53.373; new.longitude := -6.272;
      when 'grand canal dock' then new.latitude := 53.341; new.longitude := -6.235;
      when 'howth' then new.latitude := 53.387; new.longitude := -6.067;
      when 'phibsborough' then new.latitude := 53.36; new.longitude := -6.272;
      when 'portobello' then new.latitude := 53.33; new.longitude := -6.265;
      when 'ranelagh' then new.latitude := 53.3255; new.longitude := -6.256;
      when 'rathmines' then new.latitude := 53.323; new.longitude := -6.265;
      when 'sandymount' then new.latitude := 53.335; new.longitude := -6.213;
      when 'smithfield' then new.latitude := 53.3477; new.longitude := -6.2783;
      when 'stoneybatter' then new.latitude := 53.3498; new.longitude := -6.2891;
      when 'temple bar' then new.latitude := 53.345; new.longitude := -6.2635;
      when 'terenure' then new.latitude := 53.308; new.longitude := -6.287;
      when 'the liberties' then new.latitude := 53.341; new.longitude := -6.279;
      else new.latitude := 53.3498; new.longitude := -6.2603;
    end case;
  else
    new.latitude := null;
    new.longitude := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_coordinates on public.profiles;
create trigger profiles_sync_coordinates
  before insert or update of neighborhood, role on public.profiles
  for each row execute function public.sync_profile_coordinates();

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users manage their own profile insert" on public.profiles;
create policy "users manage their own profile insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users can delete their own profile" on public.profiles;
create policy "users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3. Auto-provision profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  parsed_role text;
begin
  parsed_role := nullif(new.raw_user_meta_data ->> 'role', '');

  insert into public.profiles (id, role, contact_email)
  values (
    new.id,
    case
      when parsed_role in ('Guest', 'Host', 'Admin') then parsed_role::user_role
      else null
    end,
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Matches
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null references public.profiles (id) on delete cascade,
  host_id      uuid not null references public.profiles (id) on delete cascade,
  initiator_id uuid references public.profiles (id) on delete cascade,
  status       match_status not null default 'Pending',
  party_size   int not null default 1,
  stripe_link  text,
  created_at   timestamptz not null default now(),
  constraint matches_guest_host_unique unique (guest_id, host_id)
);

alter table public.matches add column if not exists party_size int not null default 1;
alter table public.matches add column if not exists initiator_id uuid references public.profiles (id) on delete cascade;
alter table public.matches add column if not exists stripe_link text;
alter table public.matches add column if not exists created_at timestamptz not null default now();
alter table public.matches add column if not exists proposed_date date;
alter table public.matches add column if not exists proposed_time text;
alter table public.matches add column if not exists date_proposed_by uuid references public.profiles (id) on delete set null;
alter table public.matches add column if not exists date_confirmed boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.matches'::regclass
      and conname = 'matches_proposed_time_check'
  ) then
    alter table public.matches
      add constraint matches_proposed_time_check
      check (proposed_time is null or proposed_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  end if;
end $$;

-- Widen party_size cap to 6 (drops any existing party_size check constraint)
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.matches'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%party_size%'
  loop
    execute format('alter table public.matches drop constraint if exists %I', c.conname);
  end loop;
end $$;

alter table public.matches
  add constraint matches_party_size_check check (party_size between 1 and 6);

update public.matches
set initiator_id = guest_id
where initiator_id is null;

alter table public.matches enable row level security;

drop policy if exists "see own matches" on public.matches;
create policy "see own matches"
  on public.matches for select
  to authenticated
  using (auth.uid() = guest_id or auth.uid() = host_id);

drop policy if exists "active verified participant creates request" on public.matches;
create policy "active verified participant creates request"
  on public.matches for insert
  to authenticated
  with check (
    status = 'Pending'
    and (auth.uid() = guest_id or auth.uid() = host_id)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active = true
    )
  );

-- Clients cannot set status to Paid (webhook uses service role)
drop policy if exists "party updates own match" on public.matches;
create policy "party updates own match"
  on public.matches for update
  to authenticated
  using (auth.uid() = guest_id or auth.uid() = host_id)
  with check (
    (auth.uid() = guest_id or auth.uid() = host_id)
    and status <> 'Paid'
  );

-- ---------------------------------------------------------------------------
-- 5. Messages (paid matches only)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "chat only unlocked post payment select" on public.messages;
create policy "chat only unlocked post payment select"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.status = 'Paid'
        and (auth.uid() = m.guest_id or auth.uid() = m.host_id)
    )
  );

drop policy if exists "chat only unlocked post payment insert" on public.messages;
create policy "chat only unlocked post payment insert"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.status = 'Paid'
        and (auth.uid() = m.guest_id or auth.uid() = m.host_id)
    )
  );

-- Enable realtime for matches + in-app chat (safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Feedback (contact form, reports, manual ID review requests)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "anyone can leave feedback" on public.feedback;
create policy "anyone can leave feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 7. Storage — avatars bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Remove broad SELECT policies that allow listing every file in the bucket
drop policy if exists "avatar images are publicly readable" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Give anon users access to view avatars" on storage.objects;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Allow public read access" on storage.objects;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'SELECT'
      and (
        qual::text like '%avatars%'
        or with_check::text like '%avatars%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users read own avatar" on storage.objects;
create policy "users read own avatar"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- 8. RPC — self-delete account
-- ---------------------------------------------------------------------------
create or replace function public.delete_self_user()
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_self_user() from public;
grant execute on function public.delete_self_user() to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_role_is_active
  on public.profiles (role, is_active)
  where is_active = true;

create index if not exists idx_profiles_inactivity_warning
  on public.profiles (last_activity_at)
  where is_active = true and inactivity_warning_sent_at is null;

create index if not exists idx_matches_guest_id_status
  on public.matches (guest_id, status);

create index if not exists idx_matches_host_id_status
  on public.matches (host_id, status);

create index if not exists idx_matches_host_proposed_date
  on public.matches (host_id, proposed_date)
  where proposed_date is not null and status in ('Accepted', 'Paid');

create index if not exists idx_messages_match_id_created_at
  on public.messages (match_id, created_at desc);

-- =============================================================================
-- Done. Verify with:
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles'
--   order by ordinal_position;
-- =============================================================================
