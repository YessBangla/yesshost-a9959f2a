ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS file_path text;

CREATE POLICY "Admins can upload theme images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'theme-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update theme images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'theme-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete theme images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'theme-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage theme files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'theme-files' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'theme-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can download theme files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'theme-files');