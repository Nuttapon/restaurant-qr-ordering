-- Storage RLS policies for menu-images bucket
-- Public bucket allows reads; these policies enable authenticated writes

CREATE POLICY "public read menu images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'menu-images');

CREATE POLICY "auth upload menu images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "auth update menu images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'menu-images');

CREATE POLICY "auth delete menu images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'menu-images');
