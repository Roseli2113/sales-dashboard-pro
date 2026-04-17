import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, FolderPlus, Upload, Video, Eye, Code2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";
import { UploadVideoDialog } from "@/components/UploadVideoDialog";
import { EmbedDialog } from "@/components/EmbedDialog";
import { deleteVideo } from "@/lib/videos";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState<Tables<"videos">[]>([]);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Tables<"videos"> | null>(null);
  const [embedVideo, setEmbedVideo] = useState<Tables<"videos"> | null>(null);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteVideo(toDelete.id, toDelete.file_url);
      setVideos((vs) => vs.filter((v) => v.id !== toDelete.id));
      toast.success("Vídeo removido");
    } catch {
      toast.error("Erro ao remover vídeo");
    } finally {
      setToDelete(null);
    }
  };

  const loadVideos = async () => {
    if (!user) return;
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (data) setVideos(data);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [vRes, pRes] = await Promise.all([
        supabase.from("videos").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      if (vRes.data) setVideos(vRes.data);
      if (pRes.data) setProfile(pRes.data);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = videos.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const daysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 14;
  const playsLeft = profile ? profile.plays_limit - profile.plays_used : 3000;

  return (
    <DashboardLayout>
      {profile?.plan === "trial" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <span className="text-warning">⚠️</span>
          <span className="text-foreground">
            Restam <strong className="text-warning">{daysLeft} dias</strong> ou{" "}
            <strong className="text-warning">{playsLeft.toLocaleString("pt-BR")} plays</strong> para terminar seu período de teste.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Video className="h-6 w-6 text-muted-foreground" />
            Meus vídeos
          </h1>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <button className="border-b-2 border-primary pb-1 font-medium text-foreground">Biblioteca</button>
            <button className="pb-1 hover:text-foreground">Top vídeos</button>
            <button className="pb-1 hover:text-foreground">Lixeira</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 w-48" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm"><FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta</Button>
          <Button size="sm" className="gradient-hero text-primary-foreground border-0" onClick={() => setUploadOpen(true)}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
          <span>Nome</span>
          <span className="w-28 text-center">Criado em</span>
          <span className="w-20 text-center">Plays</span>
          <span className="w-20 text-center">Ações</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum vídeo encontrado. Faça upload do seu primeiro vídeo!
          </div>
        ) : (
          filtered.map((video) => (
            <div key={video.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center border-b last:border-0 px-4 py-3 hover:bg-secondary/50 transition-colors">
              <Link to={`/dashboard/video/${video.id}`} className="flex items-center gap-3 group">
                <div className="h-10 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Badge variant="outline" className="mb-0.5 text-[10px] border-primary/30 text-primary">{video.player_version}</Badge>
                  <p className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">{video.name}</p>
                </div>
              </Link>
              <span className="w-28 text-center text-sm text-muted-foreground">
                {new Date(video.created_at).toLocaleDateString("pt-BR")}
              </span>
              <span className="w-20 text-center text-sm text-card-foreground font-medium">{video.total_plays}</span>
              <div className="w-20 flex justify-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <Link to={`/dashboard/video/${video.id}`}><Eye className="h-3.5 w-3.5 text-muted-foreground" /></Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEmbedVideo(video)}>
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setToDelete(video)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
      <UploadVideoDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={loadVideos} />
      {embedVideo && (
        <EmbedDialog
          open={!!embedVideo}
          onOpenChange={(o) => !o && setEmbedVideo(null)}
          videoId={embedVideo.id}
          videoUrl={embedVideo.file_url}
        />
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vídeo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente "{toDelete?.name}" e o arquivo do storage. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
