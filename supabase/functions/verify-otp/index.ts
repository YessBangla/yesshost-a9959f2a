import { adminClient, corsHeaders, hashCode, json } from "../_shared/comm.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const recipient = String(body.recipient || "").trim();
    const code = String(body.code || "").trim();
    const purpose = String(body.purpose || "verification").slice(0, 40);
    if (!recipient || !code) return json({ error: "recipient and code required" }, 400);

    const db = adminClient();
    const { data: row } = await db
      .from("otp_codes")
      .select("*")
      .eq("recipient", recipient)
      .eq("purpose", purpose)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return json({ verified: false, error: "No active code found" }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) return json({ verified: false, error: "Code expired" }, 400);
    if (row.attempts >= 5) return json({ verified: false, error: "Too many attempts" }, 429);

    const matches = (await hashCode(code, row.id)) === row.code_hash;
    if (!matches) {
      await db.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return json({ verified: false, error: "Incorrect code" }, 400);
    }

    await db.from("otp_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    return json({ verified: true });
  } catch (e) {
    console.error("verify-otp error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
