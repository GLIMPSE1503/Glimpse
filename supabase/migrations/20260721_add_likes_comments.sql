-- Add like and comment tables for Glimpse

create extension if not exists pgcrypto;

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  glimpse_id uuid not null references public.glimpses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists likes_glimpse_user_key on public.likes(glimpse_id, user_id);
create index if not exists likes_glimpse_id_idx on public.likes(glimpse_id);
create index if not exists likes_user_id_idx on public.likes(user_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  glimpse_id uuid not null references public.glimpses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_full_name text,
  user_avatar_url text,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_glimpse_id_idx on public.comments(glimpse_id);
create index if not exists comments_user_id_idx on public.comments(user_id);
create index if not exists comments_created_at_idx on public.comments(created_at desc);

alter table public.likes enable row level security;
alter table public.comments enable row level security;

create policy "Allow select likes" on public.likes for select using (true);
create policy "Allow insert own like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Allow delete own like" on public.likes for delete using (auth.uid() = user_id);

create policy "Allow select comments" on public.comments for select using (true);
create policy "Allow insert own comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Allow delete own comment" on public.comments for delete using (auth.uid() = user_id);
