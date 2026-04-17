DROP POLICY "Anyone can record watch events" ON public.video_watch_events;

CREATE POLICY "Anyone can record valid watch events"
ON public.video_watch_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  second >= 0
  AND length(session_id) BETWEEN 8 AND 64
  AND EXISTS (SELECT 1 FROM public.videos WHERE videos.id = video_watch_events.video_id)
);