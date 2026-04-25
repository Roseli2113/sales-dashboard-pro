ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS autoplay_settings jsonb NOT NULL DEFAULT '{"enabled":true,"name":"Smart Autoplay","layout":"template","textColor":"#ffffff","bgColor":"#000000","pulse":false,"detectInteraction":true,"topText":"Seu vídeo já começou","bottomText":"Clique para ouvir","startSec":0,"endSec":0}'::jsonb;

DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();