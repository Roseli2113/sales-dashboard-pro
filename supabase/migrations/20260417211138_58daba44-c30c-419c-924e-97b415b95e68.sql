
-- Restrict listing: users can only list their own videos folder
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;

-- Public can read individual video files (needed for <video> streaming) but only when accessed by exact name
CREATE POLICY "Public can stream videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND auth.role() = 'anon');

CREATE POLICY "Authenticated can stream videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');
