import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart3 } from "lucide-react";

export default function Conversions() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero mb-4">
          <BarChart3 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Conversões</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Acompanhe as conversões geradas pelos seus vídeos e otimize seus funis de venda.
        </p>
        <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">Em breve</p>
      </div>
    </DashboardLayout>
  );
}
