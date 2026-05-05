INSERT INTO storage.buckets (id, name, public) VALUES ('autoplay-assets', 'autoplay-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autoplay assets are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'autoplay-assets');

CREATE POLICY "Users upload own autoplay assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'autoplay-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own autoplay assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'autoplay-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own autoplay assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'autoplay-assets' AND auth.uid()::text = (storage.foldername(name))[1]);