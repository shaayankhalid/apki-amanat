alter table public.cases
  add column if not exists admin_notes text;

-- Allow admin to read all case documents in storage.
create policy "Admin can read all case documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'case-documents'
    and public.is_admin()
  );
