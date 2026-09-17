import type { DashboardClient } from "./dashboard-data.server";
import {
  buildPriceLine,
  isTerm,
  normaliseDomain,
  parseNumeric,
  sumPriceLines,
  validateDomainName,
  validateEppCode,
  validateNote,
  type PriceLine,
  type PriceTotals,
  type ValidationCode,
} from "./domain-pricing";

export class DomainToolsError extends Error {
  code: ValidationCode | "server_error";
  constructor(code: ValidationCode | "server_error", message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

type PricingRow = { ext: string; renewal_bdt: string | number; transfer_bdt: string | number };

export async function fetchPricing(supabase: DashboardClient): Promise<PricingRow[]> {
  const { data } = await supabase
    .from("domain_pricing" as never)
    .select("ext, renewal_bdt, transfer_bdt")
    .eq("is_active", true);
  return (data ?? []) as unknown as PricingRow[];
}

export function priceFrom(
  pricing: PricingRow[],
  domain: string,
  kind: "renewal_bdt" | "transfer_bdt",
): number | null {
  const name = normaliseDomain(domain);
  const match = pricing
    .filter((p) => name.endsWith(p.ext.startsWith(".") ? p.ext : `.${p.ext}`))
    .sort((a, b) => b.ext.length - a.ext.length)[0];
  if (!match) return null;
  return parseNumeric(match[kind]);
}

export type RenewalQuote = { lines: PriceLine[]; totals: PriceTotals };

export type RenewalResult = RenewalQuote & {
  invoiceId: string;
  invoiceNumber: string;
  dueDate: string;
  createdAt: string;
};

export async function submitRenewal(
  supabase: DashboardClient,
  userId: string,
  items: { serviceId: string; years: number }[],
): Promise<RenewalResult> {
  if (!Array.isArray(items) || items.length === 0) throw new DomainToolsError("no_selection");
  for (const i of items) if (!isTerm(i.years)) throw new DomainToolsError("term_invalid");

  const ids = items.map((i) => i.serviceId);
  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, domain, expiry_date")
    .eq("user_id", userId)
    .eq("service_type", "domain")
    .in("id", ids);
  if (error) throw new DomainToolsError("server_error", error.message);
  if (!services || services.length !== ids.length) throw new DomainToolsError("not_owner");

  const pricing = await fetchPricing(supabase);
  const lines: PriceLine[] = [];
  for (const item of items) {
    const svc = services.find((s) => s.id === item.serviceId)!;
    const name = svc.domain || svc.name;
    const unit = priceFrom(pricing, name, "renewal_bdt");
    if (!unit) throw new DomainToolsError("price_unknown");
    lines.push(buildPriceLine(name, unit, item.years));
  }
  const totals = sumPriceLines(lines);

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const description = [
    "Domain renewal",
    ...lines.map((l) => `${l.domain} — ${l.years}y @ ${l.unitPrice}/yr = ${l.total}`),
    `Subtotal ${totals.subtotal} | Discount -${totals.discount} | ICANN fee ${totals.fees} | VAT ${totals.vat}`,
  ].join("\n");

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      amount_bdt: totals.total,
      status: "unpaid",
      due_date: dueDate,
      description,
      service_id: items[0]!.serviceId,
    })
    .select("id, invoice_number, due_date, created_at")
    .single();
  if (invErr || !invoice) throw new DomainToolsError("server_error", invErr?.message);

  return {
    lines,
    totals,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    dueDate: invoice.due_date ?? dueDate,
    createdAt: invoice.created_at,
  };
}

export type TransferResult = {
  ticketId: string;
  ticketNumber: string;
  domain: string;
  quote: RenewalQuote;
  invoiceId: string;
  invoiceNumber: string;
  dueDate: string;
};

export async function submitTransfer(
  supabase: DashboardClient,
  userId: string,
  input: { domain: string; eppCode: string; note?: string; years?: number; acknowledged: boolean },
): Promise<TransferResult> {
  const domainCode = validateDomainName(input.domain);
  if (domainCode) throw new DomainToolsError(domainCode);
  const eppCode = validateEppCode(input.eppCode);
  if (eppCode) throw new DomainToolsError(eppCode);
  const noteCode = validateNote(input.note ?? "");
  if (noteCode) throw new DomainToolsError(noteCode);
  if (!input.acknowledged) throw new DomainToolsError("ack_required");
  const years = input.years ?? 1;
  if (!isTerm(years)) throw new DomainToolsError("term_invalid");

  const domain = normaliseDomain(input.domain);
  const pricing = await fetchPricing(supabase);
  const unit = priceFrom(pricing, domain, "transfer_bdt");
  if (!unit) throw new DomainToolsError("price_unknown");
  const lines = [buildPriceLine(domain, unit, years)];
  const quote: RenewalQuote = { lines, totals: sumPriceLines(lines) };

  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: userId,
      ticket_number: ticketNumber,
      subject: `Domain transfer request: ${domain}`,
      department: "technical",
      priority: "medium",
    })
    .select("id, ticket_number")
    .single();
  if (error || !ticket) throw new DomainToolsError("server_error", error?.message);

  await supabase.from("ticket_replies").insert({
    ticket_id: ticket.id,
    user_id: userId,
    message: [
      `Domain: ${domain}`,
      `EPP/Auth code: ${input.eppCode.trim()}`,
      `Term: ${years} year(s)`,
      `Quoted total: ${quote.totals.total} BDT (incl. VAT)`,
      `Note: ${input.note?.trim() || "-"}`,
    ].join("\n"),
  });

  // Every transfer request also gets a real invoice so the charge shows up in
  // Billing and the payment history stays server-side.
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      amount_bdt: quote.totals.total,
      status: "unpaid",
      due_date: dueDate,
      description: [
        "Domain transfer",
        `${domain} — ${years}y @ ${lines[0]!.unitPrice}/yr = ${lines[0]!.total}`,
        `Ticket ${ticket.ticket_number}`,
      ].join("\n"),
    })
    .select("id, invoice_number, due_date")
    .single();
  if (invErr || !invoice) throw new DomainToolsError("server_error", invErr?.message);

  return {
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    domain,
    quote,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    dueDate: invoice.due_date ?? dueDate,
  };
}

