-- Admin support: profile fields, case statuses, and admin RLS policies.

alter table public.profiles
  add column if not exists email text,
  add column if not exists verification_status text not null default 'pending';

alter table public.profiles
  drop constraint if exists profiles_verification_status_check;

alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('pending', 'verified', 'suspended'));

-- Backfill email from auth.users for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Sync email on new signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, country, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', 'Pakistan'),
    coalesce(new.raw_user_meta_data->>'role', 'recipient'),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    country = coalesce(nullif(excluded.country, ''), public.profiles.country),
    role = coalesce(nullif(excluded.role, ''), public.profiles.role);
  return new;
end;
$$;

-- Allow Rejected status on cases
alter table public.cases
  drop constraint if exists cases_status_check;

alter table public.cases
  add constraint cases_status_check
  check (status in ('Pending', 'Verified', 'Rejected', 'Funded', 'Closed'));

-- Admin access helper (email must match logged-in JWT)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = lower('shaayankhalid@gmail.com'),
    false
  );
$$;

create policy "Admin can view all cases"
  on public.cases for select
  using (public.is_admin());

create policy "Admin can update all cases"
  on public.cases for update
  using (public.is_admin());

create policy "Admin can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admin can update all profiles"
  on public.profiles for update
  using (public.is_admin());
