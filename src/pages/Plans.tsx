import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Check, Pencil } from "lucide-react";

type Plan = { id: string; slug: string; name: string; price_cents: number; description: string | null; features: string[]; cta_text: string; cta_url: string | null; sort_order: number };

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const load = async () => {
    const [{ data: planData }, { data: adminRole }] = await Promise.all([
      (supabase as any).from("plan_cards").select("*").order("sort_order"),
      user ? (supabase as any).rpc("has_role", { _user_id: user.id, _role: "admin" }) : Promise.resolve({ data: false }),
    ]);
    setPlans(planData ?? []);
    setIsAdmin(!!adminRole);
  };

  useEffect(() => { load(); }, [user]);

  const savePlan = async () => {
    if (!editing) return;
    const { error } = await (supabase as any).from("plan_cards").update({
      name: editing.name,
      price_cents: editing.price_cents,
      description: editing.description,
      features: editing.features,
      cta_text: editing.cta_text,
      cta_url: editing.cta_url,
    }).eq("id", editing.id);
    if (error) toast.error("Erro ao salvar plano");
    else {
      toast.success("Plano atualizado");
      setEditing(null);
      load();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-sm text-muted-foreground">Escolha o plano ideal para sua operação.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="relative rounded-lg border bg-card p-6">
              {isAdmin && <Button size="icon" variant="ghost" className="absolute right-3 top-3" onClick={() => setEditing(plan)}><Pencil className="h-4 w-4" /></Button>}
              <h2 className="text-xl font-bold text-card-foreground">{plan.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-5"><span className="text-3xl font-bold text-foreground">R$ {(plan.price_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span><span className="text-sm text-muted-foreground">/mês</span></div>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.features?.map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 text-success" /> {feature}</li>)}
              </ul>
              <Button className="mt-6 w-full gradient-hero text-primary-foreground border-0" onClick={() => plan.cta_url ? window.open(plan.cta_url, "_blank") : toast.info("Link de pagamento em breve")}>{plan.cta_text}</Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar plano</DialogTitle></DialogHeader>
          {editing && <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>Preço em reais</Label><Input type="number" step="0.01" value={editing.price_cents / 100} onChange={(e) => setEditing({ ...editing, price_cents: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label>Descrição</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><Label>Benefícios, um por linha</Label><Textarea value={editing.features?.join("\n") ?? ""} onChange={(e) => setEditing({ ...editing, features: e.target.value.split("\n").filter(Boolean) })} /></div>
            <div><Label>Texto do botão</Label><Input value={editing.cta_text} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} /></div>
            <div><Label>Link do botão</Label><Input value={editing.cta_url ?? ""} onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })} /></div>
            <Button onClick={savePlan} className="w-full">Salvar alterações</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
