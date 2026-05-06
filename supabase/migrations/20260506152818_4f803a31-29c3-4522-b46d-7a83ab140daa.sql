
CREATE TABLE public.video_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  current_time_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_events_video_date ON public.video_events (video_id, created_at);
CREATE INDEX idx_video_events_session ON public.video_events (video_id, session_id, event_type);

ALTER TABLE public.video_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record valid video events"
ON public.video_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('view','play','pause','complete','button_click')
  AND length(session_id) BETWEEN 8 AND 64
  AND current_time_seconds >= 0
  AND public.video_exists(video_id)
);

CREATE POLICY "Owners can view video events"
ON public.video_events
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_events.video_id AND v.user_id = auth.uid()));

-- Aggregation function: recompute today's metrics for a video from raw events
CREATE OR REPLACE FUNCTION public.aggregate_video_metrics(_video_id UUID, _date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views INT := 0;
  v_unique_views INT := 0;
  v_plays INT := 0;
  v_unique_plays INT := 0;
  v_completes INT := 0;
  v_unique_completes INT := 0;
  v_button_clicks INT := 0;
  v_play_rate NUMERIC := 0;
  v_engagement NUMERIC := 0;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'view'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view'),
    COUNT(*) FILTER (WHERE event_type = 'play'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'play'),
    COUNT(*) FILTER (WHERE event_type = 'complete'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'complete'),
    COUNT(*) FILTER (WHERE event_type = 'button_click')
  INTO v_views, v_unique_views, v_plays, v_unique_plays, v_completes, v_unique_completes, v_button_clicks
  FROM public.video_events
  WHERE video_id = _video_id
    AND created_at::date = _date;

  IF v_unique_views > 0 THEN
    v_play_rate := ROUND((v_unique_plays::NUMERIC / v_unique_views::NUMERIC) * 100, 2);
  END IF;
  IF v_unique_plays > 0 THEN
    v_engagement := ROUND((v_unique_completes::NUMERIC / v_unique_plays::NUMERIC) * 100, 2);
  END IF;

  INSERT INTO public.video_metrics (
    video_id, date, views, unique_views, plays, unique_plays,
    play_rate, engagement, button_clicks
  ) VALUES (
    _video_id, _date, v_views, v_unique_views, v_plays, v_unique_plays,
    v_play_rate, v_engagement, v_button_clicks
  )
  ON CONFLICT (video_id, date) DO UPDATE SET
    views = EXCLUDED.views,
    unique_views = EXCLUDED.unique_views,
    plays = EXCLUDED.plays,
    unique_plays = EXCLUDED.unique_plays,
    play_rate = EXCLUDED.play_rate,
    engagement = EXCLUDED.engagement,
    button_clicks = EXCLUDED.button_clicks;
END;
$$;

-- Ensure unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS uniq_video_metrics_video_date ON public.video_metrics (video_id, date);

CREATE OR REPLACE FUNCTION public.trigger_aggregate_video_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.aggregate_video_metrics(NEW.video_id, NEW.created_at::date);
  RETURN NEW;
END;
$$;

CREATE TRIGGER video_events_aggregate
AFTER INSERT ON public.video_events
FOR EACH ROW EXECUTE FUNCTION public.trigger_aggregate_video_metrics();

-- Allow inserting metrics rows from the trigger context (SECURITY DEFINER) by also adding a server-side insert policy bypass
-- The trigger runs as DEFINER so it bypasses RLS; no extra policy needed for that path.
