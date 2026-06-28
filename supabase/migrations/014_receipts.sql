-- Receipts for vendor store checkout orders.

create table if not exists public.receipts (
  id uuid default gen_random_uuid() primary key,
  donation_id uuid references public.donations(id),
  vendor_order_id uuid references public.vendor_orders(id),
  donor_id uuid references public.profiles(id),
  recipient_id uuid references public.profiles(id),
  vendor_id uuid references public.vendors(id),
  items jsonb not null default '[]'::jsonb,
  total_pkr numeric not null check (total_pkr > 0),
  status text not null default 'pending',
  created_at timestamptz default now() not null
);

alter table public.receipts enable row level security;

create policy "Donors can view own receipts"
  on public.receipts for select
  using (auth.uid() = donor_id);

create policy "Recipients can view own receipts"
  on public.receipts for select
  using (auth.uid() = recipient_id);

create policy "Donors can insert receipts"
  on public.receipts for insert
  with check (auth.uid() = donor_id);
