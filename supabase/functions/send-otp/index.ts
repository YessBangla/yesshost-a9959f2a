import { adminClient, corsHeaders, hashCode, json, loadConfig, otpEmailHtml, sendEmail, sendSms } from "../_shared/comm.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const channel: string = body.channel === "sms" ? "sms" : "email";
    const recipient: string = String(body.recipient || "").trim();
    const purpose: string = String(body.purpose || "verification").slice(0, 40);

    if (!recipient) return json({ error: "recipient required" }, 400);
    if (channel === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient))
      return json({ error: "Invalid email address" }, 400);
    if (channel === "sms" && !/^\+?\d{8,15}$/.test(recipient.replace(/[\s-]/g, "")))
      return json({ error: "Invalid phone number" }, 400);

    const otpCfg = await loadConfig("email_otp");
    const length = Math.min(8, Math.max(4, Number(otpCfg?.config_value?.length) || 6));
    const minutes = Math.min(30, Math.max(1, Number(otpCfg?.config_value?.expiry_minutes) || 5));

    const db = adminClient();

    // Rate limit: max 5 codes per recipient per 15 minutes
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count } = await db
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("recipient", recipient)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) return json({ error: "Too many requests. Please try again later." }, 429);

    const digits = new Uint32Array(length);
    crypto.getRandomValues(digits);
    const code = [...digits].map((d) => d % 10).join("");

    const { data: row, error: insErr } = await db
      .from("otp_codes")
      .insert({
        recipient,
        channel,
        purpose,
        code_hash: "pending",
        expires_at: new Date(Date.now() + minutes * 60_000).toISOString(),
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    await db.from("otp_codes").update({ code_hash: await hashCode(code, row.id) }).eq("id", row.id);

    const result = channel === "email"
      ? await sendEmail({
          to: recipient,
          subject: `${code} — Yess Host verification code`,
          html: otpEmailHtml(code, minutes),
          text: `Your Yess Host verification code is ${code}. It expires in ${minutes} minutes.`,
        })
      : await sendSms(recipient, `Your Yess Host verification code is ${code}. Valid for ${minutes} minutes.`);

    if (!result.ok) {
      await db.from("otp_codes").delete().eq("id", row.id);
      return json({ error: result.detail || "Failed to send OTP", transport: result.transport }, 502);
    }

    return json({ success: true, otp_id: row.id, expires_in_minutes: minutes, transport: result.transport });
  } catch (e) {
    console.error("send-otp error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
