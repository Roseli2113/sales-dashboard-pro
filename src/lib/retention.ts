import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  const KEY = "vplay_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
      Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Attaches per-second watch tracking to a <video> element.
 * Records each unique whole second the viewer watches (deduped per session).
 */
export function useRetentionTracking(
  videoRef: React.RefObject<HTMLVideoElement>,
  videoId: string | undefined,
) {
  const sentRef = useRef<Set<number>>(new Set());
  const queueRef = useRef<number[]>([]);
  const flushTimer = useRef<number | null>(null);

  useEffect(() => {
    sentRef.current = new Set();
    queueRef.current = [];
  }, [videoId]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoId) return;
    const sessionId = getSessionId();

    const flush = async () => {
      flushTimer.current = null;
      const batch = queueRef.current.splice(0, queueRef.current.length);
      if (!batch.length) return;
      const rows = batch.map((second) => ({
        video_id: videoId,
        session_id: sessionId,
        second,
      }));
      await supabase
        .from("video_watch_events")
        .upsert(rows, { onConflict: "video_id,session_id,second", ignoreDuplicates: true });
    };

    const scheduleFlush = () => {
      if (flushTimer.current != null) return;
      flushTimer.current = window.setTimeout(flush, 2000);
    };

    const onTimeUpdate = () => {
      const sec = Math.floor(el.currentTime);
      if (!Number.isFinite(sec) || sec < 0) return;
      if (sentRef.current.has(sec)) return;
      sentRef.current.add(sec);
      queueRef.current.push(sec);
      scheduleFlush();
    };

    const onEnd = () => flush();

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("pause", onEnd);
    el.addEventListener("ended", onEnd);
    window.addEventListener("beforeunload", onEnd);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("pause", onEnd);
      el.removeEventListener("ended", onEnd);
      window.removeEventListener("beforeunload", onEnd);
      flush();
    };
  }, [videoRef, videoId]);
}

export type RetentionPoint = { time: string; second: number; retention: number; viewers: number };

/**
 * Builds a retention curve: % of unique sessions still watching at each second.
 */
export async function fetchRetentionCurve(
  videoId: string,
  durationSeconds: number,
): Promise<RetentionPoint[]> {
  const { data, error } = await supabase
    .from("video_watch_events")
    .select("session_id, second")
    .eq("video_id", videoId);

  if (error || !data) return [];

  const totalSessions = new Set(data.map((r) => r.session_id)).size;
  if (!totalSessions) return [];

  const counts = new Map<number, Set<string>>();
  for (const row of data) {
    if (!counts.has(row.second)) counts.set(row.second, new Set());
    counts.get(row.second)!.add(row.session_id);
  }

  const dur = Math.max(1, Math.floor(durationSeconds || 0));
  // Sample at most ~60 buckets for readability
  const step = Math.max(1, Math.ceil(dur / 60));
  const points: RetentionPoint[] = [];
  for (let s = 0; s <= dur; s += step) {
    // Viewers still present = unique sessions that have watched ANY second >= s
    let viewers = 0;
    const seen = new Set<string>();
    for (const [sec, sessions] of counts) {
      if (sec >= s) {
        for (const id of sessions) {
          if (!seen.has(id)) {
            seen.add(id);
            viewers++;
          }
        }
      }
    }
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    points.push({
      time: `${mm}:${ss}`,
      second: s,
      retention: (viewers / totalSessions) * 100,
      viewers,
    });
  }
  return points;
}
