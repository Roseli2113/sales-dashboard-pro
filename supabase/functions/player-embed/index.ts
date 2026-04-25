// Public edge function that serves a JS file defining the <vplay-smartplayer> custom element
// for a specific video. Called via: /functions/v1/player-embed/<video_id>.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Path looks like /player-embed/<id>.js  (or /functions/v1/player-embed/<id>.js)
    const match = url.pathname.match(/([0-9a-fA-F-]{36})(?:\.js)?$/);
    const videoId = match?.[1];

    if (!videoId) {
      return new Response("// missing video id", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/javascript" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: video, error } = await supabase
      .from("videos")
      .select("id, file_url, name, autoplay_settings")
      .eq("id", videoId)
      .maybeSingle();

    if (error || !video || !video.file_url) {
      return new Response(`// video not found: ${videoId}`, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/javascript" },
      });
    }

    const safeUrl = JSON.stringify(video.file_url);
    const safeId = JSON.stringify(video.id);
    const autoplayList = Array.isArray(video.autoplay_settings)
      ? video.autoplay_settings
      : video.autoplay_settings
        ? [video.autoplay_settings]
        : [];
    const autoplay = {
      bgColor: "#000000",
      textColor: "#ffffff",
      pulse: false,
      detectInteraction: true,
      topText: "Seu vídeo já começou",
      bottomText: "Clique para ouvir",
      ...(autoplayList[0] ?? {}),
    };
    const safeAutoplay = JSON.stringify(autoplay);

    const js = `(function(){
  var VIDEO_URL = ${safeUrl};
  var VIDEO_ID = ${safeId};
  var AUTOPLAY = ${safeAutoplay};

  if (customElements.get("vplay-smartplayer")) return;

  class VPlaySmartPlayer extends HTMLElement {
    connectedCallback() {
      // Ensure host element is block-level and visible (WordPress/Elementor may strip styles)
      var host = this;
      host.style.display = "block";
      host.style.width = host.style.width || "100%";

      var wrap = document.createElement("div");
      // Use padding-bottom hack for 9:16 aspect ratio (works in Quirks Mode, unlike aspect-ratio CSS)
      wrap.style.cssText = "position:relative;width:100%;padding-bottom:177.78%;background:#000;border-radius:12px;overflow:hidden;cursor:pointer;";

      var video = document.createElement("video");
      video.src = VIDEO_URL;
      // No native controls — custom progress bar (non-seekable) for VSL
      video.controls = false;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.preload = "auto";
      video.muted = true;
      video.autoplay = true;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;display:block;";

      wrap.appendChild(video);

      // Unmute overlay (VSL style)
      var unmuteOverlay = document.createElement("div");
      unmuteOverlay.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;background:" + (AUTOPLAY.bgColor || "#000000") + ";color:" + (AUTOPLAY.textColor || "#ffffff") + ";font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;z-index:2;cursor:pointer;transition:opacity .25s;border-radius:10px;padding:16px 18px;min-width:160px;box-shadow:0 10px 30px rgba(0,0,0,.25);" + (AUTOPLAY.pulse ? "animation:vplayPulse 1.5s ease-in-out infinite;" : "");
      unmuteOverlay.innerHTML = '<style>@keyframes vplayPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.05)}}</style><div style="font-size:14px;font-weight:700;margin-bottom:8px;text-shadow:0 2px 8px rgba(0,0,0,.35);">' + (AUTOPLAY.topText || 'Seu vídeo já começou') + '</div>' +
        '<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">' +
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,.35);">' + (AUTOPLAY.bottomText || 'Clique para ouvir') + '</div>';
      wrap.appendChild(unmuteOverlay);

      function unmute() {
        video.currentTime = 0;
        video.muted = false;
        video.volume = 1;
        maxTime = 0;
        var p = video.play();
        if (p && p.catch) p.catch(function(){});
        unmuteOverlay.style.opacity = "0";
        setTimeout(function(){ unmuteOverlay.style.display = "none"; }, 300);
      }
      unmuteOverlay.addEventListener("click", unmute);

      // Custom progress bar (visible but NOT seekable)
      var progressWrap = document.createElement("div");
      progressWrap.style.cssText = "position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(255,255,255,0.18);z-index:3;pointer-events:none;";
      var progressBar = document.createElement("div");
      progressBar.style.cssText = "height:100%;width:0%;background:#ef4444;transition:width .2s linear;";
      progressWrap.appendChild(progressBar);
      wrap.appendChild(progressWrap);

      video.addEventListener("timeupdate", function() {
        if (video.duration && isFinite(video.duration)) {
          progressBar.style.width = ((video.currentTime / video.duration) * 100) + "%";
        }
      });

      // Block any seeking attempt — keep playhead at max watched position
      var maxTime = 0;
      video.addEventListener("timeupdate", function() {
        if (video.currentTime > maxTime) maxTime = video.currentTime;
      });
      video.addEventListener("seeking", function() {
        // Allow tiny drift; if user tries to jump ahead, snap back
        if (Math.abs(video.currentTime - maxTime) > 0.5) {
          video.currentTime = maxTime;
        }
      });

      // Click on video toggles play/pause (but not seek). If muted, click unmutes.
      video.addEventListener("click", function(e) {
        e.preventDefault();
        if (video.muted) { unmute(); return; }
        if (video.paused) video.play().catch(function(){}); else video.pause();
      });

      host.innerHTML = "";
      host.appendChild(wrap);

      // Try autoplay (muted is required by browsers)
      var ap = video.play();
      if (ap && ap.catch) ap.catch(function(){});

      // Per-second retention tracking (anonymous viewers)
      try {
        var SUPA_URL = ${JSON.stringify(supabaseUrl)};
        var SUPA_KEY = ${JSON.stringify(Deno.env.get("SUPABASE_ANON_KEY") ?? "")};
        var sessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
        var seen = new Set();
        var queue = [];
        var flushing = false;

        function flush() {
          if (flushing || queue.length === 0 || !SUPA_KEY) return;
          flushing = true;
          var batch = queue.splice(0, queue.length);
          fetch(SUPA_URL + "/rest/v1/video_watch_events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPA_KEY,
              "Authorization": "Bearer " + SUPA_KEY,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify(batch.map(function(s){
              return { video_id: VIDEO_ID, session_id: sessionId, second: s };
            })),
          }).catch(function(){}).finally(function(){ flushing = false; });
        }

        video.addEventListener("timeupdate", function() {
          var s = Math.floor(video.currentTime);
          if (!seen.has(s)) { seen.add(s); queue.push(s); }
        });
        setInterval(flush, 2000);
        window.addEventListener("beforeunload", flush);
      } catch(e) { /* ignore tracking errors */ }
    }
  }

  customElements.define("vplay-smartplayer", VPlaySmartPlayer);
})();`;

    return new Response(js, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(`// error: ${(e as Error).message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/javascript" },
    });
  }
});
