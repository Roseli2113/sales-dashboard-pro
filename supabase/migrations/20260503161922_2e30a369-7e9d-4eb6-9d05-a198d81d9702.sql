REVOKE ALL ON FUNCTION public.video_exists(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_exists(uuid) TO anon, authenticated;