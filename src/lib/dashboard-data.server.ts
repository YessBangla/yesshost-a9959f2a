import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";

export type DashboardClient = SupabaseClient<Database>;

function isOpaqueKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function env() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase environment variables are not configured");
  return { url, key };
}

/** Anonymous (publishable) server client for public reads. */
export function createPublicClient(): DashboardClient {
  const { url, key } = env();
  return createClient<Database>(url, key, {
    global: { fetch: supabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Authenticated client + userId derived from an incoming request's bearer token. */
export async function createUserClientFromRequest(
  request: Request,
): Promise<{ supabase: DashboardClient; userId: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.split(".").length !== 3) return null;

  const { url, key } = env();
  const supabase = createClient<Database>(url, key, {
    global: { fetch: supabaseFetch(key), headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub as string };
}

export type Invoice = Tables<"invoices">;
export type Service = Tables<"services">;
export type WalletTx = Tables<"wallet_transactions">;
export type Order = Tables<"orders">;

export type BillingPayload = {
  invoices: Invoice[];
  walletBalance: number;
  fetchedAt: string;
};

export type ServicesPayload = { services: Service[]; fetchedAt: string };
export type DomainsPayload = { domains: Service[]; fetchedAt: string };

export type IncomePayload = {
  signupAt: string | null;
  totals: {
    lifetimeSpend: number;
    paidInvoices: number;
    pendingDue: number;
    walletDeposits: number;
    orderCount: number;
    avgOrderValue: number;
    firstPaymentAt: string | null;
    daysToFirstPayment: number | null;
  };
  monthly: { month: string; amount: number; count: number }[];
  byMethod: { method: string; amount: number; count: number }[];
  recent: { id: string; reference: string; amount: number; method: string | null; at: string; source: string }[];
  fetchedAt: string;
};

export function walletBalanceFrom(rows: WalletTx[]): number {
  return rows.reduce((sum, t) => {
    const credit = t.type === "deposit" || t.type === "refund";
    return credit ? sum + Number(t.amount_bdt) : sum - Number(t.amount_bdt);
  }, 0);
}

export async function loadBilling(supabase: DashboardClient, userId: string): Promise<BillingPayload> {
  const [invoicesRes, walletRes] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("wallet_transactions").select("*").eq("user_id", userId).eq("status", "completed"),
  ]);
  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  return {
    invoices: (invoicesRes.data ?? []) as Invoice[],
    walletBalance: walletBalanceFrom((walletRes.data ?? []) as WalletTx[]),
    fetchedAt: new Date().toISOString(),
  };
}

export async function loadServices(supabase: DashboardClient, userId: string): Promise<ServicesPayload> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { services: (data ?? []) as Service[], fetchedAt: new Date().toISOString() };
}

export async function loadDomains(supabase: DashboardClient, userId: string): Promise<DomainsPayload> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .eq("service_type", "domain")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { domains: (data ?? []) as Service[], fetchedAt: new Date().toISOString() };
}

/**
 * Income aggregation: links the account's sign-up (profile creation) to every
 * downstream payment event (paid invoices, completed orders, wallet deposits).
 */
export async function loadIncome(supabase: DashboardClient, userId: string): Promise<IncomePayload> {
  const [profileRes, invoiceRes, orderRes, walletRes] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("user_id", userId).maybeSingle(),
    supabase.from("invoices").select("*").eq("user_id", userId),
    supabase.from("orders").select("*").eq("user_id", userId),
    supabase.from("wallet_transactions").select("*").eq("user_id", userId).eq("status", "completed"),
  ]);

  const invoices = (invoiceRes.data ?? []) as Invoice[];
  const orders = (orderRes.data ?? []) as Order[];
  const wallet = (walletRes.data ?? []) as WalletTx[];
  const signupAt = profileRes.data?.created_at ?? null;

  const paid = invoices.filter((i) => i.status === "paid");
  const paidInvoices = paid.reduce((s, i) => s + Number(i.amount_bdt), 0);
  const pendingDue = invoices
    .filter((i) => i.status === "unpaid" || i.status === "overdue")
    .reduce((s, i) => s + Number(i.amount_bdt), 0);
  const walletDeposits = wallet
    .filter((t) => t.type === "deposit")
    .reduce((s, t) => s + Number(t.amount_bdt), 0);

  const events = [
    ...paid.map((i) => ({
      id: i.id,
      reference: i.invoice_number,
      amount: Number(i.amount_bdt),
      method: i.payment_method,
      at: i.paid_at ?? i.created_at,
      source: "invoice",
    })),
    ...orders
      .filter((o) => o.payment_status === "paid" && !o.invoice_id)
      .map((o) => ({
        id: o.id,
        reference: o.order_number,
        amount: Number(o.total_bdt),
        method: o.payment_method,
        at: o.paid_at ?? o.created_at,
        source: "order",
      })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const lifetimeSpend = events.reduce((s, e) => s + e.amount, 0);
  const firstPaymentAt = events.length ? events[events.length - 1]!.at : null;
  const daysToFirstPayment =
    signupAt && firstPaymentAt
      ? Math.max(
          0,
          Math.round(
            (new Date(firstPaymentAt).getTime() - new Date(signupAt).getTime()) / 86_400_000,
          ),
        )
      : null;

  const monthlyMap = new Map<string, { amount: number; count: number }>();
  for (const e of events) {
    const key = e.at.slice(0, 7);
    const cur = monthlyMap.get(key) ?? { amount: 0, count: 0 };
    cur.amount += e.amount;
    cur.count += 1;
    monthlyMap.set(key, cur);
  }
  const monthly = [...monthlyMap.entries()]
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const methodMap = new Map<string, { amount: number; count: number }>();
  for (const e of events) {
    const key = e.method ?? "unknown";
    const cur = methodMap.get(key) ?? { amount: 0, count: 0 };
    cur.amount += e.amount;
    cur.count += 1;
    methodMap.set(key, cur);
  }
  const byMethod = [...methodMap.entries()]
    .map(([method, v]) => ({ method, ...v }))
    .sort((a, b) => b.amount - a.amount);

  return {
    signupAt,
    totals: {
      lifetimeSpend,
      paidInvoices,
      pendingDue,
      walletDeposits,
      orderCount: events.length,
      avgOrderValue: events.length ? lifetimeSpend / events.length : 0,
      firstPaymentAt,
      daysToFirstPayment,
    },
    monthly,
    byMethod,
    recent: events.slice(0, 15),
    fetchedAt: new Date().toISOString(),
  };
}

export type ChatMessage = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

export async function loadChatMessages(chatId: string): Promise<ChatMessage[]> {
  // Chat transcripts are no longer readable through the public API, so this
  // read runs with the service-role client scoped to a single chat id.
  const { readChatMessages } = await import("./live-chat.server");
  return readChatMessages(chatId);
}
