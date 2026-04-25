import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Não autorizado" }, 401);

  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Acesso restrito a administradores" }, 403);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "list";

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (action === "block" || action === "unblock") {
      if (!body.userId || typeof body.userId !== "string") return json({ error: "Usuário inválido" }, 400);
      const { error } = await adminClient.from("profiles").update({ status: action === "block" ? "blocked" : "active" }).eq("user_id", body.userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete") {
      if (!body.userId || typeof body.userId !== "string") return json({ error: "Usuário inválido" }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(body.userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
  }

  const [{ data: usersData, error: usersError }, { data: profiles }, { data: videos }] = await Promise.all([
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    adminClient.from("profiles").select("user_id, display_name, phone, status, plan, avatar_url, created_at"),
    adminClient.from("videos").select("id, user_id, name, file_url, total_plays, created_at, status"),
  ]);

  if (usersError) return json({ error: usersError.message }, 400);

  const profileByUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
  const videosByUser = new Map<string, any[]>();
  for (const video of videos ?? []) {
    const list = videosByUser.get((video as any).user_id) ?? [];
    list.push(video);
    videosByUser.set((video as any).user_id, list);
  }

  const users = usersData.users.map((u) => {
    const profile: any = profileByUser.get(u.id) ?? {};
    const userVideos = videosByUser.get(u.id) ?? [];
    return {
      id: u.id,
      name: profile.display_name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Sem nome",
      email: u.email,
      phone: profile.phone ?? u.phone ?? "",
      status: profile.status ?? "active",
      plan: profile.plan ?? "trial",
      funnels: userVideos.length,
      created_at: u.created_at,
      videos: userVideos,
    };
  });

  return json({ users });
});
