import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireRole(
  supabase: { rpc: (name: "has_role", args: { _user_id: string; _role: "admin" | "call_center" }) => PromiseLike<{ data: boolean | null; error: unknown }> },
  userId: string,
  roles: Array<"admin" | "call_center">,
) {
  for (const role of roles) {
    const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
    if (!error && data) return;
  }
  throw new Error("Access denied");
}

export const verifyCustomerSupportPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid(), pin: z.string().regex(/^\d{6}$/) }).parse(data))
  .handler(async ({ data, context }) => {
    await requireRole(context.supabase, context.userId, ["admin", "call_center"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("verify_support_pin", {
      _user_id: data.userId,
      _pin: data.pin,
    });
    if (error) throw new Error("PIN verification failed");
    return { status: result as "valid" | "invalid" | "expired" | "missing" };
  });

export const getAccountsSummaries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    granularity: z.enum(["day", "week", "month", "year"]),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [periods, trial] = await Promise.all([
      supabaseAdmin.rpc("accounts_period_summary", { _granularity: data.granularity, _from: data.from, _to: data.to }),
      supabaseAdmin.rpc("accounts_trial_balance", { _from: data.from, _to: data.to }),
    ]);
    if (periods.error || trial.error) throw new Error("Accounts summary could not be loaded");
    return { periods: periods.data ?? [], trial: trial.data ?? [] };
  });

export type AccountsReconciliation = {
  from: string;
  to: string;
  invoices_paid_total: number;
  ledger_income_total: number;
  payment_events_total: number;
  invoice_ledger_diff: number;
  invoice_payment_diff: number;
  missing_ledger_entries: Array<{ id: string; invoice_number: string; amount_bdt: number; paid_at: string | null }>;
  orphan_ledger_entries: Array<{ id: string; entry_date: string; reference: string; description: string | null; source_id: string | null }>;
};

export const getAccountsReconciliation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("accounts_reconciliation", {
      _from: data.from,
      _to: data.to,
    });
    if (error) throw new Error("Reconciliation could not be generated");
    return result as unknown as AccountsReconciliation;
  });

export const payInvoiceFromWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ invoiceId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("pay_invoice_from_wallet_for_user", {
      _invoice_id: data.invoiceId,
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message.includes("insufficient_balance") ? "Insufficient balance" : "Payment failed");
    return result as { success?: boolean; new_balance?: number; already_paid?: boolean };
  });