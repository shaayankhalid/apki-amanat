-- Vendor product catalog for public store pages.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  price_pkr numeric not null check (price_pkr > 0),
  category text not null check (
    category in ('Medicine', 'Food', 'Grocery', 'Stationery', 'Other')
  ),
  in_stock boolean not null default true,
  created_at timestamptz default now() not null
);

create index if not exists products_vendor_id_idx on public.products(vendor_id);

alter table public.products enable row level security;

create policy "Vendors can view own products"
  on public.products for select
  using (
    exists (
      select 1 from public.vendors
      where vendors.id = products.vendor_id
        and vendors.profile_id = auth.uid()
    )
  );

create policy "Vendors can insert own products"
  on public.products for insert
  with check (
    exists (
      select 1 from public.vendors
      where vendors.id = products.vendor_id
        and vendors.profile_id = auth.uid()
    )
  );

create policy "Vendors can update own products"
  on public.products for update
  using (
    exists (
      select 1 from public.vendors
      where vendors.id = products.vendor_id
        and vendors.profile_id = auth.uid()
    )
  );

create policy "Vendors can delete own products"
  on public.products for delete
  using (
    exists (
      select 1 from public.vendors
      where vendors.id = products.vendor_id
        and vendors.profile_id = auth.uid()
    )
  );

create policy "Anyone can view in-stock products from verified vendors"
  on public.products for select
  using (
    in_stock = true
    and exists (
      select 1 from public.vendors
      where vendors.id = products.vendor_id
        and vendors.status = 'verified'
    )
  );
