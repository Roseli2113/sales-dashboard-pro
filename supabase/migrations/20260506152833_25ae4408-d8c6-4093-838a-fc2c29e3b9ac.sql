
REVOKE EXECUTE ON FUNCTION public.aggregate_video_metrics(UUID, DATE) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trigger_aggregate_video_metrics() FROM anon, authenticated, public;
