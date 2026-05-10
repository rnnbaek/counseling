-- 상담 아카이브 Supabase 테이블 설정
-- Supabase > SQL Editor에서 실행하세요

-- 1. 내담자
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_date date,
  status text default 'active' check (status in ('active', 'ended', 'paused')),
  presenting_issue text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 상담 회기
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  session_number integer not null,
  date date not null,
  content text,
  goals text,
  homework text,
  therapist_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 슈퍼비전
create table public.supervisions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id),
  session_id uuid references public.sessions(id),
  supervisor_name text,
  date date not null,
  content text,
  feedback text,
  action_items text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. 교육 게시글
create table public.education_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category text,
  content text,
  is_public boolean default false,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. 교육 파일 (Google Drive 링크 저장)
create table public.education_files (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.education_posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  drive_file_id text,
  file_type text check (file_type in ('pdf', 'audio', 'other')),
  transcript text,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.supervisions enable row level security;
alter table public.education_posts enable row level security;
alter table public.education_files enable row level security;

-- 내담자: 본인만
create policy "clients_owner" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 회기: 내담자 주인만
create policy "sessions_owner" on public.sessions
  for all using (
    exists (select 1 from public.clients where id = sessions.client_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clients where id = sessions.client_id and user_id = auth.uid())
  );

-- 슈퍼비전: 본인만
create policy "supervisions_owner" on public.supervisions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 교육 게시글: 공개글은 누구나, 본인은 전체
create policy "education_posts_public" on public.education_posts
  for select using (is_public = true);
create policy "education_posts_owner" on public.education_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 교육 파일: 공개파일은 누구나, 본인은 전체
create policy "education_files_public" on public.education_files
  for select using (is_public = true);
create policy "education_files_owner" on public.education_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
