CREATE TABLE public.video_watch_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  second INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_watch_events_video_second ON public.video_watch_events(video_id, second);
CREATE INDEX idx_watch_events_session ON public.video_watch_events(video_id, session_id);
CREATE UNIQUE INDEX idx_watch_events_unique ON public.video_watch_events(video_id, session_id, second);

ALTER TABLE public.video_watch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record watch events"
ON public.video_watch_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Owners can view watch events"
ON public.video_watch_events
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.videos
  WHERE videos.id = video_watch_events.video_id
    AND videos.user_id = auth.uid()
));