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
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { fetchRetentionCurve, type RetentionPoint } from "@/lib/retention";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const sideMenu = [
  { label: "Detalhes", icon: VideoIcon, link: "" },
  { label: "Editar", icon: Pencil },
  { label: "Analytics", icon: BarChart3, active: true },
  { label: "Download", icon: Download },
  { label: "Remover", icon: Trash2, destructive: true },
];

const tabs = ["Retenção Geral", "Países", "Dispositivos", "Sistema Operacional", "Navegadores", "Origem do Tráfego"];

export default function VideoAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Tables<"videos"> | null>(null);
  const [metrics, setMetrics] = useState<Tables<"video_metrics">[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionPoint[]>([]);
  const [editingPitch, setEditingPitch] = useState(false);
  const [pitchInput, setPitchInput] = useState("0:00");
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [vRes, mRes] = await Promise.all([
        supabase.from("videos").select("*").eq("id", id).single(),
        supabase.from("video_metrics").select("*").eq("video_id", id).order("date", { ascending: false }).limit(30),
      ]);
      if (vRes.data) {
        setVideo(vRes.data);
        const pt = vRes.data.pitch_time_seconds ?? 0;
        setPitchInput(`${Math.floor(pt / 60)}:${String(pt % 60).padStart(2, "0")}`);
        const curve = await fetchRetentionCurve(id, vRes.data.duration_seconds ?? 60);
        setRetentionData(curve);
      }
      if (mRes.data) setMetrics(mRes.data);
    };
    load();
  }, [id]);

  const pitchSeconds = video?.pitch_time_seconds ?? 0;

  // Compute pitch retention dynamically: % retention at the pitch second based on the curve.
  const computedPitchRetention = (() => {
    if (!retentionData.length || !pitchSeconds) return 0;
    let closest = retentionData[0];
    for (const p of retentionData) {
      if (Math.abs(p.second - pitchSeconds) < Math.abs(closest.second - pitchSeconds)) closest = p;
    }
    return closest.retention;
  })();

  const pitchTimeLabel = `${Math.floor(pitchSeconds / 60)}:${String(pitchSeconds % 60).padStart(2, "0")}`;

  const parsePitchInput = (raw: string): number | null => {
    const m = raw.trim().match(/^(\d+):(\d{1,2})$/);
    let total = 0;
    if (m) {
      total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    } else if (/^\d+$/.test(raw.trim())) {
      total = parseInt(raw.trim(), 10);
    } else {
      return null;
    }
    return total;
  };

  const savePitchTime = async (silent = false) => {
    if (!id) return;
    const total = parsePitchInput(pitchInput);
    if (total === null) {
      toast.error("Formato inválido. Use mm:ss (ex: 4:00)");
      return;
    }
    const dur = video?.duration_seconds ?? 0;
    if (dur && total > dur) {
      toast.error(`Tempo maior que a duração do vídeo (${dur}s)`);
      return;
    }
    if ((video?.pitch_time_seconds ?? 0) === total) {
      setEditingPitch(false);
      return;
    }
    const { error } = await supabase.from("videos").update({ pitch_time_seconds: total }).eq("id", id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setVideo((v) => v ? { ...v, pitch_time_seconds: total } : v);
    setEditingPitch(false);
    if (!silent) toast.success("Tempo do pitch atualizado");
  };

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
    { value: `${computedPitchRetention.toFixed(2)}%`, label: "Retenção ao Pitch", isPitch: true },
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
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`pb-3 text-sm transition-colors ${i === activeTab ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 0 ? (
          <div className="mt-6 rounded-lg border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground text-right">Atualizado agora mesmo</p>
            <div className="relative h-[420px] overflow-hidden rounded-md bg-foreground/95">
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
                    {pitchSeconds > 0 && (
                      <ReferenceLine
                        x={pitchTimeLabel}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        label={{ value: `Pitch ${pitchTimeLabel}`, position: "top", fill: "hsl(var(--primary))", fontSize: 11 }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {retentionData.length === 0
                ? "📊 Sem dados de retenção ainda. Compartilhe o embed do vídeo — assim que alguém assistir, a curva real aparecerá aqui sobreposta ao vídeo."
                : "📊 O gráfico de retenção está sobreposto ao vídeo — assim você vê exatamente em que momento da VSL os espectadores abandonam."}
            </p>
          </div>
          ) : (
            <div className="mt-6 rounded-lg border bg-card p-10 text-center">
              <h3 className="text-lg font-semibold text-foreground">{tabs[activeTab]}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sem dados ainda. As estatísticas de <span className="font-medium">{tabs[activeTab].toLowerCase()}</span> aparecerão aqui assim que seus espectadores começarem a assistir o vídeo embedado.
              </p>
            </div>
          )}

          {activeTab === 0 && (
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
                  {m.isPitch && (
                    <div className="mt-2">
                      <button
                        onClick={() => setEditingPitch(true)}
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" />
                        {pitchSeconds > 0
                          ? `Pitch ${pitchTimeLabel} — ${computedPitchRetention.toFixed(2)}%`
                          : "Definir tempo"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      <Dialog open={editingPitch} onOpenChange={setEditingPitch}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tempo do Pitch</DialogTitle>
            <DialogDescription>
              Informe o momento exato do pitch no vídeo (formato mm:ss). O salvamento é automático ao sair do campo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={pitchInput}
              onChange={(e) => setPitchInput(e.target.value)}
              onBlur={() => savePitchTime(true)}
              placeholder="mm:ss (ex: 4:00)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") savePitchTime();
                if (e.key === "Escape") setEditingPitch(false);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Retenção calculada neste instante:{" "}
              <span className="font-medium text-foreground">
                {(() => {
                  const t = parsePitchInput(pitchInput);
                  if (t === null || !retentionData.length) return "—";
                  let closest = retentionData[0];
                  for (const p of retentionData) if (Math.abs(p.second - t) < Math.abs(closest.second - t)) closest = p;
                  return `${closest.retention.toFixed(2)}%`;
                })()}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPitch(false)}>Cancelar</Button>
            <Button onClick={() => savePitchTime()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
