import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Video as VideoIcon,
  Pencil,
  BarChart3,
  Download,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const sideMenu = [
  { label: "Detalhes", icon: VideoIcon, link: "" },
  { label: "Editar", icon: Pencil },
  { label: "Analytics", icon: BarChart3, active: true },
  { label: "Download", icon: Download },
  { label: "Remover", icon: Trash2, destructive: true },
];

const retentionData = Array.from({ length: 33 }, (_, i) => ({
  time: `${String(Math.floor(i * 0.98)).padStart(2, "0")}:${String(Math.floor((i * 59) % 60)).padStart(2, "0")}`,
  retention: Math.max(5, 100 - i * 1.8 - Math.random() * 8),
}));

const tabs = ["Retenção Geral", "Países", "Dispositivos", "Sistema Operacional", "Navegadores", "Origem do Tráfego"];

export default function VideoAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Tables<"videos"> | null>(null);
  const [metrics, setMetrics] = useState<Tables<"video_metrics">[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [vRes, mRes] = await Promise.all([
        supabase.from("videos").select("*").eq("id", id).single(),
        supabase.from("video_metrics").select("*").eq("video_id", id).order("date", { ascending: false }).limit(30),
      ]);
      if (vRes.data) setVideo(vRes.data);
      if (mRes.data) setMetrics(mRes.data);
    };
    load();
  }, [id]);

  const totals = metrics.reduce(
    (acc, m) => ({
      views: acc.views + m.views,
      uniqueViews: acc.uniqueViews + m.unique_views,
      plays: acc.plays + m.plays,
      uniquePlays: acc.uniquePlays + m.unique_plays,
      playRate: m.play_rate ?? 0,
      pitchRetention: m.pitch_retention ?? 0,
      pitchAudience: acc.pitchAudience + (m.pitch_audience ?? 0),
      engagement: m.engagement ?? 0,
      buttonClicks: acc.buttonClicks + (m.button_clicks ?? 0),
      conversions: acc.conversions + (m.conversions ?? 0),
      conversionRate: m.conversion_rate ?? 0,
      revenue: acc.revenue + Number(m.revenue ?? 0),
    }),
    { views: 0, uniqueViews: 0, plays: 0, uniquePlays: 0, playRate: 0, pitchRetention: 0, pitchAudience: 0, engagement: 0, buttonClicks: 0, conversions: 0, conversionRate: 0, revenue: 0 }
  );

  const metricCards = [
    { value: String(totals.views), label: "Visualizações" },
    { value: String(totals.uniqueViews), label: "Visualizações Únicas" },
    { value: String(totals.plays), label: "Plays" },
    { value: String(totals.uniquePlays), label: "Plays Únicos" },
    { value: `${totals.playRate.toFixed(2)}%`, label: "Play Rate" },
    { value: `${totals.pitchRetention.toFixed(2)}%`, label: "Retenção ao Pitch" },
    { value: String(totals.pitchAudience), label: "Audiência do Pitch" },
    { value: `${totals.engagement.toFixed(2)}%`, label: "Engajamento" },
    { value: String(totals.buttonClicks), label: "Cliques no Botão" },
    { value: String(totals.conversions), label: "Conversões" },
    { value: `${totals.conversionRate.toFixed(2)}%`, label: "Taxa de Conversão" },
    { value: `R$ ${totals.revenue.toFixed(2).replace(".", ",")}`, label: "Receita" },
  ];

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <button onClick={() => navigate("/dashboard")} className="mb-6 flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar para meus vídeos
          </button>
          <nav className="space-y-1">
            {sideMenu.map((item) => (
              <button
                key={item.label}
                onClick={() => { if (item.link === "") navigate(`/dashboard/video/${id}`); }}
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
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/dashboard/video/${id}`)}>
                <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
              <h1 className="text-lg font-bold text-foreground">{video?.name ?? "Carregando..."}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Últimos 30 dias</span>
              <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="mt-4 border-b">
            <div className="flex gap-6">
              {tabs.map((tab, i) => (
                <button key={tab} className={`pb-3 text-sm transition-colors ${i === 0 ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground text-right">Atualizado agora mesmo</p>
            <div className="relative h-72 overflow-hidden rounded-md bg-foreground/95">
              {video?.file_url && (
                <video
                  src={video.file_url}
                  controls
                  className="absolute inset-0 h-full w-full object-contain opacity-60"
                />
              )}
              <div className="pointer-events-none absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={retentionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--background) / 0.2)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--background))" }} stroke="hsl(var(--background) / 0.4)" />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--background))" }} stroke="hsl(var(--background) / 0.4)" />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Retenção"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="retention" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#retGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              📊 O gráfico de retenção está sobreposto ao vídeo — assim você vê exatamente em que momento da VSL os espectadores abandonam.
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Métricas</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Eye className="mr-2 h-3.5 w-3.5" /> Visualização de Métricas</Button>
                <Button variant="outline" size="sm"><Download className="mr-2 h-3.5 w-3.5" /> Baixar Métricas</Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {metricCards.map((m) => (
                <div key={m.label} className="rounded-lg border bg-card p-4">
                  <p className="text-xl font-bold text-card-foreground">{m.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
