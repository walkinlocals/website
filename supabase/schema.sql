-- =============================================================================
-- Walk In — Consolidated Database Schema & Row Level Security Blueprint
-- Includes: Performance Indexes, Safe Metadata Casting, & Storage Overwrites
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create Clean Custom Types
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

-- Safely add 'Hold' to an existing match_status enum if it was created prior.
alter type match_status add value if not exists 'Hold';

-- ---------------------------------------------------------------------------
-- 2. Profiles Table & Safe Column Migrations
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  role          user_role,
  neighborhood  text,          -- Used primarily by Hosts
  origin_location text,        -- Used primarily by Guests
  bio           text,
  avatar_url    text,
  phone         text,          -- Private: Exposed selectively post-payment
  contact_email text,          -- Private: Exposed selectively post-payment
  id_verified   boolean not null default false, -- Stripe Identity verification state
  stripe_verification_session_id text,
  is_active     boolean not null default false, -- Active state when profile details are completed
  last_activity_at timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Backfill helper block to ensure columns exist on older instances safely
alter table public.profiles add column if not exists origin_location text;
alter table public.profiles add column if not exists neighborhood text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists id_verified boolean not null default false;
alter table public.profiles add column if not exists stripe_verification_session_id text;
alter table public.profiles add column if not exists is_active boolean not null default false;
alter table public.profiles add column if not exists last_activity_at timestamptz not null default now();

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Profiles Policies
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
-- 3. Automatic Profile Provisioning Trigger (Safe Casting)
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
-- 4. Matches Table & Migration Backfills
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null references public.profiles (id) on delete cascade,
  host_id     uuid not null references public.profiles (id) on delete cascade,
  initiator_id uuid references public.profiles (id) on delete cascade,
  status      match_status not null default 'Pending',
  party_size  int not null default 1 check (party_size between 1 and 5),
  stripe_link text,
  created_at  timestamptz not null default now(),
  constraint matches_guest_host_unique unique (guest_id, host_id)
);

-- Safe migration runs
alter table public.matches add column if not exists party_size int not null default 1;
alter table public.matches add column if not exists initiator_id uuid references public.profiles(id) on delete cascade;

-- Historical Initiator Fallback
update public.matches
set initiator_id = guest_id
where initiator_id is null;

-- Enable Row Level Security
alter table public.matches enable row level security;

-- Matches Policies
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

drop policy if exists "party updates own match" on public.matches;
create policy "party updates own match"
  on public.matches for update
  to authenticated
  using (auth.uid() = guest_id or auth.uid() = host_id)
  with check (auth.uid() = guest_id or auth.uid() = host_id);

-- ---------------------------------------------------------------------------
-- 5. Secure Messaging / Chat System Table
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.messages enable row level security;

-- Messages Security: Select & Insert require a Paid match relationship
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

-- ---------------------------------------------------------------------------
-- 6. Feedback Table (Public Inquiries)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.feedback enable row level security;

drop policy if exists "anyone can leave feedback" on public.feedback;
create policy "anyone can leave feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 7. Storage Bucket configuration
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar images are publicly readable" on storage.objects;
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 8. Secure RPC Self-Deletion Function
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

-- ---------------------------------------------------------------------------
-- 9. High-Performance Database Indexes
-- ---------------------------------------------------------------------------
-- Accelerates checks on active hosts/guests in public directories
create index if not exists idx_profiles_role_is_active
  on public.profiles (role, is_active)
  where is_active = true;

-- Accelerates dashboard updates and profile matching lists
create index if not exists idx_matches_guest_id_status
  on public.matches (guest_id, status);

create index if not exists idx_matches_host_id_status
  on public.matches (host_id, status);

-- Ensures historical chat loads instantly under order filters
create index if not exists idx_messages_match_id_created_at
  on public.messages (match_id, created_at desc);