
INSERT INTO storage.buckets (id, name, public) VALUES ('theme-images', 'theme-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read theme images" ON storage.objects FOR SELECT USING (bucket_id = 'theme-images');
