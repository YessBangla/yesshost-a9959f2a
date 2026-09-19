import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SharedInvoice = {
  id: string;
  invoiceNumber: string;
  description: string | null;
  amountBdt: number;
  status: string;
  paymentMethod: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
};

const tokenPattern = /^[A-Za-z0-9_-]{32,256}$/;

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const createInvoiceShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { invoiceId: string }) => {
    const invoiceId = data?.invoiceId?.trim();
    if (!invoiceId) throw new Error("Invoice is required");
    return { invoiceId };
  })
  .handler(async ({ data, context }) => {
    const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const { error } = await context.supabase.rpc("set_invoice_share_token", {
      _invoice_id: data.invoiceId,
      _token_hash: tokenHash,
      _expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);
    return { token, expiresAt };
  });

export const getSharedInvoice = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => {
    const token = data?.token?.trim();
    if (!tokenPattern.test(token)) throw new Error("Invalid invoice link");
    return { token };
  })
  .handler(async ({ data }): Promise<SharedInvoice | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tokenHash = await hashToken(data.token);
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_number, description, amount_bdt, status, payment_method, due_date, paid_at, created_at")
      .eq("share_token_hash", tokenHash)
      .gt("share_expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invoice) return null;
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      description: invoice.description,
      amountBdt: Number(invoice.amount_bdt),
      status: invoice.status,
      paymentMethod: invoice.payment_method,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      createdAt: invoice.created_at,
    };
  });