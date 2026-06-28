-- Product images stored in public Supabase Storage bucket.

alter table public.products
  add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "Vendors can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.vendors
      where vendors.profile_id = auth.uid()
        and vendors.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Vendors can update own product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.vendors
      where vendors.profile_id = auth.uid()
        and vendors.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Vendors can delete own product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.vendors
      where vendors.profile_id = auth.uid()
        and vendors.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Anyone can view product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');
