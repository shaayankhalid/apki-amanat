-- Allow browsing verified cases (for the /cases page).

create policy "Anyone can view verified cases"
  on public.cases for select
  using (status = 'Verified');

-- Donations table (used for funding progress on case cards).
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references auth.users on delete cascade not null,
  case_id uuid references public.cases on delete cascade not null,
  amount_pkr numeric not null check (amount_pkr > 0),
  created_at timestamptz default now() not null
);

alter table public.donations enable row level security;

create policy "Anyone can view donations for verified cases"
  on public.donations for select
  using (
    exists (
      select 1 from public.cases
      where cases.id = donations.case_id and cases.status = 'Verified'
    )
  );

create policy "Donors can insert own donations"
  on public.donations for insert
  with check (
    auth.uid() = donor_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'donor'
    )
  );

create policy "Donors can view own donations"
  on public.donations for select
  using (auth.uid() = donor_id);
