-- =============================================
-- ClubHouse — Complete Supabase Setup Script
-- Copy and paste this into the Supabase SQL Editor
-- =============================================

-- 1. Create profiles table mapped to auth.users
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text default 'member' check (role in ('admin', 'member')) not null
);

-- Turn on row level security
alter table profiles enable row level security;

-- Drop existing policies to prevent conflicts
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Users can insert own profile." on profiles;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Allow users to insert their own profile (needed for auto-promotion fallback)
create policy "Users can insert own profile." on profiles
  for insert with check (auth.uid() = id);

-- Trigger for automatically creating profile when auth.user is created
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text;
begin
  if new.email = 'krishnamoorthyk.cse@gmail.com' then
    assigned_role := 'admin';
  else
    assigned_role := 'member';
  end if;

  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', assigned_role)
  on conflict (id) do update set role = assigned_role;
  return new;
end;
$$ language plpgsql security definer;


drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create Events Table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  date timestamp with time zone not null,
  image_url text,
  category text default 'General' not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

alter table events enable row level security;

-- Drop existing overlapping policies to prevent conflicts
drop policy if exists "Events are viewable by everyone" on events;
drop policy if exists "Admins can insert events" on events;
drop policy if exists "Authenticated users can insert events" on events;
drop policy if exists "Admins can update events" on events;
drop policy if exists "Owners or Admins can update events" on events;
drop policy if exists "Admins can delete events" on events;
drop policy if exists "Owners or Admins can delete events" on events;

-- Public can view all events
create policy "Events are viewable by everyone" on events
  for select using (true);

-- CREATION: Admin can create events (checks BOTH profile role AND JWT email as fallback)
create policy "Admins can insert events" on events
  for insert with check (
    auth.uid() = created_by
    AND (
      (select role from public.profiles where id = auth.uid()) = 'admin'
      OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
    )
  );

-- MANAGEMENT: Admin can update events
create policy "Admins can update events" on events
  for update using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  );

-- DELETION: Admin can delete events
create policy "Admins can delete events" on events
  for delete using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  );

-- 3. Create RSVP Table
create table if not exists rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text check (status in ('GOING', 'NOT_GOING')) not null,
  created_at timestamp with time zone default now(),
  unique (event_id, user_id)
);

alter table rsvps enable row level security;

drop policy if exists "RSVPs are viewable by everyone" on rsvps;
drop policy if exists "Users can insert own RSVP" on rsvps;
drop policy if exists "Users can update own RSVP" on rsvps;

-- Public can view all RSVPs to count them
create policy "RSVPs are viewable by everyone" on rsvps
  for select using (true);

-- Authenticated users can insert their own RSVP
create policy "Users can insert own RSVP" on rsvps
  for insert with check (auth.uid() = user_id);

-- Authenticated users can update their own RSVP
create policy "Users can update own RSVP" on rsvps
  for update using (auth.uid() = user_id);

-- 4. Setup Realtime
alter publication supabase_realtime add table rsvps;
alter publication supabase_realtime add table events;

-- 5. Create Contacts Table
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

alter table contacts enable row level security;

drop policy if exists "Anyone can insert contact messages" on contacts;
drop policy if exists "Admins can view contact messages" on contacts;

-- Anyone can submit a contact form
create policy "Anyone can insert contact messages" on contacts
  for insert with check (true);

-- Only admins can view contact messages
create policy "Admins can view contact messages" on contacts
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  );

-- 6. Create Storage bucket for event images
insert into storage.buckets (id, name, public) 
values ('event-images', 'event-images', true)
on conflict do nothing;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Insert Access" on storage.objects;
drop policy if exists "Admin Update Access" on storage.objects;
drop policy if exists "Admin Delete Access" on storage.objects;

create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'event-images' );

create policy "Admin Insert Access"
on storage.objects for insert
with check (
  bucket_id = 'event-images' AND
  (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  )
);

create policy "Admin Update Access"
on storage.objects for update
using (
  bucket_id = 'event-images' AND
  (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  )
);

create policy "Admin Delete Access"
on storage.objects for delete
using (
  bucket_id = 'event-images' AND
  (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  )
);

-- =============================================
-- 7. ONE-TIME FIX: Force-promote admin profile
-- Run this ONCE to fix existing admin user
-- =============================================
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the admin user
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'krishnamoorthyk.cse@gmail.com' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Upsert the profile with admin role
    INSERT INTO public.profiles (id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Admin profile set for user %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found - they will be auto-promoted on first login';
  END IF;
END $$;
