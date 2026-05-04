import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, Info, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoUrl?: string | null;
}

export function EmbedDialog({ open, onOpenChange, videoId }: EmbedDialogProps) {
  const [optimize, setOptimize] = useState(true);

  const playerId = `vid-${videoId}`;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const playerScriptUrl = `${supabaseUrl}/functions/v1/player-embed/${videoId}.js?v=20260504-v3-register-fix`;
  const playerTag = "vplay-smartplayer-v3";

  const desktopCode = `<${playerTag} id="${playerId}-desktop" data-video-id="${videoId}" data-aspect="16:9" style="display: block; margin: 0 auto; width: 100%; max-width: 960px;"></${playerTag}>
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

  const mobileCode = `<${playerTag} id="${playerId}-mobile" data-video-id="${videoId}" data-aspect="9:16" style="display: block; margin: 0 auto; width: 100%; max-width: 420px;"></${playerTag}>
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

  const speedCode = `<script>!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);</script>`;

  const copy = (text: string, label = "Código") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const EmbedCodeCard = ({
    title,
    description,
    code,
    icon: Icon,
  }: {
    title: string;
    description: string;
    code: string;
    icon: typeof Monitor;
  }) => (
    <div className="rounded-md border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => copy(code, title)}>
          <Copy className="mr-2 h-3.5 w-3.5" />
          Copiar
        </Button>
      </div>
      <div className="relative rounded-md border bg-muted/30 p-3">
        <pre className="max-h-40 whitespace-pre-wrap break-all text-[11px] text-foreground overflow-x-auto">{code}</pre>
      </div>
    </div>
  );

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

        <div className="border-t pt-4">
          <div className="mb-3">
            <div>
              <p className="text-sm font-medium">Copie o Código de Embed</p>
              <p className="text-xs text-muted-foreground">Escolha um script fixo para desktop horizontal ou para celular vertical</p>
            </div>
          </div>
          <div className="grid gap-3">
            <EmbedCodeCard
              title="Desktop / YouTube horizontal"
              description="Formato fixo 16:9 para páginas no computador, sem depender do modo responsivo"
              code={desktopCode}
              icon={Monitor}
            />
            <EmbedCodeCard
              title="Celular vertical"
              description="Formato fixo 9:16 para página mobile e vídeos em pé"
              code={mobileCode}
              icon={Smartphone}
            />
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
