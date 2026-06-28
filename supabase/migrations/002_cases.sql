-- Run this in your Supabase SQL Editor to set up the cases table and document storage.

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text not null check (category in ('Medicine', 'Food', 'School Fees', 'Wedding Expenses', 'Other')),
  description text not null,
  amount_pkr numeric not null check (amount_pkr > 0),
  location text not null,
  document_urls text[] default '{}' not null,
  status text not null default 'Pending' check (status in ('Pending', 'Verified', 'Funded', 'Closed')),
  created_at timestamptz default now() not null
);

alter table public.cases enable row level security;

create policy "Recipients can insert own cases"
  on public.cases for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'recipient'
    )
  );

create policy "Users can view own cases"
  on public.cases for select
  using (auth.uid() = user_id);

-- Storage bucket for case documents (private)
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

create policy "Recipients can upload own case documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Recipients can read own case documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
