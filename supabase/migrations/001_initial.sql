-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- People (relationship threads)
create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.people enable row level security;

create policy "Users can manage own people"
  on public.people for all using (auth.uid() = user_id);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  hidden boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Users can manage own messages"
  on public.messages for all using (auth.uid() = user_id);

create index messages_person_id_created_at on public.messages (person_id, created_at);

-- Summaries
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.summaries enable row level security;

create policy "Users can manage own summaries"
  on public.summaries for all using (auth.uid() = user_id);

-- Profile insights
create table public.profile_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  text text not null,
  created_at timestamptz default now() not null
);

alter table public.profile_insights enable row level security;

create policy "Users can manage own insights"
  on public.profile_insights for all using (auth.uid() = user_id);

-- Account links (for future linked-account feature)
create table public.account_links (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now() not null,
  unique(requester_id, recipient_id)
);

alter table public.account_links enable row level security;

create policy "Users can view own account links"
  on public.account_links for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can create account link requests"
  on public.account_links for insert with check (auth.uid() = requester_id);

create policy "Recipients can update link status"
  on public.account_links for update using (auth.uid() = recipient_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
