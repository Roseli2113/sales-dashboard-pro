DROP POLICY IF EXISTS "Anyone can record valid watch events" ON public.video_watch_events;

CREATE OR REPLACE FUNCTION public.video_exists(_video_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.videos WHERE id = _video_id);
$$;

CREATE POLICY "Anyone can record valid watch events"
ON public.video_watch_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  second >= 0
  AND length(session_id) >= 8
  AND length(session_id) <= 64
  AND public.video_exists(video_id)
);