// Shared communication helpers: loads admin-managed config from
// public.communication_config and sends email / SMS through it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export type Cfg = { config_value: Record<string, any>; is_active: boolean } | null;

export async function loadConfig(key: string): Promise<Cfg> {
  const { data } = await adminClient()
    .from("communication_config")
    .select("config_value, is_active")
    .eq("config_key", key)
    .maybeSingle();
  return (data as any) ?? null;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  ok: boolean;
  transport: string;
  detail?: string;
}

async function sendViaSmtp(cfg: Record<string, any>, m: SendEmailInput): Promise<SendResult> {
  const missing = ["host", "port", "username", "password", "from_email"].filter((k) => !cfg[k]);
  if (missing.length) return { ok: false, transport: "smtp", detail: `Missing SMTP fields: ${missing.join(", ")}` };

  const client = new SMTPClient({
    connection: {
      hostname: String(cfg.host),
      port: Number(cfg.port) || 587,
      tls: String(cfg.encryption || "tls").toLowerCase() === "ssl",
      auth: { username: String(cfg.username), password: String(cfg.password) },
    },
  });

  try {
    await client.send({
      from: cfg.from_name ? `${cfg.from_name} <${cfg.from_email}>` : String(cfg.from_email),
      to: m.to,
      subject: m.subject,
      content: m.text || m.html.replace(/<[^>]+>/g, " "),
      html: m.html,
    });
    return { ok: true, transport: "smtp" };
  } finally {
    try { await client.close(); } catch (_) { /* ignore */ }
  }
}

async function sendViaApi(cfg: Record<string, any>, m: SendEmailInput): Promise<SendResult> {
  const provider = String(cfg.provider || "").toLowerCase();
  const apiKey = cfg.api_key;
  const from = cfg.from_name ? `${cfg.from_name} <${cfg.from_email}>` : String(cfg.from_email || "");
  if (!provider) return { ok: false, transport: "email_api", detail: "No provider selected" };
  if (!apiKey) return { ok: false, transport: `email_api:${provider}`, detail: "API key missing" };
  if (!cfg.from_email) return { ok: false, transport: `email_api:${provider}`, detail: "From email missing" };

  let res: Response;
  if (provider === "resend") {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html }),
    });
  } else if (provider === "sendgrid") {
    res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: m.to }] }],
        from: { email: cfg.from_email, name: cfg.from_name || undefined },
        subject: m.subject,
        content: [{ type: "text/html", value: m.html }],
      }),
    });
  } else if (provider === "mailgun") {
    const domain = cfg.domain || String(cfg.from_email).split("@")[1];
    const form = new FormData();
    form.set("from", from);
    form.set("to", m.to);
    form.set("subject", m.subject);
    form.set("html", m.html);
    res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
      body: form,
    });
  } else if (provider === "postmark") {
    res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: { "X-Postmark-Server-Token": String(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify({ From: from, To: m.to, Subject: m.subject, HtmlBody: m.html }),
    });
  } else {
    return { ok: false, transport: `email_api:${provider}`, detail: `Provider ${provider} not supported yet — use SMTP` };
  }

  const text = await res.text();
  return res.ok
    ? { ok: true, transport: `email_api:${provider}` }
    : { ok: false, transport: `email_api:${provider}`, detail: `[${res.status}] ${text.slice(0, 300)}` };
}

/** Sends an email using whichever transport the admin enabled (Email API first, then SMTP). */
export async function sendEmail(m: SendEmailInput): Promise<SendResult> {
  const [api, smtp] = await Promise.all([loadConfig("email_api"), loadConfig("smtp_email")]);

  if (api?.is_active) {
    const r = await sendViaApi(api.config_value || {}, m);
    if (r.ok || !smtp?.is_active) return r;
  }
  if (smtp?.is_active) return await sendViaSmtp(smtp.config_value || {}, m);

  return { ok: false, transport: "none", detail: "No active email transport. Enable SMTP or Email API in Communication Config." };
}

