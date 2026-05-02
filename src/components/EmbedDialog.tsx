import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoUrl?: string | null;
}

export function EmbedDialog({ open, onOpenChange, videoId, videoUrl }: EmbedDialogProps) {
  const [tab, setTab] = useState<"javascript" | "iframe">("javascript");
  const [responsive, setResponsive] = useState(false);
  const [optimize, setOptimize] = useState(true);

  const playerId = `vid-${videoId}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const playerScriptUrl = `${supabaseUrl}/functions/v1/player-embed/${videoId}.js`;
  const embedUrl = `${origin}/embed/${videoId}`;

  const jsCode = `<vplay-smartplayer id="${playerId}" data-video-id="${videoId}" data-responsive="${responsive ? "true" : "false"}" style="display: block; margin: 0 auto; width: 100%;${responsive ? " max-width: 960px;" : " max-width: 400px;"}"></vplay-smartplayer>
<script type="text/javascript">
  (function(){
    var SRC = "${playerScriptUrl}";
    if (document.querySelector('script[data-vplay-src="' + SRC + '"]')) return;
    var s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.setAttribute("data-vplay-src", SRC);
    document.head.appendChild(s);
  })();
</script>`;

  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="${responsive ? "auto" : "400"}" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;

  const speedCode = `<script>!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);</script>`;

  const code = tab === "javascript" ? jsCode : iframeCode;

  const copy = (text: string, label = "Código") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Embed</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Incorpore o vídeo onde quiser!{" "}
          <a href="#" className="text-primary hover:underline">Aprenda a incorporar seu vídeo.</a>
        </p>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-sm font-medium">Vídeo Responsivo</p>
            <p className="text-xs text-muted-foreground">Use versões diferentes para dispositivos mobile e desktop</p>
          </div>
          <Switch checked={responsive} onCheckedChange={setResponsive} />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Copie o Código de Embed</p>
              <p className="text-xs text-muted-foreground">Use o código abaixo para inserir o vídeo diretamente no seu site</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] rounded bg-success/20 text-success px-2 py-0.5 font-medium">Recomendado</span>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  onClick={() => setTab("javascript")}
                  className={`px-3 py-1 text-xs ${tab === "javascript" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setTab("iframe")}
                  className={`px-3 py-1 text-xs ${tab === "iframe" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  iFrame
                </button>
              </div>
            </div>
          </div>
          <div className="relative rounded-md border bg-muted/30 p-3">
            <pre className="text-[11px] overflow-x-auto text-foreground whitespace-pre-wrap break-all max-h-32">{code}</pre>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={() => copy(code)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Otimizar Velocidade de Carregamento</p>
              <p className="text-xs text-muted-foreground">Use o código de velocidade do VPlay para carregar o player mais rápido</p>
            </div>
            <Switch checked={optimize} onCheckedChange={setOptimize} />
          </div>

          {optimize && (
            <>
              <div className="mt-3 flex gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-foreground">
                  <strong>Instruções de uso:</strong> Cole o código abaixo na tag{" "}
                  <code className="rounded bg-muted px-1">&lt;head&gt;</code> do seu site. Ao fazer isso,
                  o VPlay vai carregar mais rápido na sua página 😊!
                </p>
              </div>
              <div className="relative mt-3 rounded-md border bg-muted/30 p-3">
                <pre className="text-[11px] overflow-x-auto text-foreground whitespace-pre-wrap break-all">{speedCode}</pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => copy(speedCode, "Código de velocidade")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => onOpenChange(false)} className="gradient-hero text-primary-foreground border-0">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
