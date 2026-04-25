import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MoreVertical,
  Plus,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

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

type Autoplay = {
  id: string;
  name: string;
  layout: "template" | "personalizado";
  textColor: string;
  bgColor: string;
  pulse: boolean;
  detectInteraction: boolean;
  topText: string;
  bottomText: string;
  startSec: number;
  endSec: number;
};

const defaultAutoplay = (name = "Smart Autoplay"): Autoplay => ({
  id: crypto.randomUUID(),
  name,
  layout: "template",
  textColor: "#ffffff",
  bgColor: "#000000",
  pulse: false,
  detectInteraction: true,
  topText: "Seu vídeo já começou",
  bottomText: "Clique para ouvir",
  startSec: 0,
  endSec: 1939,
});

function normalizeAutoplays(raw: unknown): Autoplay[] {
  const value = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
  const normalized = value.map((item) => ({ ...defaultAutoplay(), ...(item as Partial<Autoplay>) }));
  return normalized.length ? normalized : [defaultAutoplay()];
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Tables<"videos"> | null>(null);
  const [active, setActive] = useState<string>("style");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.map((s) => [s.key, !!s.defaultOn])),
  );
  const [autoplays, setAutoplays] = useState<Autoplay[]>([defaultAutoplay()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hydratedRef = useRef(false);

  const editing = autoplays.find((a) => a.id === editingId) ?? null;

  function updateEditing(patch: Partial<Autoplay>) {
    if (!editing) return;
    setAutoplays((list) => list.map((a) => (a.id === editing.id ? { ...a, ...patch } : a)));
  }

  async function saveAutoplays(nextAutoplays = autoplays) {
    if (!id) return;
    setSaveStatus("saving");
    const { error } = await supabase
      .from("videos")
      .update({ autoplay_settings: nextAutoplays as unknown as Tables<"videos">["autoplay_settings"] })
      .eq("id", id);

    if (error) {
      setSaveStatus("idle");
      toast({ title: "Erro ao salvar Autoplay", description: error.message, variant: "destructive" });
      return;
    }

    setSaveStatus("saved");
  }

  useEffect(() => {
    if (!id) return;
    supabase.from("videos").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setVideo(data);
        setAutoplays(normalizeAutoplays(data.autoplay_settings));
        hydratedRef.current = true;
      }
    });
  }, [id]);

  useEffect(() => {
    if (!hydratedRef.current || !id) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(() => saveAutoplays(autoplays), 600);
    return () => window.clearTimeout(timer);
  }, [autoplays, id]);

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

          {editing ? (
            <AutoplayEditorSidebar
              autoplay={editing}
              onChange={updateEditing}
              onCancel={() => setEditingId(null)}
              onSave={() => {
                setEditingId(null);
                toast({ title: "Autoplay salvo" });
              }}
            />
          ) : active === "smart_autoplay" ? (
            <SmartAutoplaySidebar
              autoplays={autoplays}
              onBack={() => setActive("style")}
              onAdd={() => {
                const next = defaultAutoplay(`Smart Autoplay ${autoplays.length + 1}`);
                setAutoplays((l) => [...l, next]);
              }}
              onEdit={(aid) => setEditingId(aid)}
              onDuplicate={(aid) => {
                const src = autoplays.find((a) => a.id === aid);
                if (!src) return;
                setAutoplays((l) => [...l, { ...src, id: crypto.randomUUID(), name: `${src.name} (cópia)` }]);
              }}
              onRename={(aid) => {
                const src = autoplays.find((a) => a.id === aid);
                if (!src) return;
                setRenameTargetId(aid);
                setRenameValue(src.name);
                setRenameOpen(true);
              }}
              onRemove={(aid) => {
                setAutoplays((l) => (l.length > 1 ? l.filter((a) => a.id !== aid) : l));
              }}
            />
          ) : (
            <>
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
            </>
          )}
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
                {active === "smart_autoplay" && (
                  <span className="text-xs text-primary">Visualizando o Smart Autoplay</span>
                )}
              </div>
            </div>
            {settings.find((s) => s.key === active)?.key !== "style" && !editing && (
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
              {(active === "smart_autoplay" || editing) && (
                <div
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 rounded-lg px-4 py-3 text-center ${
                    editing?.pulse ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: editing?.bgColor ?? "#000000",
                    color: editing?.textColor ?? "#ffffff",
                  }}
                >
                  <span className="text-xs font-semibold">
                    {editing?.topText ?? "Seu vídeo já começou"}
                  </span>
                  <Volume2 className="h-6 w-6" />
                  <span className="text-xs">{editing?.bottomText ?? "Clique para ouvir"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Autoplay</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (renameTargetId && renameValue.trim()) {
                  setAutoplays((l) =>
                    l.map((a) => (a.id === renameTargetId ? { ...a, name: renameValue.trim() } : a)),
                  );
                }
                setRenameOpen(false);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ============ Sidebar list of autoplays ============
function SmartAutoplaySidebar({
  autoplays,
  onBack,
  onAdd,
  onEdit,
  onDuplicate,
  onRename,
  onRemove,
}: {
  autoplays: Autoplay[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar para customização
      </button>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlayIcon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Smart Autoplay™</h2>
        </div>
        <Badge className="bg-success/20 text-success border-0">on</Badge>
      </div>

      <a className="mb-4 block text-xs text-primary hover:underline" href="#">
        ⓘ Aprenda sobre Smart Autoplay™
      </a>

      <div className="space-y-2 mb-4">
        {autoplays.map((a) => (
          <div
            key={a.id}
            className="relative flex items-center gap-2 rounded-lg border bg-card p-2"
          >
            <div className="h-10 w-16 rounded bg-foreground/90 flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-primary-foreground/70" />
            </div>
            <span className="flex-1 text-sm text-foreground truncate">{a.name}</span>
            <Badge variant="outline" className="text-[10px] py-0 border-success/40 text-success">
              Ativo
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded p-1 hover:bg-secondary" aria-label="Opções">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(a.id)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(a.id)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(a.id)}>
                  <Type className="mr-2 h-4 w-4" /> Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemove(a.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Button onClick={onAdd} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Configurar Teste de Autoplay
      </Button>

      <p className="mt-4 text-xs text-muted-foreground">
        Adicione quantos Autoplay's diferentes você quiser, e o sistema irá mostrar cada um deles e ver qual está convertendo mais.
      </p>
    </div>
  );
}

// ============ Editor sidebar ============
function AutoplayEditorSidebar({
  autoplay,
  onChange,
  onCancel,
  onSave,
}: {
  autoplay: Autoplay;
  onChange: (patch: Partial<Autoplay>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <button onClick={onCancel} className="mb-4 flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar para Smart Autoplay
      </button>

      <div className="mb-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={onSave}>
          Salvar
        </Button>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Para criar um Teste Automático, crie outro Autoplay para escolhermos o melhor!
      </p>

      <div className="space-y-4">
        <div>
          <Label className="text-xs">Nome</Label>
          <Input value={autoplay.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs">Layout</Label>
          <p className="text-[11px] text-muted-foreground mb-2">
            Qual o layout do seu Autoplay? Escolha um Template pronto ou faça Upload de uma imagem ou GIF.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ layout: "template" })}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                autoplay.layout === "template" ? "border-primary text-primary" : "border-border"
              }`}
            >
              Template
            </button>
            <button
              onClick={() => onChange({ layout: "personalizado" })}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                autoplay.layout === "personalizado" ? "border-primary text-primary" : "border-border"
              }`}
            >
              Personalizado
            </button>
          </div>

          <div className="mt-3 rounded-md border bg-primary/10 p-3 text-center">
            <div className="mx-auto mb-2 inline-flex flex-col items-center gap-1 rounded bg-foreground/80 px-3 py-2 text-primary-foreground">
              <span className="text-[10px]">Seu vídeo já começou</span>
              <Volume2 className="h-4 w-4" />
              <span className="text-[10px]">Clique para ouvir</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full">
            Escolher outro template
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Cor do texto</Label>
          <input
            type="color"
            value={autoplay.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Cor de fundo</Label>
          <input
            type="color"
            value={autoplay.bgColor}
            onChange={(e) => onChange({ bgColor: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border"
          />
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Label className="text-xs">Fazer o Autoplay pulsar</Label>
          <Switch checked={autoplay.pulse} onCheckedChange={(v) => onChange({ pulse: v })} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              Detectar Interação <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Switch
              checked={autoplay.detectInteraction}
              onCheckedChange={(v) => onChange({ detectInteraction: v })}
            />
          </div>
          <p className="mt-1 text-[11px] text-destructive/80">
            Quando ativado, o vídeo inicia com áudio automaticamente após qualquer interação na página. Desative para que o áudio só inicie quando o usuário clicar para dar play.
          </p>
        </div>

        <div>
          <Label className="text-xs">Texto superior</Label>
          <Input
            value={autoplay.topText}
            maxLength={28}
            onChange={(e) => onChange({ topText: e.target.value })}
          />
          <div className="mt-1 text-right text-[10px] text-muted-foreground">
            {autoplay.topText.length} / 28
          </div>
        </div>

        <div>
          <Label className="text-xs">Texto Inferior</Label>
          <Input
            value={autoplay.bottomText}
            maxLength={28}
            onChange={(e) => onChange({ bottomText: e.target.value })}
          />
          <div className="mt-1 text-right text-[10px] text-muted-foreground">
            {autoplay.bottomText.length} / 28
          </div>
        </div>

        <div className="border-t pt-3">
          <Label className="text-xs flex items-center gap-1">
            Vídeo de Fundo <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </Label>
          <div className="mt-2 rounded-md border p-2">
            <div className="relative h-24 w-full rounded bg-foreground/80 flex items-center justify-center">
              <Badge className="absolute right-1 top-1 bg-background text-foreground text-[10px]">
                Padrão
              </Badge>
              <PlayIcon className="h-6 w-6 text-primary-foreground/60" />
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full">
            Alterar vídeo de fundo
          </Button>
        </div>

        <div className="border-t pt-3">
          <Label className="text-xs flex items-center gap-1">
            Definir minutagem <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </Label>
          <div className="mt-2 flex justify-between text-[10px]">
            <Badge className="bg-primary text-primary-foreground">{fmt(autoplay.startSec)}</Badge>
            <Badge className="bg-primary text-primary-foreground">{fmt(autoplay.endSec)}</Badge>
          </div>
          <Slider
            min={0}
            max={Math.max(autoplay.endSec, 60)}
            value={[autoplay.startSec, autoplay.endSec]}
            onValueChange={([s, e]) => onChange({ startSec: s, endSec: e })}
            className="my-3"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Início</Label>
              <Input
                value={fmt(autoplay.startSec)}
                onChange={(e) => {
                  const [m, s] = e.target.value.split(":").map(Number);
                  if (!isNaN(m) && !isNaN(s)) onChange({ startSec: m * 60 + s });
                }}
              />
            </div>
            <div>
              <Label className="text-[10px]">Fim</Label>
              <Input
                value={fmt(autoplay.endSec)}
                onChange={(e) => {
                  const [m, s] = e.target.value.split(":").map(Number);
                  if (!isNaN(m) && !isNaN(s)) onChange({ endSec: m * 60 + s });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
