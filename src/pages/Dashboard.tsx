import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, FolderPlus, Upload, Video, Eye, Code2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoItem {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: string;
  plays: number;
  playerVersion: string;
}

const mockVideos: VideoItem[] = [
  {
    id: "1",
    name: "TikTok Shop.mp4",
    thumbnail: "",
    createdAt: "15/04/2026",
    plays: 46,
    playerVersion: "Player 2.0",
  },
  {
    id: "2",
    name: "VSL Produto Digital.mp4",
    thumbnail: "",
    createdAt: "14/04/2026",
    plays: 128,
    playerVersion: "Player 2.0",
  },
  {
    id: "3",
    name: "Depoimento Cliente.mp4",
    thumbnail: "",
    createdAt: "12/04/2026",
    plays: 53,
    playerVersion: "Player 2.0",
  },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");

  const filtered = mockVideos.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Trial banner */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
        <span className="text-warning">⚠️</span>
        <span className="text-foreground">
          Restam <strong className="text-warning">14 dias</strong> ou{" "}
          <strong className="text-warning">2.979 plays</strong> para terminar seu período de teste.
        </span>
      </div>

      {/* Header */}
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
            <Input
              className="pl-9 w-48"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
          </Button>
          <Button size="sm" className="gradient-hero text-primary-foreground border-0">
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
          <span>Nome</span>
          <span className="w-28 text-center">Criado em</span>
          <span className="w-20 text-center">Plays</span>
          <span className="w-20 text-center">Ações</span>
        </div>
        {filtered.map((video) => (
          <div
            key={video.id}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center border-b last:border-0 px-4 py-3 hover:bg-secondary/50 transition-colors"
          >
            <Link to={`/dashboard/video/${video.id}`} className="flex items-center gap-3 group">
              <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                <Video className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Badge variant="outline" className="mb-0.5 text-[10px] border-primary/30 text-primary">
                  {video.playerVersion}
                </Badge>
                <p className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">
                  {video.name}
                </p>
              </div>
            </Link>
            <span className="w-28 text-center text-sm text-muted-foreground">{video.createdAt}</span>
            <span className="w-20 text-center text-sm text-card-foreground font-medium">{video.plays}</span>
            <div className="w-20 flex justify-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
