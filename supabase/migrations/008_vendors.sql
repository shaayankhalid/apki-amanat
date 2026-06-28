-- Vendor accounts: extend profiles role and create vendors table.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('donor', 'recipient', 'vendor'));

create table if not exists public.vendors (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  business_type text not null,
  business_address text not null,
  city text not null,
  status text not null default 'pending',
  created_at timestamptz default now() not null
);

alter table public.vendors enable row level security;

create policy "Vendors can view own profile"
  on public.vendors for select
  using (auth.uid() = profile_id);

create policy "Vendors can insert own profile"
  on public.vendors for insert
  with check (auth.uid() = profile_id);

create policy "Admin can view all vendors"
  on public.vendors for select
  using (public.is_admin());

create policy "Admin can update all vendors"
  on public.vendors for update
  using (public.is_admin());
