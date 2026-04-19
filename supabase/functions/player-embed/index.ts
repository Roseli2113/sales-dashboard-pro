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
      .select("id, file_url, name")
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

    const js = `(function(){
  var VIDEO_URL = ${safeUrl};
  var VIDEO_ID = ${safeId};

  if (customElements.get("vplay-smartplayer")) return;

  class VPlaySmartPlayer extends HTMLElement {
    connectedCallback() {
      // Ensure host element is block-level and visible (WordPress/Elementor may strip styles)
      host.style.display = "block";
      host.style.width = host.style.width || "100%";

      var wrap = document.createElement("div");
      // Use padding-bottom hack for 9:16 aspect ratio (works in Quirks Mode, unlike aspect-ratio CSS)
      wrap.style.cssText = "position:relative;width:100%;padding-bottom:177.78%;background:#000;border-radius:12px;overflow:hidden;";

      var video = document.createElement("video");
      video.src = VIDEO_URL;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      video.style.cssText = "width:100%;height:100%;object-fit:contain;background:#000;display:block;";

      wrap.appendChild(video);
      this.appendChild(wrap);

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
