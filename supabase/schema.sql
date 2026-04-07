-- CoffeeClub Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables

-- Users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text not null default '',
  avatar_url text,
  bio text default '',
  location text default '',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users are viewable by everyone" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Machines
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  name text not null,
  brand text default '',
  type text default 'espresso' check (type in ('espresso', 'filter', 'both')),
  burr_size text default '',
  notes text default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.machines enable row level security;

create policy "Users can view own machines" on public.machines
  for select using (auth.uid() = user_id);

create policy "Users can manage own machines" on public.machines
  for all using (auth.uid() = user_id);

-- Grinders
create table public.grinders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  name text not null,
  brand text default '',
  burr_type text default 'conical' check (burr_type in ('flat', 'conical', 'blade')),
  notes text default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.grinders enable row level security;

create policy "Users can view own grinders" on public.grinders
  for select using (auth.uid() = user_id);

create policy "Users can manage own grinders" on public.grinders
  for all using (auth.uid() = user_id);

-- Beans
create table public.beans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  name text not null,
  roaster text default '',
  origin text default '',
  process text default 'washed' check (process in ('washed', 'natural', 'honey')),
  roast_level text default 'medium' check (roast_level in ('light', 'light-med', 'medium', 'medium-dark', 'dark')),
  tasting_notes text[] default '{}',
  stock_grams integer not null default 0,
  color text default '#B87340',
  is_active boolean not null default false,
  purchase_date date,
  roast_date date,
  created_at timestamptz not null default now()
);

alter table public.beans enable row level security;

create policy "Users can view own beans" on public.beans
  for select using (auth.uid() = user_id);

create policy "Users can manage own beans" on public.beans
  for all using (auth.uid() = user_id);

-- Brews
create table public.brews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  bean_id uuid references public.beans on delete set null,
  machine_id uuid references public.machines on delete set null,
  grinder_id uuid references public.grinders on delete set null,
  name text not null,
  brew_type text default 'espresso' check (brew_type in ('espresso', 'latte', 'flat white', 'filter', 'pour over', 'cold brew', 'other')),
  rating integer not null default 0 check (rating >= 0 and rating <= 3),
  dose_in_grams numeric,
  yield_out_grams numeric,
  brew_time_seconds integer,
  grind_setting text,
  tasting_notes text[] default '{}',
  photo_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.brews enable row level security;

create policy "Public brews viewable by everyone" on public.brews
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users can manage own brews" on public.brews
  for all using (auth.uid() = user_id);

-- Follows
create table public.follows (
  follower_id uuid not null references public.users on delete cascade,
  following_id uuid not null references public.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone" on public.follows
  for select using (true);

create policy "Users can manage own follows" on public.follows
  for all using (auth.uid() = follower_id);

-- Likes
create table public.likes (
  user_id uuid not null references public.users on delete cascade,
  brew_id uuid not null references public.brews on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brew_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone" on public.likes
  for select using (true);

create policy "Users can manage own likes" on public.likes
  for all using (auth.uid() = user_id);

-- Indexes for performance
create index idx_brews_user_id on public.brews (user_id, created_at desc);
create index idx_brews_public on public.brews (is_public, created_at desc) where is_public = true;
create index idx_follows_follower on public.follows (follower_id);
create index idx_follows_following on public.follows (following_id);
create index idx_likes_brew on public.likes (brew_id);
create index idx_beans_user_active on public.beans (user_id) where is_active = true;
create index idx_machines_user_active on public.machines (user_id) where is_active = true;
create index idx_grinders_user_active on public.grinders (user_id) where is_active = true;

-- Equipment Catalog (pre-built list of common coffee gear)
create table public.equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('grinder', 'espresso_machine', 'pour_over', 'immersion', 'kettle', 'scale', 'accessory')),
  brand text not null,
  model text not null,
  detail text default '',
  grind_range text,
  popularity_rank integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.equipment_catalog enable row level security;

create policy "Equipment catalog is viewable by everyone" on public.equipment_catalog
  for select using (true);

create index idx_catalog_type on public.equipment_catalog (type, popularity_rank);
create index idx_catalog_brand on public.equipment_catalog (brand);

-- Comments on brews
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  brew_id uuid not null references public.brews on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

create policy "Users can manage own comments" on public.comments
  for all using (auth.uid() = user_id);

create index idx_comments_brew on public.comments (brew_id, created_at);

-- Stories (ephemeral 24h content)
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  photo_url text,
  caption text default '',
  type text not null default 'general' check (type in ('brew', 'checkin', 'bean', 'general')),
  brew_id uuid references public.brews on delete set null,
  bean_id uuid references public.beans on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories enable row level security;

create policy "Non-expired stories are viewable by everyone" on public.stories
  for select using (expires_at > now());

create policy "Users can manage own stories" on public.stories
  for all using (auth.uid() = user_id);

create index idx_stories_user on public.stories (user_id, created_at desc);
create index idx_stories_active on public.stories (expires_at) where expires_at > now();

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'mention')),
  actor_id uuid not null references public.users on delete cascade,
  brew_id uuid references public.brews on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Authenticated can insert notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');

create index idx_notifications_user on public.notifications (user_id, read, created_at desc);

-- Bookmarks
create table public.bookmarks (
  user_id uuid not null references public.users on delete cascade,
  brew_id uuid not null references public.brews on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brew_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "Users can manage own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for brew photos
insert into storage.buckets (id, name, public) values ('brew-photos', 'brew-photos', true);

create policy "Anyone can view brew photos" on storage.objects
  for select using (bucket_id = 'brew-photos');

create policy "Authenticated users can upload brew photos" on storage.objects
  for insert with check (bucket_id = 'brew-photos' and auth.role() = 'authenticated');

create policy "Users can delete own brew photos" on storage.objects
  for delete using (bucket_id = 'brew-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Add preferred brew method to users
alter table public.users add column if not exists preferred_method text default '';
