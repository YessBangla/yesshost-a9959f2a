import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendAppEmail, emailShell, escapeHtml } from "./mailer.server";

export type AccountStatus = "pending" | "approved" | "suspended";

export interface AccountStatusResult {
  ok: boolean;
  status: AccountStatus;
  emailStatus: "sent" | "skipped" | "failed";
  detail?: string;
}

const COPY: Record<AccountStatus, { subject: string; title: string; body: string }> = {
  approved: {
    subject: "Your Yess Host account is approved",
    title: "Welcome to Yess Host",
    body: "Your account has been approved. You can now sign in and manage your hosting services, domains, billing and support from your dashboard.",
  },
  suspended: {
    subject: "Your Yess Host account has been suspended",
    title: "Account suspended",
    body: "Your account access has been suspended. Please contact our support team if you believe this is a mistake.",
  },
  pending: {
    subject: "Your Yess Host account is under review",
    title: "Account under review",
    body: "Your account is currently under review by our team. We will notify you as soon as it is approved.",
  },
};

export async function setAccountStatus(
  adminUserId: string,
  targetUserId: string,
  status: AccountStatus,
  note?: string,
): Promise<AccountStatusResult> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      account_status: status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? adminUserId : null,
    })
    .eq("user_id", targetUserId);
  if (error) return { ok: false, status, emailStatus: "skipped", detail: error.message };

  const copy = COPY[status];

  await supabaseAdmin.from("notifications").insert({
    user_id: targetUserId,
    title: copy.title,
    message: note?.trim() ? `${copy.body} — ${note.trim()}` : copy.body,
    type: status === "approved" ? "success" : status === "suspended" ? "error" : "info",
  });

  let emailStatus: AccountStatusResult["emailStatus"] = "skipped";
  let detail: string | undefined;

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
  const email = authUser?.user?.email;
  if (email) {
    const html = emailShell(
      `<h2 style="margin:0 0 12px;font-size:19px">${escapeHtml(copy.title)}</h2>
       <p>${escapeHtml(copy.body)}</p>
       ${note?.trim() ? `<p style="white-space:pre-wrap">${escapeHtml(note.trim())}</p>` : ""}`,
    );
    const res = await sendAppEmail(email, copy.subject, html);
    emailStatus = res.ok ? "sent" : res.transport === "none" ? "skipped" : "failed";
    detail = res.detail;
  }

  return { ok: true, status, emailStatus, detail };
}
