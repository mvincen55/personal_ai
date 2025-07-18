-- ===================================================================
-- SUPABASE SCHEMA - Mirror Dashboard v0
-- ===================================================================

-- Extensions (skip any that already exist)
create extension if not exists "pgcrypto";      -- UUID generator
create extension if not exists "vector";        -- pgvector for embeddings

-- USERS
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  daily_code    text not null unique,
  created_at    timestamptz not null default now()
);

-- KEYSTONE ACTIONS (one per day)
create table if not exists public.keystone_actions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users(id) on delete cascade,
  date           date not null,
  action_text    text not null,
  completed_bool boolean not null default false,
  created_at     timestamptz not null default now(),
  unique(user_id,date)
);

-- PHYSIO EVENTS (sleep, HRV, etc.)
create table if not exists public.physio_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  timestamp  timestamptz not null default now(),
  type       text not null,
  value_json jsonb not null
);

-- CALLOUTS (loop / mask / flare)
create table if not exists public.callouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  timestamp  timestamptz not null default now(),
  type       text not null check (type in ('loop','mask','flare')),
  content    text not null
);

-- VOICE TRANSCRIPTS / NOTES
create table if not exists public.voice_transcripts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  timestamp  timestamptz not null default now(),
  text       text not null,
  tags       text[] default '{}'
);

-- CHATGPT HISTORY CHUNKS
create table if not exists public.chat_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  chunk_text   text not null,
  embedding    vector(1536),          -- compatible with text-embedding-3-small
  tags         text[] default '{}',
  conv_start   timestamptz,
  conv_end     timestamptz,
  created_at   timestamptz not null default now()
);

-- CHATGPT HISTORY SUMMARIES
create table if not exists public.chat_history_summaries (
  id            uuid primary key default gen_random_uuid(),
  history_id    uuid references public.chat_history(id) on delete cascade,
  summary_text  text not null,
  embedding     vector(1536),
  created_at    timestamptz not null default now()
);

-- Indexes
create index if not exists idx_keystone_user_date            on public.keystone_actions(user_id,date);
create index if not exists idx_physio_user_type_time         on public.physio_events(user_id,type,timestamp desc);
create index if not exists idx_callouts_user_time            on public.callouts(user_id,timestamp desc);
create index if not exists idx_voice_user_time               on public.voice_transcripts(user_id,timestamp desc);
create index if not exists idx_chat_history_user_embedding   on public.chat_history using ivfflat (embedding);
create index if not exists idx_chat_history_summaries_embed  on public.chat_history_summaries using ivfflat (embedding);

-- RLS (wide-open dev mode; tighten later)
alter table public.users                 enable row level security;
alter table public.keystone_actions      enable row level security;
alter table public.physio_events         enable row level security;
alter table public.callouts              enable row level security;
alter table public.voice_transcripts     enable row level security;
alter table public.chat_history          enable row level security;
alter table public.chat_history_summaries enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "dev_all" on public.users;
drop policy if exists "dev_all" on public.keystone_actions;
drop policy if exists "dev_all" on public.physio_events;
drop policy if exists "dev_all" on public.callouts;
drop policy if exists "dev_all" on public.voice_transcripts;
drop policy if exists "dev_all" on public.chat_history;
drop policy if exists "dev_all" on public.chat_history_summaries;

create policy "dev_all" on public.users                    for all using (true) with check (true);
create policy "dev_all" on public.keystone_actions         for all using (true) with check (true);
create policy "dev_all" on public.physio_events            for all using (true) with check (true);
create policy "dev_all" on public.callouts                 for all using (true) with check (true);
create policy "dev_all" on public.voice_transcripts        for all using (true) with check (true);
create policy "dev_all" on public.chat_history             for all using (true) with check (true);
create policy "dev_all" on public.chat_history_summaries   for all using (true) with check (true);