import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, referral_code, source_page } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve the affiliate who owns this referral code
    const resolveCode = async () => {
      const { data, error } = await admin
        .from("affiliate_profiles")
        .select("user_id, is_active")
        .eq("referral_code", String(referral_code || "").trim())
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    };

    // Track an anonymous click on a referral link
    if (action === "click") {
      const prof = await resolveCode();
      if (!prof) return json({ ok: true, tracked: false });
      const { error } = await admin.from("affiliate_clicks").insert({
        referrer_user_id: prof.user_id,
        ref_code: String(referral_code).trim(),
        source_page: source_page || null,
      });
      if (error) throw error;
      return json({ ok: true, tracked: true });
    }

    // Claim referral after the new user signs up / logs in
    if (action === "claim") {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader) return json({ error: "unauthorized" }, 401);
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
      const userId = userData.user.id;

      const prof = await resolveCode();
      if (!prof) return json({ error: "invalid_code" }, 400);
      if (prof.user_id === userId) return json({ error: "self_referral" }, 400);

      // Idempotent: one referrer per user
      const { data: existing } = await admin
        .from("affiliate_referrals")
        .select("id")
        .eq("referred_user_id", userId)
        .maybeSingle();
      if (existing) return json({ ok: true, already: true });

      const { error: insErr } = await admin
        .from("affiliate_referrals")
        .insert({ referrer_user_id: prof.user_id, referred_user_id: userId });
      if (insErr) throw insErr;
      const { error: updErr } = await admin.from("profiles").update({ referred_by: prof.user_id }).eq("user_id", userId);
      if (updErr) throw updErr;
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    return json({ error: e?.message || "server_error" }, 500);
  }
});
