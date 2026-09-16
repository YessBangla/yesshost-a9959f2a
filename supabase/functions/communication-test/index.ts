// Admin-only end-to-end test of the email / OTP pipeline using the settings
// saved in the Communication Config page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminClient, corsHeaders, hashCode, json, loadConfig, otpEmailHtml, sendEmail, sendSms } from "../_shared/comm.ts";

interface Step { name: string; ok: boolean; detail?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const steps: Step[] = [];
  let target = "";
  let testType = "full";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const db = adminClient();
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    testType = body.test_type === "sms" ? "sms" : body.test_type === "email" ? "email" : "full";
    target = String(body.target || user.email || "").trim();
    if (!target) return json({ error: "A test email address or phone number is required" }, 400);

    const [api, smtp, sms, otpCfg] = await Promise.all([
      loadConfig("email_api"), loadConfig("smtp_email"), loadConfig("sms_otp"), loadConfig("email_otp"),
    ]);

    // 1. Configuration check
    if (testType === "sms") {
      steps.push({
        name: "SMS provider configured",
        ok: !!sms?.is_active && !!sms?.config_value?.provider,
        detail: sms?.is_active ? `Provider: ${sms.config_value?.provider || "none selected"}` : "SMS/OTP config is disabled",
      });
    } else {
      const active = api?.is_active ? `Email API (${api.config_value?.provider || "no provider"})` : smtp?.is_active ? "SMTP" : null;
      steps.push({
        name: "Email transport configured",
        ok: !!active,
        detail: active ? `Active transport: ${active}` : "Neither SMTP nor Email API is enabled",
      });
    }

    if (!steps[0].ok) throw new Error(steps[0].detail);

    // 2. Plain delivery test
    if (testType !== "sms") {
      const r = await sendEmail({
        to: target,
        subject: "Yess Host — test email",
        html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2 style="margin:0 0 8px">Yess Host</h2>
          <p>This is a test email sent from your Communication Config settings.</p>
          <p style="color:#64748b;font-size:13px">Sent at ${new Date().toISOString()}</p></div>`,
      });
      steps.push({ name: "Test email delivered", ok: r.ok, detail: r.detail || `via ${r.transport}` });
      if (!r.ok) throw new Error(r.detail || "Email send failed");
    } else {
      const r = await sendSms(target, "Yess Host test message. Your SMS settings are working.");
      steps.push({ name: "Test SMS delivered", ok: r.ok, detail: r.detail || `via ${r.transport}` });
      if (!r.ok) throw new Error(r.detail || "SMS send failed");
    }

    // 3 + 4. OTP generate, deliver and verify (full run only)
    if (testType === "full") {
      const length = Math.min(8, Math.max(4, Number(otpCfg?.config_value?.length) || 6));
      const minutes = Math.min(30, Math.max(1, Number(otpCfg?.config_value?.expiry_minutes) || 5));
      const digits = new Uint32Array(length);
      crypto.getRandomValues(digits);
      const code = [...digits].map((d) => d % 10).join("");

      const { data: row, error: insErr } = await db.from("otp_codes").insert({
        recipient: target, channel: "email", purpose: "config_test", code_hash: "pending",
        expires_at: new Date(Date.now() + minutes * 60_000).toISOString(),
      }).select("id").single();
      if (insErr) throw insErr;
      await db.from("otp_codes").update({ code_hash: await hashCode(code, row.id) }).eq("id", row.id);

      const otpRes = await sendEmail({
        to: target,
        subject: `${code} — Yess Host verification code`,
        html: otpEmailHtml(code, minutes),
        text: `Your Yess Host verification code is ${code}.`,
      });
      steps.push({
        name: "OTP email delivered",
        ok: otpRes.ok,
        detail: otpRes.ok ? `${length}-digit code, valid ${minutes} min` : otpRes.detail,
      });
      if (!otpRes.ok) throw new Error(otpRes.detail || "OTP email failed");

      const { data: stored } = await db.from("otp_codes").select("*").eq("id", row.id).single();
      const verified = stored && (await hashCode(code, row.id)) === stored.code_hash &&
        new Date(stored.expires_at).getTime() > Date.now();
      await db.from("otp_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
      steps.push({ name: "OTP verification check", ok: !!verified, detail: verified ? "Code matched and expiry valid" : "Verification failed" });
      if (!verified) throw new Error("OTP verification failed");
    }

    await db.from("communication_test_log").insert({
      run_by: user.id, test_type: testType, target, success: true, steps,
    });

    return json({ success: true, steps });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("communication-test error:", message);
    try {
      await adminClient().from("communication_test_log").insert({
        test_type: testType, target, success: false, steps, error_message: message,
      });
    } catch (_) { /* ignore */ }
    return json({ success: false, steps, error: message }, 200);
  }
});
