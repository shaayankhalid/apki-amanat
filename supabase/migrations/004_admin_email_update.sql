-- Run this if 003_admin.sql was already applied with the previous admin email.

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
