import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("status").eq("user_id", user.id).single().then(({ data }) => {
      setBlocked((data as { status?: string } | null)?.status === "blocked");
    });
    if (adminOnly) {
      (supabase as any).rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }: { data: boolean | null }) => setIsAdmin(!!data));
    }
  }, [user, adminOnly]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (blocked) return <Navigate to="/login" replace />;

  if (adminOnly) {
    if (isAdmin === null) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      );
    }
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
