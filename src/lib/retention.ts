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

export type RetentionPoint = {
  time: string;
  second: number;
  retention: number;
  viewers: number;
  totalViewers: number;
  dropOff: number;
};

export function formatRetentionTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

async function fetchAllWatchRows(videoId: string): Promise<Array<{ session_id: string; second: number }>> {
  const pageSize = 1000;
  const rows: Array<{ session_id: string; second: number }> = [];
  for (let from = 0; from < 100000; from += pageSize) {
    const { data, error } = await supabase
      .from("video_watch_events")
      .select("session_id, second")
      .eq("video_id", videoId)
      .range(from, from + pageSize - 1);
    if (error || !data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

async function fetchAllEventRows(videoId: string): Promise<Array<{
  session_id: string;
  event_type: string;
  current_time_seconds: number;
  duration_seconds: number;
}>> {
  const pageSize = 1000;
  const rows: Array<{ session_id: string; event_type: string; current_time_seconds: number; duration_seconds: number }> = [];
  for (let from = 0; from < 100000; from += pageSize) {
    const { data, error } = await supabase
      .from("video_events")
      .select("session_id, event_type, current_time_seconds, duration_seconds")
      .eq("video_id", videoId)
      .range(from, from + pageSize - 1);
    if (error || !data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

/**
 * Builds a retention curve: % of unique sessions still watching at each second.
 */
export async function fetchRetentionCurve(
  videoId: string,
  durationSeconds: number,
): Promise<RetentionPoint[]> {
  const watchRows = await fetchAllWatchRows(videoId);
  const eventRows = watchRows.length ? [] : await fetchAllEventRows(videoId);
  const sessionMaxSecond = new Map<string, number>();

  for (const row of watchRows) {
    sessionMaxSecond.set(row.session_id, Math.max(sessionMaxSecond.get(row.session_id) ?? 0, row.second));
  }

  for (const row of eventRows) {
    const observed = row.event_type === "complete"
      ? Math.max(row.current_time_seconds, row.duration_seconds || 0)
      : row.current_time_seconds;
    sessionMaxSecond.set(row.session_id, Math.max(sessionMaxSecond.get(row.session_id) ?? 0, observed));
  }

  const totalSessions = sessionMaxSecond.size;
  if (!totalSessions) return [];

  const maxObservedSecond = Math.max(...Array.from(sessionMaxSecond.values()), 0);
  const eventDuration = Math.max(...eventRows.map((row) => row.duration_seconds || 0), 0);
  const dur = Math.max(1, Math.floor(durationSeconds || 0), maxObservedSecond, eventDuration);
  const step = dur <= 180 ? 1 : dur <= 600 ? 5 : dur <= 1800 ? 15 : 30;
  const seconds = new Set<number>([0, dur]);
  for (let s = 0; s <= dur; s += step) seconds.add(s);

  const points: RetentionPoint[] = [];
  for (const s of Array.from(seconds).sort((a, b) => a - b)) {
    const viewers = Array.from(sessionMaxSecond.values()).filter((maxSecond) => maxSecond >= s).length;
    const retention = (viewers / totalSessions) * 100;
    points.push({
      time: formatRetentionTime(s),
      second: s,
      retention,
      viewers,
      totalViewers: totalSessions,
      dropOff: 100 - retention,
    });
  }
  return points;
}
