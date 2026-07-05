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
      .select("id, file_url, name, autoplay_settings, cta_settings")
      .eq("id", videoId)
      .maybeSingle();

    if (error || !video || !video.file_url) {
      return new Response(`// video not found: ${videoId}`, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/javascript" },
      });
    }

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
    const ctaDefaults = {
      enabled: false,
      label: "Comprar agora",
      url: "",
      bgColor: "#22c55e",
      textColor: "#ffffff",
      delaySeconds: 0,
    };
    const cta = { ...ctaDefaults, ...((video.cta_settings as Record<string, unknown> | null) ?? {}) };
    const initialConfig = {
      [video.id]: {
        url: video.file_url,
        autoplay,
        cta,
      },
    };

    const js = `(function(){
  // Prevent the whole IIFE from running twice when WordPress/Elementor injects the script
  // multiple times (would otherwise throw NotSupportedError on customElements.define)
  if (window.__VPLAY_SMARTPLAYER_CLASS__) {
    // Still seed config for this video so the already-defined element can render it
    window.__VPLAY_CONFIGS = window.__VPLAY_CONFIGS || {};
    var _seed = ${JSON.stringify(initialConfig)};
    for (var _k in _seed) { if (!window.__VPLAY_CONFIGS[_k]) window.__VPLAY_CONFIGS[_k] = _seed[_k]; }
    ["vplay-smartplayer", "vplay-smartplayer-v2", "vplay-smartplayer-v3"].forEach(function(tag){
      try {
        if (!customElements.get(tag)) {
          customElements.define(tag, class extends window.__VPLAY_SMARTPLAYER_CLASS__ {});
        }
      } catch(e){}
    });
    return;
  }
  var SUPA_URL = ${JSON.stringify(supabaseUrl)};
  var SUPA_KEY = ${JSON.stringify(Deno.env.get("SUPABASE_ANON_KEY") ?? "")};
  var FN_BASE = SUPA_URL + "/functions/v1/player-embed/";

  // Per-page registry of video configs (shared across all <vplay-smartplayer> instances)
  window.__VPLAY_CONFIGS = window.__VPLAY_CONFIGS || {};
  var seed = ${JSON.stringify(initialConfig)};
  for (var k in seed) { if (!window.__VPLAY_CONFIGS[k]) window.__VPLAY_CONFIGS[k] = seed[k]; }

  function fetchConfig(id) {
    if (window.__VPLAY_CONFIGS[id]) return Promise.resolve(window.__VPLAY_CONFIGS[id]);
    var pendingKey = "__pending_" + id;
    if (window.__VPLAY_CONFIGS[pendingKey]) return window.__VPLAY_CONFIGS[pendingKey];
    var p = fetch(FN_BASE + id + ".json", { headers: { "apikey": SUPA_KEY } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(cfg){ if (cfg) window.__VPLAY_CONFIGS[id] = cfg; return cfg; })
      .catch(function(){ return null; });
    window.__VPLAY_CONFIGS[pendingKey] = p;
    return p;
  }

  class VPlaySmartPlayer extends HTMLElement {
    connectedCallback() {
      var host = this;
      var videoId = host.getAttribute("data-video-id");
      if (!videoId) {
        // Fallback: parse video id from id attribute like "vid-<uuid>"
        var idAttr = host.id || "";
        var m = idAttr.match(/([0-9a-fA-F-]{36})/);
        if (m) videoId = m[1];
      }
      if (!videoId) {
        host.innerHTML = '<div style="padding:12px;color:#fff;background:#000;font-family:system-ui;">VPlay: data-video-id ausente</div>';
        return;
      }
      var self = this;
      fetchConfig(videoId).then(function(cfg){
        if (!cfg || !cfg.url) {
          host.innerHTML = '<div style="padding:12px;color:#fff;background:#000;font-family:system-ui;">VPlay: vídeo não encontrado</div>';
          return;
        }
        self._render(videoId, cfg.url, cfg.autoplay || {});
      });
    }
    _render(VIDEO_ID, VIDEO_URL, AUTOPLAY) {
      // Ensure host element is block-level and visible (WordPress/Elementor may strip styles)
      var host = this;
      var responsive = host.getAttribute("data-responsive") === "true";
      var explicitAspect = host.getAttribute("data-aspect"); // "16:9" or "9:16"
      function isDesktopViewport() {
        return !window.matchMedia || window.matchMedia("(min-width: 768px)").matches;
      }
      var aspectRatio = explicitAspect === "16:9" ? "16 / 9"
        : explicitAspect === "9:16" ? "9 / 16"
        : (responsive && isDesktopViewport() ? "16 / 9" : "9 / 16");

      // Host stays as a normal block in the page flow. Use !important for the
      // layout-critical properties because Elementor themes/plugins sometimes
      // ship broad mobile rules that override custom elements.
      host.style.setProperty("display", "block", "important");
      host.style.setProperty("position", "relative", "important");
      host.style.setProperty("width", host.style.width || "100%", "important");
      host.style.setProperty("height", "auto", "important");
      host.style.setProperty("min-height", "0", "important");
      host.style.setProperty("overflow", "visible", "important");
      host.style.setProperty("background", "transparent", "important");
      host.style.setProperty("border-radius", "0", "important");
      host.style.setProperty("z-index", "0", "important");
      host.style.setProperty("float", "none", "important");
      host.style.setProperty("clear", "both", "important");
      host.style.setProperty("transform", "none", "important");
      host.style.setProperty("contain", "none", "important");
      host.style.setProperty("isolation", "auto", "important");
      host.style.removeProperty("padding-top");
      host.style.removeProperty("padding-bottom");

      var existingSpacer = host.querySelector(".vplay-elementor-spacer");
      var wrap = existingSpacer || document.createElement("div");
      wrap.className = "vplay-elementor-spacer";
      wrap.style.cssText = "position:relative!important;display:block!important;width:100%!important;height:auto!important;background:#000!important;overflow:hidden!important;cursor:pointer!important;box-sizing:border-box!important;border-radius:12px!important;clear:both!important;z-index:0!important;";

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
      video.style.cssText = "position:relative!important;display:block!important;width:100%!important;max-width:100%!important;height:auto!important;aspect-ratio:" + aspectRatio + "!important;object-fit:cover!important;object-position:center top!important;background:#000!important;margin:0!important;float:none!important;clear:both!important;z-index:0!important;";

      wrap.appendChild(video);

      function applyAspect() {
        if (explicitAspect) {
          video.style.setProperty("aspect-ratio", explicitAspect === "16:9" ? "16 / 9" : "9 / 16", "important");
          video.style.setProperty("object-fit", "cover", "important");
          video.style.setProperty("object-position", "center top", "important");
          return;
        }
        if (responsive && isDesktopViewport()) {
          video.style.setProperty("aspect-ratio", "16 / 9", "important");
          video.style.setProperty("object-fit", "cover", "important");
          video.style.setProperty("object-position", "center top", "important");
          return;
        }
        if (!video.videoWidth || !video.videoHeight) return;
        video.style.setProperty("aspect-ratio", video.videoWidth + " / " + video.videoHeight, "important");
        video.style.setProperty("object-fit", "cover", "important");
        video.style.setProperty("object-position", "center center", "important");
      }
      video.addEventListener("loadedmetadata", applyAspect);
      var resizeTimer;
      function onResize(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(applyAspect, 80); }
      window.addEventListener("resize", onResize);

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

      // Engagement event tracking (view, play, pause, complete)
      try {
        var SUPA_URL2 = ${JSON.stringify(supabaseUrl)};
        var SUPA_KEY2 = ${JSON.stringify(Deno.env.get("SUPABASE_ANON_KEY") ?? "")};
        var sessionId2 = (window.__VPLAY_SESSION_ID = window.__VPLAY_SESSION_ID || ((crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random()));
        var fired = { view: false, play: false, complete: false };
        function sendEvt(type, ct) {
          if (!SUPA_KEY2) return;
          fetch(SUPA_URL2 + "/rest/v1/video_events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPA_KEY2,
              "Authorization": "Bearer " + SUPA_KEY2,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify([{
              video_id: VIDEO_ID,
              session_id: sessionId2,
              event_type: type,
              current_time_seconds: Math.max(0, Math.floor(ct || 0)),
              duration_seconds: Math.max(0, Math.floor(video.duration || 0)),
            }]),
          }).catch(function(){});
        }
        if (!fired.view) { fired.view = true; sendEvt("view", 0); }
        video.addEventListener("play", function(){
          if (!fired.play) { fired.play = true; sendEvt("play", video.currentTime); }
        });
        video.addEventListener("pause", function(){
          if (video.ended) return;
          sendEvt("pause", video.currentTime);
        });
        video.addEventListener("timeupdate", function(){
          if (fired.complete) return;
          if (video.duration && (video.currentTime / video.duration) >= 0.95) {
            fired.complete = true;
            sendEvt("complete", video.currentTime);
          }
        });
        video.addEventListener("ended", function(){
          if (!fired.complete) { fired.complete = true; sendEvt("complete", video.currentTime); }
        });
      } catch(e) { /* ignore tracking errors */ }
    }
  }

  window.__VPLAY_SMARTPLAYER_CLASS__ = VPlaySmartPlayer;
  ["vplay-smartplayer", "vplay-smartplayer-v2", "vplay-smartplayer-v3"].forEach(function(tag){
    try {
      if (!customElements.get(tag)) {
        customElements.define(tag, class extends VPlaySmartPlayer {});
      }
    } catch(e){}
  });
})();`;

    // If the request was for the JSON config (used by already-loaded script to fetch sibling videos)
    if (url.pathname.endsWith(".json")) {
      return new Response(JSON.stringify({ url: video.file_url, autoplay }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return new Response(js, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    return new Response(`// error: ${(e as Error).message}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/javascript" },
    });
  }
});
