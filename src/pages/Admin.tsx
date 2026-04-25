import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Eye, Lock, Trash2, Users, Crown, Activity, Link as LinkIcon } from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  funnels: number;
  created_at: string;
  videos: Array<{ id: string; name: string; file_url: string | null; total_plays: number; created_at: string; status: string }>;
};

type WebhookRow = { id: string; provider: string; webhook_url: string; secret_hint: string | null; is_active: boolean };

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-webhook`;

  const stats = useMemo(() => {
    const countPlan = (plan: string) => users.filter((u) => u.plan?.toLowerCase() === plan).length;
    return {
      total: users.length,
      pro: countPlan("pro"),
      premium: countPlan("premium"),
      trial: users.filter((u) => ["trial", "teste", "teste gratuito"].includes((u.plan ?? "").toLowerCase())).length,
    };
  }, [users]);

  const loadAdminData = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-api", { method: "GET" });
    if (error) toast.error("Erro ao carregar área admin");
    else setUsers((data as { users: AdminUser[] }).users ?? []);

    const { data: webhookData } = await (supabase as any).from("payment_webhooks").select("*").order("created_at", { ascending: false });
    setWebhooks(webhookData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
    const channel = supabase.channel("vplay-online-users");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const adminAction = async (action: "block" | "unblock" | "delete", userId: string) => {
    const { error } = await supabase.functions.invoke(`admin-api?action=${action}`, { body: { userId } });
    if (error) toast.error("Ação não concluída");
    else {
      toast.success(action === "delete" ? "Usuário excluído" : "Status atualizado");
      loadAdminData();
    }
  };

  const saveWebhook = async () => {
    const { error } = await (supabase as any).from("payment_webhooks").insert({ provider: "custom", webhook_url: webhookUrl, secret_hint: "Configure esta URL na plataforma de pagamento" });
    if (error) toast.error("Erro ao salvar webhook");
    else {
      toast.success("URL/Webhook salvo");
      loadAdminData();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Área Admin</h1>
          <p className="text-sm text-muted-foreground">Controle usuários, planos e integrações de pagamento.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard icon={Users} label="Total de usuários" value={stats.total} />
          <MetricCard icon={Crown} label="Plano PRÓ" value={stats.pro} />
          <MetricCard icon={Crown} label="Plano PREMIUM" value={stats.premium} />
          <MetricCard icon={Users} label="Teste gratuito" value={stats.trial} />
          <MetricCard icon={Activity} label="Online agora" value={onlineUsers} />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="webhook">URL/Webhook</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Funis</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell><Badge variant={user.status === "blocked" ? "destructive" : "outline"}>{user.status === "blocked" ? "Bloqueado" : "Ativo"}</Badge></TableCell>
                    <TableCell>{user.plan}</TableCell>
                    <TableCell>{user.funnels}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setSelected(user)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => adminAction(user.status === "blocked" ? "unblock" : "block", user.id)}><Lock className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => adminAction("delete", user.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="webhook" className="mt-4 space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <Label>URL/Webhook para plataformas de pagamento</Label>
              <div className="mt-2 flex gap-2">
                <Input value={webhookUrl} readOnly />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(webhookUrl).then(() => toast.success("URL copiada"))}><Copy className="mr-2 h-4 w-4" /> Copiar</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Envie eventos com email do comprador e plano start/pro/premium para liberar acesso automático.</p>
              <Button className="mt-4" onClick={saveWebhook}><LinkIcon className="mr-2 h-4 w-4" /> Salvar URL/Webhook</Button>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-semibold text-foreground">Webhooks cadastrados</h2>
              <div className="mt-3 space-y-2">
                {webhooks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum webhook salvo.</p> : webhooks.map((w) => (
                  <div key={w.id} className="rounded-md border p-3 text-sm"><strong>{w.provider}</strong> — {w.webhook_url}</div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Funil completo de {selected?.name}</DialogTitle></DialogHeader>
          <Textarea readOnly className="min-h-24" value={`Nome: ${selected?.name ?? ""}\nEmail: ${selected?.email ?? ""}\nPlano: ${selected?.plan ?? ""}\nFunis: ${selected?.funnels ?? 0}`} />
          <div className="space-y-2">
            {selected?.videos.length ? selected.videos.map((video) => (
              <div key={video.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium text-foreground">{video.name}</div>
                <div className="text-muted-foreground">Plays: {video.total_plays} • Status: {video.status}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Este usuário ainda não tem funis/vídeos.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
