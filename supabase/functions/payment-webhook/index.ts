import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pick(obj: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc?.[key], obj);
    if (value) return String(value);
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: corsHeaders });

  const payload = await req.json().catch(() => ({}));
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const email = pick(payload, ["email", "customer.email", "data.customer.email", "data.object.customer_email", "data.object.customer_details.email", "payer.email"]);
  const rawPlan = pick(payload, ["plan", "product", "product_name", "data.plan", "data.object.metadata.plan", "data.object.metadata.product", "items.0.price.nickname"]);
  const eventType = pick(payload, ["type", "event", "event_type"]);
  const normalizedPlan = rawPlan.toLowerCase().includes("premium") ? "premium" : rawPlan.toLowerCase().includes("pro") || rawPlan.toLowerCase().includes("pró") ? "pro" : rawPlan.toLowerCase().includes("start") ? "start" : "";

  await supabase.from("payment_events").insert({
    provider: pick(payload, ["provider"]) || "custom",
    event_type: eventType || null,
    customer_email: email || null,
    plan: normalizedPlan || rawPlan || null,
    raw_payload: payload,
  });

  if (email && normalizedPlan) {
    await supabase.from("profiles").update({ plan: normalizedPlan, status: "active" }).ilike("display_name", email);
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) await supabase.from("profiles").update({ plan: normalizedPlan, status: "active" }).eq("user_id", user.id);
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
