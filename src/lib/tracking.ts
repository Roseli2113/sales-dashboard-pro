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

async function sendEvent(
  videoId: string,
  sessionId: string,
  eventType: "view" | "play" | "pause" | "complete" | "button_click",
  currentTime: number,
  duration: number,
) {
  await supabase.from("video_events").insert({
    video_id: videoId,
    session_id: sessionId,
    event_type: eventType,
    current_time_seconds: Math.max(0, Math.floor(currentTime || 0)),
    duration_seconds: Math.max(0, Math.floor(duration || 0)),
  });
}

/**
 * Tracks engagement events on a <video> element:
 * view (once per session), play, pause, complete (>=95% watched).
 */
export function useVideoEventTracking(
  videoRef: React.RefObject<HTMLVideoElement>,
  videoId: string | undefined,
) {
  const firedRef = useRef<{ view: boolean; play: boolean; complete: boolean }>({
    view: false,
    play: false,
    complete: false,
  });

  useEffect(() => {
    firedRef.current = { view: false, play: false, complete: false };
  }, [videoId]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoId) return;
    const sessionId = getSessionId();

    // Fire 'view' as soon as the player is mounted
    if (!firedRef.current.view) {
      firedRef.current.view = true;
      sendEvent(videoId, sessionId, "view", 0, el.duration || 0);
    }

    const onPlay = () => {
      if (!firedRef.current.play) {
        firedRef.current.play = true;
        sendEvent(videoId, sessionId, "play", el.currentTime, el.duration || 0);
      }
    };
    const onPause = () => {
      if (el.ended) return;
      sendEvent(videoId, sessionId, "pause", el.currentTime, el.duration || 0);
    };
    const onTimeUpdate = () => {
      if (firedRef.current.complete) return;
      if (el.duration && el.currentTime / el.duration >= 0.95) {
        firedRef.current.complete = true;
        sendEvent(videoId, sessionId, "complete", el.currentTime, el.duration);
      }
    };
    const onEnded = () => {
      if (!firedRef.current.complete) {
        firedRef.current.complete = true;
        sendEvent(videoId, sessionId, "complete", el.currentTime, el.duration || 0);
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, [videoRef, videoId]);
}