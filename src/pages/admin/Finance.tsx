import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, RefreshCcw, Scale, SearchX, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";

type Invoice = { id: string; invoice_number: string; amount_bdt: number; status: string; description: string | null; created_at: string; paid_at: string | null; due_date: string | null; payment_method: string | null };
type WalletTransaction = { id: string; type: string; amount_bdt: number; status: string; payment_method: string | null; transaction_id: string | null; description: string | null; created_at: string };
type PaymentEvent = { id: string; invoice_id: string; gateway: string; transaction_id: string; amount_bdt: number; status: string; verified: boolean; settled: boolean; created_at: string };
type FinanceRow = { key: string; source: "invoice" | "wallet" | "payment"; reference: string; description: string; method: string; amount: number; status: string; createdAt: string; reconciled: boolean };

const AdminFinance = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [wallet, setWallet] = useState<WalletTransaction[]>([]);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [liability, setLiability] = useState(0);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    const [invoiceResult, walletResult, eventResult, payoutResult, commissionResult] = await Promise.all([
      supabase.from("invoices").select("id,invoice_number,amount_bdt,status,description,created_at,paid_at,due_date,payment_method").order("created_at", { ascending: false }).limit(1000),
      supabase.from("wallet_transactions").select("id,type,amount_bdt,status,payment_method,transaction_id,description,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("payment_events").select("id,invoice_id,gateway,transaction_id,amount_bdt,status,verified,settled,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("affiliate_payouts").select("amount_bdt,status"),
      supabase.from("affiliate_commissions").select("amount_bdt,status"),
    ]);
    const firstError = [invoiceResult.error, walletResult.error, eventResult.error, payoutResult.error, commissionResult.error].find(Boolean);
    if (firstError) setError(bn ? "হিসাবের তথ্য সম্পূর্ণ লোড করা যায়নি। আবার চেষ্টা করুন।" : "Finance data could not be loaded completely. Please try again.");
    setInvoices((invoiceResult.data || []) as Invoice[]);
    setWallet((walletResult.data || []) as WalletTransaction[]);
    setEvents((eventResult.data || []) as PaymentEvent[]);
    const payoutDue = (payoutResult.data || []).filter((item) => ["requested", "processing"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount_bdt), 0);
    const commissionDue = (commissionResult.data || []).filter((item) => ["pending", "approved"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount_bdt), 0);
    setLiability(payoutDue + commissionDue);
    setLoading(false);
  }, [bn]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, source, status, pageSize]);

  const money = (value: number) => `৳${Math.round(value || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`;
  const sum = (rows: { amount_bdt: number }[]) => rows.reduce((total, row) => total + Number(row.amount_bdt || 0), 0);
  const rows = useMemo<FinanceRow[]>(() => [
    ...invoices.map((item) => ({ key: `invoice-${item.id}`, source: "invoice" as const, reference: item.invoice_number, description: item.description || (bn ? "ইনভয়েস" : "Invoice"), method: item.payment_method || "—", amount: Number(item.amount_bdt), status: item.status, createdAt: item.created_at, reconciled: item.status === "paid" })),
    ...wallet.map((item) => ({ key: `wallet-${item.id}`, source: "wallet" as const, reference: item.transaction_id || item.id.slice(0, 8).toUpperCase(), description: item.description || item.type, method: item.payment_method || "—", amount: Number(item.amount_bdt), status: item.status, createdAt: item.created_at, reconciled: item.status === "completed" })),
    ...events.map((item) => ({ key: `payment-${item.id}`, source: "payment" as const, reference: item.transaction_id, description: `${item.gateway} ${bn ? "পেমেন্ট" : "payment"}`, method: item.gateway, amount: Number(item.amount_bdt), status: item.status, createdAt: item.created_at, reconciled: item.verified && item.settled })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [invoices, wallet, events, bn]);

  const filtered = useMemo(() => rows.filter((row) => {
    const q = search.trim().toLocaleLowerCase(bn ? "bn-BD" : "en-US");
    const text = [row.reference, row.description, row.method, row.status, row.source, String(row.amount)].join(" ").toLocaleLowerCase(bn ? "bn-BD" : "en-US");
    return (!q || text.includes(q)) && (source === "all" || row.source === source) && (status === "all" || (status === "reconciled" ? row.reconciled : status === "unreconciled" ? !row.reconciled : row.status === status));
  }), [rows, search, source, status, bn]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const now = new Date();
    const paid = invoices.filter((item) => item.status === "paid");
    const unpaid = invoices.filter((item) => ["unpaid", "overdue"].includes(item.status));
    const overdue = unpaid.filter((item) => item.status === "overdue" || (item.due_date && new Date(item.due_date) < now));
    const reconciled = events.filter((item) => item.verified && item.settled).length;
    return [
      { label: bn ? "মোট আদায়" : "COLLECTED", value: money(sum(paid)), detail: `${paid.length} ${bn ? "পরিশোধিত" : "paid invoices"}`, icon: CheckCircle2, tone: "success" as const },
      { label: bn ? "বকেয়া" : "OUTSTANDING", value: money(sum(unpaid)), detail: `${unpaid.length} ${bn ? "ইনভয়েস" : "invoices"}`, icon: FileText, tone: "warning" as const },
      { label: bn ? "মেয়াদোত্তীর্ণ" : "OVERDUE", value: money(sum(overdue)), detail: `${overdue.length} ${bn ? "ঝুঁকিতে" : "at risk"}`, icon: AlertTriangle, tone: "danger" as const },
      { label: bn ? "রিকনসাইলড" : "RECONCILED", value: `${reconciled}/${events.length}`, detail: bn ? "যাচাইকৃত পেমেন্ট" : "verified payments", icon: Scale },
    ];
  }, [invoices, events, bn]);

  const monthly = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { name: date.toLocaleString(bn ? "bn-BD" : "en-US", { month: "short" }), collected: sum(invoices.filter((item) => item.status === "paid" && (item.paid_at || item.created_at).startsWith(key))), outstanding: sum(invoices.filter((item) => ["unpaid", "overdue"].includes(item.status) && item.created_at.startsWith(key))) };
  }), [invoices, bn]);

  const exportRows = () => downloadCsv("yesshost-finance-ledger", ["source", "reference", "description", "method", "amount_bdt", "status", "reconciled", "date"], filtered.map((row) => [row.source, row.reference, row.description, row.method, row.amount, row.status, row.reconciled ? "yes" : "no", csvDate(row.createdAt)]));

  return <div className="staff-console space-y-5">
    <StaffPageHeader title={bn ? "ফিন্যান্স কন্ট্রোল সেন্টার" : "Finance Control Center"} description={bn ? "আয়, বকেয়া, পেমেন্ট যাচাই এবং দায় পর্যবেক্ষণ করুন" : "Monitor revenue, receivables, payment verification and liabilities"} actions={<div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCcw className="size-4" />{bn ? "রিফ্রেশ" : "Refresh"}</Button><Button onClick={exportRows} disabled={!filtered.length}><Download className="size-4" />CSV</Button></div>} />
    <StaffMetricStrip metrics={stats} />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="staff-panel p-4"><div className="mb-4"><h2 className="font-display font-semibold text-foreground">{bn ? "ছয় মাসের নগদ প্রবাহ" : "Six-month cash flow"}</h2><p className="mt-1 text-xs text-muted-foreground">{bn ? "আদায় বনাম নতুন বকেয়া" : "Collected revenue versus new receivables"}</p></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ left: -18, right: 4 }}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => money(Number(value))} /><Legend /><Bar dataKey="collected" name={bn ? "আদায়" : "Collected"} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} /><Bar dataKey="outstanding" name={bn ? "বকেয়া" : "Outstanding"} fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <aside className="staff-panel p-4"><p className="staff-eyebrow">{bn ? "অপারেশনাল সারাংশ" : "OPERATING POSITION"}</p><div className="mt-4 space-y-4"><div><p className="text-xs text-muted-foreground">{bn ? "ওয়ালেট জমা" : "Completed wallet deposits"}</p><p className="mt-1 text-xl font-semibold text-foreground">{money(sum(wallet.filter((item) => item.type === "deposit" && item.status === "completed")))}</p></div><div className="border-t border-border pt-4"><p className="text-xs text-muted-foreground">{bn ? "অ্যাফিলিয়েট দায়" : "Affiliate liability"}</p><p className="mt-1 text-xl font-semibold text-foreground">{money(liability)}</p></div><div className="border-t border-border pt-4"><p className="text-xs text-muted-foreground">{bn ? "অযাচাইকৃত পেমেন্ট" : "Unverified payment events"}</p><p className="mt-1 text-xl font-semibold text-destructive">{events.filter((item) => !item.verified || !item.settled).length}</p></div></div></aside>
    </div>

    <section className="staff-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center"><StaffSearch value={search} onChange={setSearch} placeholder={bn ? "রেফারেন্স, মাধ্যম বা পরিমাণ খুঁজুন" : "Search reference, method or amount"} /><div className="grid grid-cols-2 gap-2 sm:flex"><Select value={source} onValueChange={setSource}><SelectTrigger className="h-11 min-w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব উৎস" : "All sources"}</SelectItem><SelectItem value="invoice">{bn ? "ইনভয়েস" : "Invoices"}</SelectItem><SelectItem value="wallet">{bn ? "ওয়ালেট" : "Wallet"}</SelectItem><SelectItem value="payment">{bn ? "পেমেন্ট" : "Payments"}</SelectItem></SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-11 min-w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব স্ট্যাটাস" : "All statuses"}</SelectItem><SelectItem value="reconciled">{bn ? "রিকনসাইলড" : "Reconciled"}</SelectItem><SelectItem value="unreconciled">{bn ? "অমিল/অপেক্ষমাণ" : "Needs review"}</SelectItem><SelectItem value="paid">{bn ? "পরিশোধিত" : "Paid"}</SelectItem><SelectItem value="unpaid">{bn ? "অপরিশোধিত" : "Unpaid"}</SelectItem></SelectContent></Select></div></div>
      {loading ? <div className="p-4"><StaffLoading rows={7} /></div> : error && !rows.length ? <StaffEmpty icon={AlertTriangle} title={bn ? "তথ্য পাওয়া যায়নি" : "Finance data unavailable"} description={error} /> : !paged.length ? <StaffEmpty icon={SearchX} title={bn ? "কোনো লেনদেন পাওয়া যায়নি" : "No transactions found"} description={bn ? "সার্চ বা ফিল্টার পরিবর্তন করুন।" : "Try changing the search or filters."} /> : <div className="divide-y divide-border">{paged.map((row) => <article key={row.key} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_130px_130px_130px] md:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-semibold text-foreground">{row.reference}</p><span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{row.source}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{row.description} · {row.method}</p></div><div><p className="staff-eyebrow">{bn ? "পরিমাণ" : "AMOUNT"}</p><p className="mt-1 font-semibold tabular-nums text-foreground">{money(row.amount)}</p></div><div><p className="staff-eyebrow">{bn ? "স্ট্যাটাস" : "STATUS"}</p><p className="mt-1 text-sm capitalize text-foreground">{row.status}</p></div><div className="md:text-right"><p className={row.reconciled ? "text-sm font-medium text-success" : "text-sm font-medium text-warning"}>{row.reconciled ? (bn ? "মিলেছে" : "Reconciled") : (bn ? "পর্যালোচনা প্রয়োজন" : "Needs review")}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p></div></article>)}</div>}
    </section>
    <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 25, 50]} />
  </div>;
};

export default AdminFinance;