-- Link donations to vendors and extend vendor_orders for the donate flow.

alter table public.donations
  add column if not exists vendor_id uuid references public.vendors(id);

alter table public.vendor_orders
  add column if not exists donor_id uuid references public.profiles(id);

alter table public.vendor_orders
  add column if not exists case_id uuid references public.cases(id);

-- Donors need to browse verified vendors when donating.
create policy "Anyone can view verified vendors"
  on public.vendors for select
  using (status = 'verified');

-- Verified donors create fulfillment orders at checkout.
create policy "Verified donors can insert vendor orders"
  on public.vendor_orders for insert
  with check (
    auth.uid() = donor_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'donor'
        and verification_status = 'verified'
    )
  );
