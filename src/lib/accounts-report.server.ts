import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { emailShell, escapeHtml, sendAppEmail } from "./mailer.server";

export type AccountsReportSettings = {
  recipients: string[];
  enabled: boolean;
  includeExpenses: boolean;
  includeCashbank: boolean;
};

const CONFIG_KEY = "accounts_report";

const money = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

export async function getReportSettings(): Promise<AccountsReportSettings> {
  const { data } = await supabaseAdmin
    .from("communication_config")
    .select("config_value, is_active")
    .eq("config_key", CONFIG_KEY)
    .maybeSingle();
  const cfg = (data?.config_value as Record<string, unknown>) || {};
  return {
    recipients: Array.isArray(cfg.recipients) ? (cfg.recipients as string[]) : [],
    enabled: !!data?.is_active,
    includeExpenses: cfg.include_expenses !== false,
    includeCashbank: cfg.include_cashbank !== false,
  };
}

export async function saveReportSettings(next: AccountsReportSettings): Promise<AccountsReportSettings> {
  const { data: current } = await supabaseAdmin
    .from("communication_config")
    .select("config_value")
    .eq("config_key", CONFIG_KEY)
    .maybeSingle();
  const cfg = ((current?.config_value as Record<string, unknown>) || {}) as Record<string, unknown>;
  const { error } = await supabaseAdmin
    .from("communication_config")
    .update({
      is_active: next.enabled,
      config_value: {
        ...cfg,
        recipients: next.recipients,
        include_expenses: next.includeExpenses,
        include_cashbank: next.includeCashbank,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("config_key", CONFIG_KEY);
  if (error) throw new Error(error.message);
  return getReportSettings();
}

export async function getCronSecret(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("communication_config")
    .select("config_value")
    .eq("config_key", CONFIG_KEY)
    .maybeSingle();
  const cfg = (data?.config_value as Record<string, unknown>) || {};
  return typeof cfg.cron_secret === "string" ? cfg.cron_secret : null;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y!, (m! - 1), 1));
  const to = new Date(Date.UTC(y!, m!, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function previousMonth(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type LineRow = {
  debit_bdt: number;
  credit_bdt: number;
  journal_entries: { entry_date: string } | null;
  ledger_accounts: { code: string; name_en: string; name_bn: string; type: string } | null;
};

/** Builds the monthly statement + trial balance straight from the central ledger. */
export async function buildAccountsReport(month: string) {
  const { from, to } = monthRange(month);
  const settings = await getReportSettings();

  const [linesRes, invoiceRes, expenseRes, cashRes] = await Promise.all([
    supabaseAdmin
      .from("journal_lines")
      .select("debit_bdt, credit_bdt, journal_entries!inner(entry_date), ledger_accounts!inner(code, name_en, name_bn, type)")
      .gte("journal_entries.entry_date", from)
      .lte("journal_entries.entry_date", to),
    supabaseAdmin
      .from("invoices")
      .select("invoice_number, amount_bdt, paid_at, payment_method")
      .eq("status", "paid")
      .gte("paid_at", `${from}T00:00:00Z`)
      .lte("paid_at", `${to}T23:59:59Z`)
      .order("paid_at", { ascending: true }),
    supabaseAdmin
      .from("operating_expenses")
      .select("title, category, amount_bdt, expense_date, vendor")
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: true }),
    supabaseAdmin
      .from("cash_bank_transactions")
      .select("direction, method, amount_bdt, txn_date, counterparty, bank_name, reference")
      .gte("txn_date", from)
      .lte("txn_date", to)
      .order("txn_date", { ascending: true }),
  ]);

  const lines = ((linesRes.data ?? []) as unknown as LineRow[]);

  const buckets = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();
  for (const l of lines) {
    const acc = l.ledger_accounts;
    if (!acc) continue;
    const row = buckets.get(acc.code) ?? { code: acc.code, name: acc.name_en, type: acc.type, debit: 0, credit: 0 };
    row.debit += Number(l.debit_bdt || 0);
    row.credit += Number(l.credit_bdt || 0);
    buckets.set(acc.code, row);
  }
  const all = [...buckets.values()].sort((a, b) => a.code.localeCompare(b.code));
  const income = all.filter(a => a.type === "income").map(a => ({ ...a, amount: a.credit - a.debit }));
  const expense = all.filter(a => a.type === "expense").map(a => ({ ...a, amount: a.debit - a.credit }));
  const totalIncome = income.reduce((s, a) => s + a.amount, 0);
  const totalExpense = expense.reduce((s, a) => s + a.amount, 0);
  const debitTotal = all.reduce((s, a) => s + a.debit, 0);
  const creditTotal = all.reduce((s, a) => s + a.credit, 0);

  const invoices = invoiceRes.data ?? [];
  const expenses = expenseRes.data ?? [];
  const cash = cashRes.data ?? [];

  const table = (head: string[], rows: string[][]) => `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 18px">
      <thead><tr>${head.map(h => `<th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e2e8f0;color:#475569;font-size:12px;text-transform:uppercase">${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.length === 0
        ? `<tr><td colspan="${head.length}" style="padding:10px 8px;color:#94a3b8">No records</td></tr>`
        : rows.map(r => `<tr>${r.map((c, i) => `<td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;${i === r.length - 1 ? "text-align:right;font-variant-numeric:tabular-nums" : ""}">${c}</td>`).join("")}</tr>`).join("")
      }</tbody>
    </table>`;

  const monthLabel = new Date(`${from}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  let html = `<h2 style="margin:0 0 4px">Yess Host — Monthly Accounts Report</h2>
    <p style="margin:0 0 16px;color:#64748b">${monthLabel} · generated automatically from the central ledger</p>
    <p style="margin:0 0 16px">
      <strong>Income:</strong> ${money(totalIncome)} &nbsp;·&nbsp;
      <strong>Expense:</strong> ${money(totalExpense)} &nbsp;·&nbsp;
      <strong>Net:</strong> ${money(totalIncome - totalExpense)}
    </p>
    <h3 style="margin:18px 0 0">Monthly statement</h3>
    ${table(["Code", "Income account", "Amount"], income.map(a => [a.code, escapeHtml(a.name), money(a.amount)]))}
    ${table(["Code", "Expense account", "Amount"], expense.map(a => [a.code, escapeHtml(a.name), money(a.amount)]))}
    <h3 style="margin:18px 0 0">Client payments</h3>
    ${table(["Invoice", "Paid on", "Method", "Amount"], invoices.map(i => [
      escapeHtml(i.invoice_number),
      i.paid_at ? new Date(i.paid_at).toISOString().slice(0, 10) : "—",
      escapeHtml(i.payment_method || "—"),
      money(Number(i.amount_bdt)),
    ]))}`;

  if (settings.includeExpenses) {
    html += `<h3 style="margin:18px 0 0">Office expenses</h3>
      ${table(["Date", "Title", "Category", "Vendor", "Amount"], expenses.map(e => [
        e.expense_date,
        escapeHtml(e.title),
        escapeHtml(e.category),
        escapeHtml(e.vendor || "—"),
        money(Number(e.amount_bdt)),
      ]))}`;
  }

  if (settings.includeCashbank) {
    html += `<h3 style="margin:18px 0 0">Bank &amp; cash entries</h3>
      ${table(["Date", "Direction", "Method", "Counterparty", "Reference", "Amount"], cash.map(c => [
        c.txn_date,
        c.direction === "in" ? "Money in" : "Money out",
        escapeHtml(c.method),
        escapeHtml(c.counterparty || "—"),
        escapeHtml(c.reference || c.bank_name || "—"),
        money(Number(c.amount_bdt)),
      ]))}`;
  }

  html += `<h3 style="margin:18px 0 0">Trial balance</h3>
    ${table(["Code", "Account", "Debit", "Credit"], all.map(a => [a.code, escapeHtml(a.name), money(a.debit), money(a.credit)]))}
    <p style="margin:0 0 8px"><strong>Total debit:</strong> ${money(debitTotal)} &nbsp;·&nbsp; <strong>Total credit:</strong> ${money(creditTotal)} &nbsp;·&nbsp;
    ${Math.round(debitTotal) === Math.round(creditTotal) ? "<span style='color:#16a34a'>Balanced</span>" : "<span style='color:#dc2626'>Out of balance</span>"}</p>`;

  return {
    month,
    subject: `Yess Host accounts — ${monthLabel}`,
    html: emailShell(html),
    totals: { income: totalIncome, expense: totalExpense, debitTotal, creditTotal, invoices: invoices.length },
  };
}

export type SendReportResult = {
  ok: boolean;
  month: string;
  sent: string[];
  failed: { to: string; detail?: string }[];
  detail?: string;
};

export async function sendAccountsReport(month?: string, overrideRecipients?: string[]): Promise<SendReportResult> {
  const settings = await getReportSettings();
  const targetMonth = month || previousMonth();
  const recipients = (overrideRecipients?.length ? overrideRecipients : settings.recipients)
    .map(r => r.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return { ok: false, month: targetMonth, sent: [], failed: [], detail: "No recipients configured" };
  }

  const report = await buildAccountsReport(targetMonth);
  const sent: string[] = [];
  const failed: { to: string; detail?: string }[] = [];
  for (const to of recipients) {
    const res = await sendAppEmail(to, report.subject, report.html);
    if (res.ok) sent.push(to);
    else failed.push({ to, detail: res.detail });
  }
  return { ok: sent.length > 0, month: targetMonth, sent, failed };
}