export async function sendSms(to: string, message: string): Promise<SendResult> {
  const cfg = await loadConfig("sms_otp");
  if (!cfg?.is_active) return { ok: false, transport: "none", detail: "SMS/OTP config is disabled" };
  const c = cfg.config_value || {};
  const provider = String(c.provider || "").toLowerCase();
  if (!provider) return { ok: false, transport: "sms", detail: "No SMS provider selected" };

  let res: Response;
  if (provider === "twilio") {
    if (!c.api_key || !c.api_secret || !c.from_number)
      return { ok: false, transport: "sms:twilio", detail: "Account SID, Auth Token and From Number required" };
    const body = new URLSearchParams({ To: to, From: String(c.from_number), Body: message });
    res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.api_key}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${c.api_key}:${c.api_secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } else if (provider === "vonage") {
    res = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: c.api_key, api_secret: c.api_secret,
        to: to.replace(/^\+/, ""), from: c.sender_id || c.from_number, text: message,
      }),
    });
  } else if (provider === "messagebird") {
    res = await fetch("https://rest.messagebird.com/messages", {
      method: "POST",
      headers: { Authorization: `AccessKey ${c.api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: [to], originator: c.sender_id || c.from_number, body: message }),
    });
  } else if (provider === "bulksms_bd") {
    const url = new URL("http://66.45.237.70/api.php");
    url.searchParams.set("username", String(c.api_key || ""));
    url.searchParams.set("password", String(c.api_secret || ""));
    url.searchParams.set("number", to.replace(/^\+/, ""));
    url.searchParams.set("message", message);
    res = await fetch(url.toString());
  } else if (provider === "sslwireless") {
    const url = new URL("https://smsplus.sslwireless.com/api/v3/send-sms");
    url.searchParams.set("api_token", String(c.api_key || ""));
    url.searchParams.set("sid", String(c.sender_id || ""));
    url.searchParams.set("msisdn", to.replace(/^\+/, ""));
    url.searchParams.set("sms", message);
    url.searchParams.set("csms_id", crypto.randomUUID().replace(/-/g, "").slice(0, 20));
    res = await fetch(url.toString());
  } else if (provider === "custom") {
    if (!c.endpoint) return { ok: false, transport: "sms:custom", detail: "Custom endpoint URL missing" };
    res = await fetch(String(c.endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(c.api_key ? { Authorization: `Bearer ${c.api_key}` } : {}) },
      body: JSON.stringify({ to, message, sender_id: c.sender_id }),
    });
  } else {
    return { ok: false, transport: `sms:${provider}`, detail: `Provider ${provider} not supported` };
  }

  const text = await res.text();
  return res.ok
    ? { ok: true, transport: `sms:${provider}`, detail: text.slice(0, 200) }
    : { ok: false, transport: `sms:${provider}`, detail: `[${res.status}] ${text.slice(0, 300)}` };
}

export async function hashCode(code: string, salt: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${code}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function otpEmailHtml(code: string, minutes: number, brand = "Yess Host") {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:14px;padding:32px;border:1px solid #e6e9f0">
      <tr><td style="font-size:20px;font-weight:700;color:#0f172a;padding-bottom:8px">${brand}</td></tr>
      <tr><td style="font-size:15px;color:#475569;padding-bottom:20px">Your verification code / আপনার ভেরিফিকেশন কোড</td></tr>
      <tr><td align="center" style="padding:14px 0 18px">
        <div style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:700;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:14px 22px">${code}</div>
      </td></tr>
      <tr><td style="font-size:13px;color:#64748b">This code expires in ${minutes} minutes. / কোডটি ${minutes} মিনিট পর মেয়াদ শেষ হবে।</td></tr>
      <tr><td style="font-size:12px;color:#94a3b8;padding-top:22px;border-top:1px solid #eef2f7">If you did not request this, you can ignore this email.</td></tr>
    </table>
  </td></tr></table></body></html>`;
}
