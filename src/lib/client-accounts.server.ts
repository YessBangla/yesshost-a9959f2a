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

export interface CreateClientResult {
  ok: boolean;
  userId?: string;
  emailStatus: "sent" | "skipped" | "failed";
  detail?: string;
  error?: string;
}

/**
 * Admin-side client creation: makes a confirmed auth user, assigns roles,
 * marks the profile approved and emails the sign-in credentials.
 */
export async function createClientAccount(
  adminUserId: string,
  input: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    roles?: string[];
    siteUrl: string;
  },
): Promise<CreateClientResult> {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim();

  if (phone) {
    const { data: dupe } = await supabaseAdmin
      .from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (dupe) {
      return { ok: false, emailStatus: "skipped", error: "phone_in_use" };
    }
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName ?? "", phone: phone ?? "" },
  });
  if (createError || !created?.user) {
    return { ok: false, emailStatus: "skipped", error: createError?.message ?? "create_failed" };
  }
  const userId = created.user.id;

  const extraRoles = (input.roles ?? []).filter((r) => r && r !== "user");
  if (extraRoles.length) {
    await supabaseAdmin
      .from("user_roles")
      .insert(extraRoles.map((role) => ({ user_id: userId, role: role as never })));
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      account_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
      ...(input.fullName ? { full_name: input.fullName } : {}),
      ...(phone ? { phone } : {}),
    })
    .eq("user_id", userId);

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title: "Welcome to Yess Host",
    message: "Your client account is active. Sign in to manage services, domains, billing and support.",
    type: "success",
  });

  const loginUrl = `${input.siteUrl.replace(/\/$/, "")}/login`;
  const html = emailShell(
    `<h2 style="margin:0 0 12px;font-size:19px">Welcome to Yess Host</h2>
     <p>Your client account has been created and approved. Use the details below to sign in:</p>
     <p style="margin:16px 0;padding:14px;border-radius:10px;background:#f4f6fb">
       <strong>Email:</strong> ${escapeHtml(email)}<br/>
       <strong>Temporary password:</strong> ${escapeHtml(input.password)}
     </p>
     <p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:11px 18px;border-radius:9px;background:#1d4ed8;color:#fff;text-decoration:none">Sign in to your dashboard</a></p>
     <p style="font-size:13px;color:#64748b">For your security, change this password from Dashboard → Profile after your first sign-in.</p>`,
  );
  const res = await sendAppEmail(email, "Your Yess Host account is ready", html);

  return {
    ok: true,
    userId,
    emailStatus: res.ok ? "sent" : res.transport === "none" ? "skipped" : "failed",
    detail: res.detail,
  };
}
