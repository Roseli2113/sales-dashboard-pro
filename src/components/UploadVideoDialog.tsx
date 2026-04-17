import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

export function UploadVideoDialog({ open, onOpenChange, onUploaded }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setName("");
    setFile(null);
    setProgress(0);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 524288000) {
      toast.error("Arquivo muito grande. Máximo 500MB.");
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;
      setProgress(70);

      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(path);

      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        name: name || file.name,
        file_url: publicUrl,
        status: "ready",
      });

      if (dbError) throw dbError;
      setProgress(100);

      toast.success("Vídeo enviado com sucesso!");
      onUploaded();
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar vídeo");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!uploading) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de vídeo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-name">Nome do vídeo</Label>
            <Input id="video-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha VSL" disabled={uploading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-file">Arquivo (MP4, WebM, MOV — máx 500MB)</Label>
            <Input id="video-file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/ogg" onChange={handleFileChange} disabled={uploading} />
            {file && <p className="text-xs text-muted-foreground">{file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
          </div>
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">Enviando... {progress}%</p>
            </div>
          )}
          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full gradient-hero text-primary-foreground border-0">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Enviando..." : "Enviar vídeo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
