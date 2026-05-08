-- Closes Supabase advisor "public_bucket_allows_listing" on newsletter-assets.
-- A public bucket already allows direct URL access to images. The SELECT policy
-- on storage.objects additionally permits *listing* all files, which leaks
-- the inventory. We drop the public SELECT policy : object URLs continue to
-- resolve through the public bucket mechanism, but listing is now denied to
-- anonymous and authenticated users.

drop policy if exists "Anyone reads newsletter assets" on storage.objects;
