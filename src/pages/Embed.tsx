import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRetentionTracking } from "@/lib/retention";
import { useVideoEventTracking } from "@/lib/tracking";
import { CtaCard, normalizeCta, type CtaSettings } from "@/components/CtaCard";

export default function Embed() {
  const { id } = useParams();
  const [url, setUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cta, setCta] = useState<CtaSettings | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);
  useRetentionTracking(ref, id);
  useVideoEventTracking(ref, id);

  useEffect(() => {
    if (!id) return;
    supabase.from("videos").select("file_url, cta_settings").eq("id", id).maybeSingle().then(({ data }) => {
      if (data?.file_url) {
        setUrl(data.file_url);
        setCta(normalizeCta((data as unknown as { cta_settings?: unknown }).cta_settings));
      } else setNotFound(true);
    });
  }, [id]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime || 0);
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [url]);

  return (
    <div style={{ margin: 0, padding: 0, background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {url ? (
        <>
          <video ref={ref} src={url} controls playsInline style={{ width: "100%", maxHeight: cta?.enabled ? "80vh" : "100vh", objectFit: "contain", background: "#000" }} />
          {cta && (
            <div style={{ width: "100%", maxWidth: 720, padding: "0 16px 16px" }}>
              <CtaCard cta={cta} videoId={id} currentTimeSeconds={currentTime} trackClick showDelayHint={false} />
            </div>
          )}
        </>
      ) : notFound ? (
        <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Vídeo não encontrado</p>
      ) : null}
    </div>
  );
}
