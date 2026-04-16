import { useParams, useNavigate } from "react-router-dom";
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
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const metrics = [
  { value: "46", label: "Visualizações" },
  { value: "29", label: "Visualizações Únicas" },
  { value: "28", label: "Plays" },
  { value: "24", label: "Plays Únicos" },
  { value: "82,76%", label: "Play Rate" },
  { value: "23,08%", label: "Retenção ao Pitch" },
  { value: "6", label: "Audiência do Pitch" },
  { value: "23,34%", label: "Engajamento" },
  { value: "0", label: "Cliques no Botão" },
  { value: "0", label: "Conversões" },
  { value: "0,00%", label: "Taxa de Conversão" },
  { value: "R$ 0,00", label: "Receita" },
];

const tabs = ["Retenção Geral", "Países", "Dispositivos", "Sistema Operacional", "Navegadores", "Origem do Tráfego"];

export default function VideoAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* Side menu */}
        <div className="w-56 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-6 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para meus vídeos
          </button>
          <nav className="space-y-1">
            {sideMenu.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.link === "") navigate(`/dashboard/video/${id}`);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  item.active
                    ? "bg-sidebar-accent text-primary font-medium"
                    : item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/dashboard/video/${id}`)}>
                <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
              <h1 className="text-lg font-bold text-foreground">TikTok Shop.mp4</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>15/04/2026 - 16/04/2026</span>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b">
            <div className="flex gap-6">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  className={`pb-3 text-sm transition-colors ${
                    i === 0
                      ? "border-b-2 border-primary font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Retention Chart */}
          <div className="mt-6 rounded-lg border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground text-right">Atualizado agora mesmo</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={retentionData}>
                  <defs>
                    <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(220, 10%, 46%)"
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Retenção"]}
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 13%, 91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="retention"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    fill="url(#retGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Métricas</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-3.5 w-3.5" /> Visualização de Métricas
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3.5 w-3.5" /> Baixar Métricas
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {metrics.map((m) => (
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
