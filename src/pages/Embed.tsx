import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRetentionTracking } from "@/lib/retention";

export default function Embed() {
  const { id } = useParams();
  const [url, setUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useRetentionTracking(ref, id);

  useEffect(() => {
    if (!id) return;
    supabase.from("videos").select("file_url").eq("id", id).maybeSingle().then(({ data }) => {
      if (data?.file_url) setUrl(data.file_url);
      else setNotFound(true);
    });
  }, [id]);

  return (
    <div style={{ margin: 0, padding: 0, background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {url ? (
        <video ref={ref} src={url} controls playsInline style={{ width: "100%", height: "100vh", objectFit: "contain", background: "#000" }} />
      ) : notFound ? (
        <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Vídeo não encontrado</p>
      ) : null}
    </div>
  );
}