export type TransferStage = {
  key: "received" | "submitted" | "approval" | "complete";
  done: boolean;
  current: boolean;
  at: string | null;
};

export type TransferStatus = {
  ticketNumber: string;
  status: string;
  updatedAt: string;
  stages: TransferStage[];
  updates: { id: string; message: string; isStaff: boolean; at: string }[];
  fetchedAt: string;
};

const STAGE_KEYWORDS: Record<TransferStage["key"], RegExp> = {
  received: /.^/,
  submitted: /submitted to registrar|registrar submitted|transfer initiated|রেজিস্ট্রারে জমা/i,
  approval: /approval|approved|losing registrar|অনুমোদন/i,
  complete: /transfer complete|completed|transferred|সম্পন্ন/i,
};

export async function transferStatus(
  supabase: DashboardClient,
  userId: string,
  ticketNumber: string,
): Promise<TransferStatus | null> {
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, status, updated_at")
    .eq("user_id", userId)
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  if (!ticket) return null;

  const { data: replies } = await supabase
    .from("ticket_replies")
    .select("id, message, is_staff, created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at");

  const updates = (replies ?? []).map((r) => ({
    id: r.id,
    message: r.message,
    isStaff: !!r.is_staff,
    at: r.created_at,
  }));

  const reachedAt = (key: TransferStage["key"]): string | null => {
    if (key === "received") return updates[0]?.at ?? ticket.updated_at;
    if (key === "complete" && (ticket.status === "resolved" || ticket.status === "closed")) {
      return ticket.updated_at;
    }
    const hit = updates.find((u) => STAGE_KEYWORDS[key].test(u.message));
    if (hit) return hit.at;
    if (key === "submitted" && (ticket.status === "in_progress" || ticket.status === "waiting")) {
      return ticket.updated_at;
    }
    return null;
  };

  const order: TransferStage["key"][] = ["received", "submitted", "approval", "complete"];
  const rawStages = order.map((key) => ({ key, at: reachedAt(key) }));
  // once a later stage is reached, earlier ones count as done
  const lastDone = rawStages.reduce((idx, s, i) => (s.at ? i : idx), 0);
  const stages: TransferStage[] = rawStages.map((s, i) => ({
    key: s.key,
    at: s.at,
    done: i <= lastDone,
    current: i === lastDone,
  }));

  return {
    ticketNumber: ticket.ticket_number,
    status: ticket.status,
    updatedAt: ticket.updated_at,
    stages,
    updates,
    fetchedAt: new Date().toISOString(),
  };
}

export type InvoicePaymentStatus = {
  invoiceNumber: string;
  status: string;
  paid: boolean;
  amount: number;
  paidAt: string | null;
  paymentMethod: string | null;
  dueDate: string | null;
  createdAt: string;
  description: string | null;
  transaction: { id: string; amount: number; method: string | null; at: string; status: string } | null;
  fetchedAt: string;
};

export async function invoicePaymentStatus(
  supabase: DashboardClient,
  userId: string,
  invoiceNumber: string,
): Promise<InvoicePaymentStatus | null> {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, amount_bdt, paid_at, payment_method, due_date, created_at, description")
    .eq("user_id", userId)
    .eq("invoice_number", invoiceNumber)
    .maybeSingle();
  if (error) throw new DomainToolsError("server_error", error.message);
  if (!invoice) return null;

  const paid = invoice.status === "paid" || !!invoice.paid_at;
  let transaction: InvoicePaymentStatus["transaction"] = null;
  if (paid) {
    const { data: tx } = await supabase
      .from("wallet_transactions")
      .select("id, amount_bdt, payment_method, created_at, status, description")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const hit = (tx ?? []).find((t) => (t.description ?? "").includes(invoice.invoice_number));
    if (hit) {
      transaction = {
        id: hit.id,
        amount: Number(hit.amount_bdt ?? 0),
        method: hit.payment_method ?? null,
        at: hit.created_at,
        status: String(hit.status ?? ""),
      };
    }
  }

  return {
    invoiceNumber: invoice.invoice_number,
    status: invoice.status,
    paid,
    amount: Number(invoice.amount_bdt ?? 0),
    paidAt: invoice.paid_at,
    paymentMethod: invoice.payment_method,
    dueDate: invoice.due_date,
    createdAt: invoice.created_at,
    description: invoice.description,
    transaction,
    fetchedAt: new Date().toISOString(),
  };
}

export async function transferFollowUp(
  supabase: DashboardClient,
  userId: string,
  ticketNumber: string,
  message: string,
): Promise<{ ticketNumber: string; at: string }> {
  const text = message.trim();
  if (text.length < 10) throw new DomainToolsError("note_too_short");
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, status")
    .eq("user_id", userId)
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  if (error) throw new DomainToolsError("server_error", error.message);
  if (!ticket) throw new DomainToolsError("not_owner");

  const { error: replyErr } = await supabase.from("ticket_replies").insert({
    ticket_id: ticket.id,
    user_id: userId,
    message: text,
  });
  if (replyErr) throw new DomainToolsError("server_error", replyErr.message);
  await supabase
    .from("support_tickets")
    .update({ status: "open", priority: "high", updated_at: new Date().toISOString() })
    .eq("id", ticket.id);

  return { ticketNumber: ticket.ticket_number, at: new Date().toISOString() };
}
