-- Add status column to donations for checkout flow.

alter table public.donations
  add column if not exists status text not null default 'pending';

alter table public.donations
  drop constraint if exists donations_status_check;

alter table public.donations
  add constraint donations_status_check
  check (status in ('pending', 'completed', 'failed', 'cancelled'));

-- Only verified donors can create donations.
drop policy if exists "Donors can insert own donations" on public.donations;

create policy "Verified donors can insert own donations"
  on public.donations for insert
  with check (
    auth.uid() = donor_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'donor'
        and verification_status = 'verified'
    )
  );
