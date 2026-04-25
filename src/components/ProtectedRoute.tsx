import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("status").eq("user_id", user.id).single().then(({ data }) => {
      setBlocked((data as { status?: string } | null)?.status === "blocked");
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (blocked) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
