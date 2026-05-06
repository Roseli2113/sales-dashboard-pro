ALTER TABLE public.video_events
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS referrer text;

CREATE INDEX IF NOT EXISTS idx_video_events_video_id ON public.video_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_created_at ON public.video_events(created_at);

DROP POLICY IF EXISTS "Anyone can record valid video events" ON public.video_events;
CREATE POLICY "Anyone can record valid video events"
  ON public.video_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (event_type = ANY (ARRAY['view'::text, 'play'::text, 'pause'::text, 'complete'::text, 'button_click'::text]))
    AND (length(session_id) >= 8 AND length(session_id) <= 64)
    AND (current_time_seconds >= 0)
    AND video_exists(video_id)
  );