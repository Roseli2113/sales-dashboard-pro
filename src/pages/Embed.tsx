import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRetentionTracking } from "@/lib/retention";
import { useVideoEventTracking } from "@/lib/tracking";
import { CtaCard, normalizeCta, type CtaSettings } from "@/components/CtaCard";
import { getVideoLoadingProgress } from "../../supabase/functions/_shared/video-loading";

export default function Embed() {
  const { id } = useParams();
  const [url, setUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cta, setCta] = useState<CtaSettings | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
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
    if (!el || !url) return;
    const startedAt = performance.now();
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    setVideoReady(false);
    setLoadPct(1);
    const onTime = () => setCurrentTime(el.currentTime || 0);
    el.addEventListener("timeupdate", onTime);
    const onProgress = () => {
      if (finished) return;
      let end = 0;
      if (el.buffered.length) {
        for (let i = 0; i < el.buffered.length; i++) {
          if (el.buffered.start(i) <= el.currentTime && el.currentTime <= el.buffered.end(i)) { end = el.buffered.end(i); break; }
        }
      }
      const target = Number.isFinite(el.duration) && el.duration > 0 ? Math.min(3, el.duration) : 3;
      const pct = getVideoLoadingProgress(performance.now() - startedAt, el.readyState, Math.max(0, end - el.currentTime), target);
      setLoadPct(previous => Math.max(previous, pct));
      if (el.readyState >= 3) onReady();
    };
    const onReady = () => {
      if (finished) return;
      finished = true;
      clearInterval(progressTimer);
      setLoadPct(100);
      readyTimer = setTimeout(() => setVideoReady(true), 200);
    };
    const onError = () => {
      finished = true;
      clearInterval(progressTimer);
      setVideoReady(true);
    };
    const progressTimer = setInterval(onProgress, 200);
    el.addEventListener("progress", onProgress);
    el.addEventListener("loadedmetadata", onProgress);
    el.addEventListener("loadeddata", onProgress);
    el.addEventListener("canplay", onReady);
    el.addEventListener("playing", onReady);
    el.addEventListener("error", onError);
    onProgress();
    return () => {
      clearInterval(progressTimer);
      clearTimeout(readyTimer);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("loadedmetadata", onProgress);
      el.removeEventListener("loadeddata", onProgress);
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("playing", onReady);
      el.removeEventListener("error", onError);
    };
  }, [url]);

  const ringCirc = 2 * Math.PI * 28;

  return (
    <div style={{ margin: 0, padding: 0, background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {url ? (
        <>
          <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
            <video ref={ref} src={url} preload="auto" controls playsInline style={{ width: "100%", maxHeight: cta?.enabled ? "80vh" : "100vh", objectFit: "contain", background: "#000" }} />
            {!videoReady && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000", zIndex: 4 }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)", display: "block" }}>
                    <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.18)" strokeWidth="5" fill="none" />
                    <circle cx="32" cy="32" r="28" stroke="#ef4444" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - loadPct / 100)} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 700 }}>{loadPct}%</div>
                </div>
              </div>
            )}
          </div>

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
