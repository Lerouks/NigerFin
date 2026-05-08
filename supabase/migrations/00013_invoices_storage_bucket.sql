-- Create private bucket 'factures' for invoice PDFs.
-- Path convention: factures/{user_id}/FAC-YYYY-NNNN.pdf
-- Mirror of MCP-applied migration `invoices_storage_bucket`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'factures',
  'factures',
  false,
  5242880, -- 5 MB
  array['application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- RLS: users can read their own invoices (path starts with their user_id).
drop policy if exists "Users read their own invoices" on storage.objects;
create policy "Users read their own invoices" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'factures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all invoices.
drop policy if exists "Admins read all invoices" on storage.objects;
create policy "Admins read all invoices" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'factures'
    and exists (
      select 1 from public.user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );
