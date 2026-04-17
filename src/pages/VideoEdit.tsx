import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  HelpCircle,
  Palette,
  Brain,
  Play as PlayIcon,
  Zap,
  Type,
  Filter,
  Volume2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Setting = {
  key: string;
  label: string;
  icon: typeof Palette;
  badge?: "novo" | "beta";
  defaultOn?: boolean;
};

const settings: Setting[] = [
  { key: "style", label: "Estilo", icon: Palette },
  { key: "smart_progress", label: "Progresso Inteligente", icon: Brain, defaultOn: true },
  { key: "smart_autoplay", label: "Smart Autoplay™", icon: PlayIcon, badge: "novo", defaultOn: true },
  { key: "turbo", label: "Turbo", icon: Zap, badge: "novo", defaultOn: true },
  { key: "headlines", label: "Headlines", icon: Type, badge: "novo" },
  { key: "traffic_filter", label: "Filtro de Tráfego", icon: Filter, badge: "beta" },
];

export default function VideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Tables<"videos"> | null>(null);
  const [active, setActive] = useState<string>("style");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.map((s) => [s.key, !!s.defaultOn])),
  );

  useEffect(() => {
    if (!id) return;
    supabase.from("videos").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setVideo(data);
    });
  }, [id]);

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* Left settings menu */}
        <div className="w-72 shrink-0">
          <button
            onClick={() => navigate(`/dashboard/video/${id}`)}
            className="mb-6 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao vídeo
          </button>

          <h2 className="mb-4 text-lg font-semibold text-foreground">Configurações de Vídeo</h2>

          <Button variant="outline" className="w-full justify-start gap-2 mb-4">
            <Upload className="h-4 w-4" />
            Carregar configurações
            <HelpCircle className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>

          <nav className="space-y-1 rounded-lg border bg-card p-2">
            {settings.map((s) => {
              const isOn = toggles[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active === s.key
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-left">{s.label}</span>
                  {s.badge && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 ${
                        s.badge === "novo"
                          ? "border-primary/30 text-primary"
                          : "border-accent/30 text-accent"
                      }`}
                    >
                      {s.badge}
                    </Badge>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isOn ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isOn ? "On" : "Off"}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right preview area */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {video?.name ?? "Carregando..."}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                {settings.find((s) => s.key === active) && (
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                    {settings.find((s) => s.key === active)?.label}
                  </Badge>
                )}
              </div>
            </div>
            {settings.find((s) => s.key === active)?.key !== "style" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ativar</span>
                <Switch
                  checked={toggles[active]}
                  onCheckedChange={(v) => setToggles((t) => ({ ...t, [active]: v }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div className="relative w-80 aspect-[9/16] rounded-xl bg-foreground/95 flex items-center justify-center overflow-hidden">
              {video?.file_url ? (
                <video
                  src={video.file_url}
                  className="h-full w-full object-contain"
                  muted
                  autoPlay
                  loop
                />
              ) : (
                <PlayIcon className="h-16 w-16 text-primary-foreground/40" />
              )}
              <div className="absolute inset-x-6 bottom-1/2 translate-y-1/2 flex flex-col items-center gap-2 rounded-lg bg-foreground/80 px-4 py-3 text-center text-primary-foreground">
                <span className="text-xs font-semibold">Seu vídeo já começou</span>
                <Volume2 className="h-6 w-6" />
                <span className="text-xs">Clique para ouvir</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
