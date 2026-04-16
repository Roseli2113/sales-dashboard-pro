import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Video as VideoIcon, Pencil, BarChart3, Download, Trash2, Monitor, Smartphone, Code2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const sideMenuItems = [
  { label: "Detalhes", icon: VideoIcon, active: true, link: null },
  { label: "Editar", icon: Pencil, link: null },
  { label: "Analytics", icon: BarChart3, link: "analytics" },
  { label: "Download", icon: Download, link: null },
  { label: "Remover", icon: Trash2, destructive: true, link: null },
];

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [video, setVideo] = useState<Tables<"videos"> | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("videos").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setVideo(data);
    });
  }, [id]);

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <button onClick={() => navigate("/dashboard")} className="mb-6 flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar para meus vídeos
          </button>
          <nav className="space-y-1">
            {sideMenuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => { if (item.link) navigate(`/dashboard/video/${id}/${item.link}`); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  item.active ? "bg-sidebar-accent text-primary font-medium"
                    : item.destructive ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{video?.name ?? "Carregando..."}</h1>
              <Badge variant="outline" className="mt-1 border-primary/30 text-primary text-xs">
                {video?.player_version ?? "PLAYER 2.0"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border p-0.5">
                <Button variant={device === "desktop" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setDevice("desktop")}>
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button variant={device === "mobile" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setDevice("mobile")}>
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              <Button className="gradient-hero text-primary-foreground border-0" size="sm">
                <Code2 className="mr-2 h-4 w-4" /> Embed
              </Button>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className={`rounded-xl bg-foreground/95 flex items-center justify-center ${device === "desktop" ? "w-full aspect-video" : "w-80 aspect-[9/16]"}`}>
              {video?.file_url ? (
                <video src={video.file_url} controls className="h-full w-full rounded-xl object-contain" />
              ) : (
                <div className="text-center text-primary-foreground/50">
                  <VideoIcon className="mx-auto h-16 w-16" />
                  <p className="mt-2 text-sm">Preview do vídeo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
