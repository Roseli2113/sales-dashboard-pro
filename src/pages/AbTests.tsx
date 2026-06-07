import { DashboardLayout } from "@/components/DashboardLayout";
import { FlaskConical } from "lucide-react";

export default function AbTests() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero mb-4">
          <FlaskConical className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Testes A/B</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Compare diferentes versões dos seus vídeos lado a lado e descubra qual converte melhor.
        </p>
        <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">Em breve</p>
      </div>
    </DashboardLayout>
  );
}
