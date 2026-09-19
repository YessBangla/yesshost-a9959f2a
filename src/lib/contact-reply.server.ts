import { supabaseAdmin } from "@/integrations/supabase/client.server";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type SendResult = { ok: boolean; transport: string; detail?: string };

async function sendViaApi(
  cfg: Record<string, unknown>,
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  const provider = String(cfg.provider || "").toLowerCase();
  const apiKey = cfg.api_key as string | undefined;
  const fromEmail = cfg.from_email as string | undefined;
  const from = cfg.from_name ? `${cfg.from_name} <${fromEmail}>` : String(fromEmail || "");
  if (!provider) return { ok: false, transport: "email_api", detail: "No email provider selected" };
  if (!apiKey) return { ok: false, transport: `email_api:${provider}`, detail: "API key missing" };
  if (!fromEmail) return { ok: false, transport: `email_api:${provider}`, detail: "From email missing" };

  let res: Response;
  if (provider === "resend") {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
  } else if (provider === "sendgrid") {
    res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: (cfg.from_name as string) || undefined },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
  } else if (provider === "mailgun") {
    const domain = (cfg.domain as string) || String(fromEmail).split("@")[1];
    const form = new FormData();
    form.set("from", from);
    form.set("to", to);
    form.set("subject", subject);
    form.set("html", html);
    res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
      body: form,
    });
  } else if (provider === "postmark") {
    res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: { "X-Postmark-Server-Token": String(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify({ From: from, To: to, Subject: subject, HtmlBody: html }),
    });
  } else {
    return { ok: false, transport: `email_api:${provider}`, detail: `Provider ${provider} is not supported` };
  }

  const text = await res.text();
  return res.ok
    ? { ok: true, transport: `email_api:${provider}` }
    : { ok: false, transport: `email_api:${provider}`, detail: `[${res.status}] ${text.slice(0, 200)}` };
}

export interface ContactReplyResult {
  ok: boolean;
  status: "sent" | "queued" | "failed";
  detail?: string;
}

export async function sendContactReply(
  userId: string,
  messageId: string,
  replyText: string,
): Promise<ContactReplyResult> {
  const { data: msg } = await supabaseAdmin
    .from("contact_messages")
    .select("id, name, email, subject, message")
    .eq("id", messageId)
    .maybeSingle();
  if (!msg) return { ok: false, status: "failed", detail: "Message not found" };

  const subject = `Re: ${msg.subject || "Your message to Yess Host"}`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.6">
      <p>Hello ${escapeHtml(msg.name || "")},</p>
      <div style="white-space:pre-wrap">${escapeHtml(replyText)}</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
      <p style="font-size:13px;color:#64748b"><strong>Your original message:</strong><br/>
      <span style="white-space:pre-wrap">${escapeHtml(msg.message || "")}</span></p>
      <p style="font-size:13px;color:#64748b">Yess Host — support@yesshost.com — +8801805464343</p>
    </div>`;

  const { data: cfg } = await supabaseAdmin
    .from("communication_config")
    .select("config_value, is_active")
    .eq("config_key", "email_api")
    .maybeSingle();

  let result: SendResult;
  if (cfg?.is_active) {
    try {
      result = await sendViaApi((cfg.config_value as Record<string, unknown>) || {}, msg.email, subject, html);
    } catch (e) {
      result = { ok: false, transport: "email_api", detail: String((e as Error)?.message || e) };
    }
  } else {
    result = {
      ok: false,
      transport: "none",
      detail: "No active email provider. Enable an Email API in Communication Settings.",
    };
  }

  const status: ContactReplyResult["status"] = result.ok
    ? "sent"
    : result.transport === "none"
      ? "queued"
      : "failed";

  await supabaseAdmin.from("contact_message_replies").insert({
    message_id: msg.id,
    replied_by: userId,
    to_email: msg.email,
    subject,
    body: replyText,
    delivery_status: status,
    delivery_detail: result.detail ?? result.transport,
  });

  if (result.ok) {
    await supabaseAdmin.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
  }

  return { ok: result.ok, status, detail: result.detail };
}

export interface ContactReplyRow {
  id: string;
  message_id: string;
  body: string;
  to_email: string;
  delivery_status: string;
  delivery_detail: string | null;
  created_at: string;
}

export async function listContactReplies(messageId: string): Promise<ContactReplyRow[]> {
  const { data } = await supabaseAdmin
    .from("contact_message_replies")
    .select("id, message_id, body, to_email, delivery_status, delivery_detail, created_at")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false });
  return (data as ContactReplyRow[]) ?? [];
}
