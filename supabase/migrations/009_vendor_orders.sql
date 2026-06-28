-- Vendor orders assigned to stores for fulfillment.

create table if not exists public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade not null,
  case_id uuid references public.cases(id) on delete set null,
  donation_id uuid references public.donations(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete set null,
  category text not null,
  items_needed text not null,
  amount_pkr numeric not null check (amount_pkr > 0),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  assigned_at timestamptz default now() not null,
  completed_at timestamptz
);

alter table public.vendor_orders enable row level security;

create policy "Vendors can view own orders"
  on public.vendor_orders for select
  using (
    exists (
      select 1 from public.vendors
      where vendors.id = vendor_orders.vendor_id
        and vendors.profile_id = auth.uid()
    )
  );

create policy "Vendors can update own orders"
  on public.vendor_orders for update
  using (
    exists (
      select 1 from public.vendors
      where vendors.id = vendor_orders.vendor_id
        and vendors.profile_id = auth.uid()
    )
  );

create policy "Admin can manage all vendor orders"
  on public.vendor_orders for all
  using (public.is_admin());
