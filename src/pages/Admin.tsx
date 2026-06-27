import { useEffect, useMemo, useState } from "react";
import { DashboardLayout, useOnlineUsers } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Eye, Lock, Trash2, Users, Crown, Activity, Link as LinkIcon, ShoppingCart, DollarSign } from "lucide-react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

type SaleRow = { id: string; provider: string; event_type: string | null; customer_email: string | null; plan: string | null; created_at: string; raw_payload: any };

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const onlineUsers = useOnlineUsers();
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

    const { data: salesData } = await (supabase as any).from("payment_events").select("*").order("created_at", { ascending: false }).limit(500);
    setSales(salesData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const adminAction = async (action: "block" | "unblock" | "delete", userId: string) => {
    const { error } = await supabase.functions.invoke(`admin-api?action=${action}`, { body: { userId } });
    if (error) toast.error("Ação não concluída");
    else {
      toast.success(action === "delete" ? "Usuário excluído" : "Status atualizado");
      loadAdminData();
    }
  };

  const setUserPlan = async (userId: string, plan: string) => {
    const { error } = await supabase.functions.invoke(`admin-api?action=set_plan`, { body: { userId, plan } });
    if (error) toast.error("Erro ao mudar plano");
    else {
      toast.success("Plano atualizado");
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
            <TabsTrigger value="sales">Vendas</TabsTrigger>
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
                    <TableCell>
                      <Select value={user.plan} onValueChange={(v) => setUserPlan(user.id, v)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Teste</SelectItem>
                          <SelectItem value="start">Start</SelectItem>
                          <SelectItem value="pro">Pró</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
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

          <TabsContent value="sales" className="mt-4 space-y-4">
            <SalesPanel sales={sales} loading={loading} />
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

function extractAmount(raw: any): string {
  if (!raw) return "-";
  const paths = [
    raw?.amount,
    raw?.total,
    raw?.value,
    raw?.data?.amount,
    raw?.data?.object?.amount_total,
    raw?.data?.object?.amount,
    raw?.transaction?.amount,
  ];
  for (const v of paths) {
    if (v != null && v !== "") {
      const num = typeof v === "number" ? v : parseFloat(String(v));
      if (!isNaN(num)) {
        const value = num > 1000 ? num / 100 : num;
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      }
    }
  }
  return "-";
}

function extractAmountNumber(raw: any): number {
  if (!raw) return 0;
  const paths = [raw?.amount, raw?.total, raw?.value, raw?.data?.amount, raw?.data?.object?.amount_total, raw?.data?.object?.amount, raw?.transaction?.amount];
  for (const v of paths) {
    if (v != null && v !== "") {
      const num = typeof v === "number" ? v : parseFloat(String(v));
      if (!isNaN(num)) return num > 1000 ? num / 100 : num;
    }
  }
  return 0;
}

function SalesPanel({ sales, loading }: { sales: SaleRow[]; loading: boolean }) {
  const [emailQuery, setEmailQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"created_at" | "amount" | "plan">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => { if (s.event_type) set.add(s.event_type); });
    return Array.from(set).sort();
  }, [sales]);

  const filtered = useMemo(() => {
    const q = emailQuery.trim().toLowerCase();
    const start = startDate ? new Date(startDate + "T00:00:00").getTime() : null;
    const end = endDate ? new Date(endDate + "T23:59:59").getTime() : null;
    return sales.filter((s) => {
      if (q && !(s.customer_email ?? "").toLowerCase().includes(q)) return false;
      if (planFilter !== "all" && (s.plan ?? "").toLowerCase() !== planFilter) return false;
      if (eventFilter !== "all" && (s.event_type ?? "") !== eventFilter) return false;
      const t = new Date(s.created_at).getTime();
      if (start !== null && t < start) return false;
      if (end !== null && t > end) return false;
      return true;
    });
  }, [sales, emailQuery, planFilter, eventFilter, startDate, endDate]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: any, vb: any;
      if (sortBy === "created_at") { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
      else if (sortBy === "amount") { va = extractAmountNumber(a.raw_payload); vb = extractAmountNumber(b.raw_payload); }
      else { va = (a.plan ?? "").toLowerCase(); vb = (b.plan ?? "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  useEffect(() => { setPage(1); }, [emailQuery, planFilter, eventFilter, startDate, endDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalSales = filtered.length;
  const byPlan = filtered.reduce<Record<string, number>>((acc, s) => {
    const k = (s.plan ?? "—").toLowerCase();
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const toggleSort = (col: "created_at" | "amount" | "plan") => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: "created_at" | "amount" | "plan" }) => {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const clearFilters = () => { setEmailQuery(""); setPlanFilter("all"); setEventFilter("all"); setStartDate(""); setEndDate(""); };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={ShoppingCart} label="Total (filtrado)" value={totalSales} />
        <MetricCard icon={DollarSign} label="Start" value={byPlan["start"] ?? 0} />
        <MetricCard icon={DollarSign} label="Pró" value={byPlan["pro"] ?? 0} />
        <MetricCard icon={DollarSign} label="Premium" value={byPlan["premium"] ?? 0} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label className="text-xs">Buscar por email</Label>
            <Input value={emailQuery} onChange={(e) => setEmailQuery(e.target.value)} placeholder="email@dominio.com" />
          </div>
          <div>
            <Label className="text-xs">Plano</Label>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="pro">Pró</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo de evento</Label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("created_at")}>Data<SortIcon col="created_at" /></TableHead>
              <TableHead>Email do comprador</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("plan")}>Plano<SortIcon col="plan" /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("amount")}>Valor<SortIcon col="amount" /></TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Evento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma venda encontrada.</TableCell></TableRow>
            ) : pageRows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap text-sm">{new Date(s.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="font-medium">{s.customer_email ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{s.plan ?? "—"}</Badge></TableCell>
                <TableCell>{extractAmount(s.raw_payload)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.provider}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.event_type ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Linhas por página:</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="ml-3">{sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sorted.length)} de {sorted.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button>
            <span className="text-sm">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Próxima</Button>
          </div>
        </div>
      </div>
    </>
  );
}
