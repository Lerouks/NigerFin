-- Public bucket for newsletter images (admin upload via editor).
-- Public so images are inline-loadable in emails AND on the public archive.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'newsletter-assets',
  'newsletter-assets',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone (including anon) can READ newsletter assets (it's a public bucket).
drop policy if exists "Anyone reads newsletter assets" on storage.objects;
create policy "Anyone reads newsletter assets" on storage.objects
  for select to public
  using (bucket_id = 'newsletter-assets');

-- Only admins can WRITE newsletter assets.
drop policy if exists "Admins upload newsletter assets" on storage.objects;
create policy "Admins upload newsletter assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'newsletter-assets'
    and exists (
      select 1 from public.user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

drop policy if exists "Admins update newsletter assets" on storage.objects;
create policy "Admins update newsletter assets" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'newsletter-assets'
    and exists (
      select 1 from public.user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );

drop policy if exists "Admins delete newsletter assets" on storage.objects;
create policy "Admins delete newsletter assets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'newsletter-assets'
    and exists (
      select 1 from public.user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );
