import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CtaSettings = {
  enabled: boolean;
  label: string;
  url: string;
  bgColor: string;
  textColor: string;
  delaySeconds: number;
};

export const defaultCta: CtaSettings = {
  enabled: false,
  label: "Comprar agora",
  url: "",
  bgColor: "#22c55e",
  textColor: "#ffffff",
  delaySeconds: 0,
};

export function normalizeCta(raw: unknown): CtaSettings {
  if (!raw || typeof raw !== "object") return { ...defaultCta };
  return { ...defaultCta, ...(raw as Partial<CtaSettings>) };
}

type Props = {
  cta: CtaSettings;
  videoId?: string;
  currentTimeSeconds?: number;
  forcePreview?: boolean;
  trackClick?: boolean;
  className?: string;
};

export function CtaCard({ cta, videoId, currentTimeSeconds = 0, forcePreview, trackClick, className }: Props) {
  const [visible, setVisible] = useState(forcePreview ? true : cta.delaySeconds <= 0);

  useEffect(() => {
    if (forcePreview) { setVisible(true); return; }
    if (cta.delaySeconds <= 0) { setVisible(true); return; }
    setVisible(currentTimeSeconds >= cta.delaySeconds);
  }, [forcePreview, cta.delaySeconds, currentTimeSeconds]);

  if (!cta.enabled || !visible) return null;

  const handleClick = async (e: React.MouseEvent) => {
    if (!cta.url) { e.preventDefault(); return; }
    if (trackClick && videoId) {
      try {
        await supabase.from("video_events").insert({
          video_id: videoId,
          session_id: localStorage.getItem("vplay_session_id") ?? "",
          event_type: "button_click",
          current_time_seconds: Math.floor(currentTimeSeconds || 0),
          duration_seconds: 0,
        });
      } catch { /* ignore */ }
    }
  };

  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${className ?? ""}`}>
      <a
        href={cta.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block w-full rounded-md px-6 py-3 text-center text-base font-semibold transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: cta.bgColor, color: cta.textColor }}
      >
        {cta.label || "Ação"}
      </a>
    </div>
  );
}