import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Download, RefreshCcw, Scale, SearchX, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";

type Granularity = "day" | "week" | "month" | "year";
type PeriodRow = { period_start: string; income: number; expense: number; net: number };
type TrialRow = { code: string; name_bn: string; name_en: string; type: string; debit_total: number; credit_total: number; balance: number };
type JournalLine = { debit_bdt: number; credit_bdt: number; ledger_accounts: { code: string; name_bn: string; name_en: string; type: string } | null };
type JournalRow = { id: string; entry_date: string; reference: string; description: string | null; source: string; journal_lines: JournalLine[] };
type ClientPayment = { id: string; invoice_number: string; amount_bdt: number; paid_at: string | null; created_at: string; payment_method: string | null; description: string | null; user_id: string; due_date: string | null };
type CashRow = { id: string; direction: string; method: string; amount_bdt: number; txn_date: string; counterparty: string | null; bank_name: string | null; account_number: string | null; reference: string | null; contra_code: string; note: string | null };

const AdminAccounts = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [trial, setTrial] = useState<TrialRow[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [clients, setClients] = useState<Record<string, { name: string; phone: string | null }>>({});
  const [search, setSearch] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jPage, setJPage] = useState(1);

  const money = useCallback((value: number) => `৳${Math.round(value || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`, [bn]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [periodResult, trialResult, journalResult, paymentResult, profileResult] = await Promise.all([
      supabase.rpc("accounts_period_summary", { _granularity: granularity, _from: from, _to: to }),
      supabase.rpc("accounts_trial_balance", { _from: from, _to: to }),
      supabase.from("journal_entries").select("id,entry_date,reference,description,source,journal_lines(debit_bdt,credit_bdt,ledger_accounts(code,name_bn,name_en))").gte("entry_date", from).lte("entry_date", to).order("entry_date", { ascending: false }).limit(1000),
      supabase.from("invoices").select("id,invoice_number,amount_bdt,paid_at,created_at,payment_method,description,user_id").eq("status", "paid").order("paid_at", { ascending: false }).limit(1000),
      supabase.from("profiles").select("user_id,full_name,phone").limit(2000),
    ]);
    if ([periodResult.error, trialResult.error, journalResult.error, paymentResult.error].some(Boolean)) {
      setError(bn ? "হিসাবের সব তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" : "Some accounting data could not be loaded. Please try again.");
    }
    setPeriods((periodResult.data || []) as PeriodRow[]);
    setTrial((trialResult.data || []) as TrialRow[]);
    setJournal((journalResult.data || []) as unknown as JournalRow[]);
    setPayments((paymentResult.data || []) as ClientPayment[]);
    const map: Record<string, { name: string; phone: string | null }> = {};
    for (const row of profileResult.data || []) map[row.user_id] = { name: row.full_name || (bn ? "নামহীন ক্লায়েন্ট" : "Unnamed client"), phone: row.phone };
    setClients(map);
    setLoading(false);
  }, [granularity, from, to, bn]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => { setJPage(1); }, [journalSearch]);

  const totals = useMemo(() => {
    const income = periods.reduce((sum, row) => sum + Number(row.income || 0), 0);
    const expense = periods.reduce((sum, row) => sum + Number(row.expense || 0), 0);
    const debit = trial.reduce((sum, row) => sum + Number(row.debit_total || 0), 0);
    const credit = trial.reduce((sum, row) => sum + Number(row.credit_total || 0), 0);
    const cash = trial.find((row) => row.code === "1000");
    const walletLiability = trial.find((row) => row.code === "2000");
    return { income, expense, net: income - expense, debit, credit, cash: Number(cash?.balance || 0), wallet: Number(walletLiability?.balance || 0) };
  }, [periods, trial]);

  const metrics = useMemo(() => [
    { label: bn ? "মোট আয়" : "TOTAL INCOME", value: money(totals.income), detail: bn ? "নির্বাচিত সময়ে" : "selected period", icon: TrendingUp, tone: "success" as const },
    { label: bn ? "মোট ব্যয়" : "TOTAL EXPENSE", value: money(totals.expense), detail: bn ? "নির্বাচিত সময়ে" : "selected period", icon: TrendingDown, tone: "warning" as const },
    { label: bn ? "নিট ফলাফল" : "NET RESULT", value: money(totals.net), detail: bn ? "আয় – ব্যয়" : "income minus expense", icon: Scale, tone: totals.net >= 0 ? ("success" as const) : ("danger" as const) },
    { label: bn ? "নগদ ও ব্যাংক" : "CASH & BANK", value: money(totals.cash), detail: bn ? "চলতি স্থিতি" : "running balance", icon: Wallet },
    { label: bn ? "ক্লায়েন্ট ওয়ালেট দায়" : "WALLET LIABILITY", value: money(totals.wallet), detail: bn ? "ক্লায়েন্টদের জমা" : "client held funds", icon: Users, tone: "warning" as const },
    { label: bn ? "ট্রায়াল ব্যালেন্স" : "TRIAL BALANCE", value: Math.abs(totals.debit - totals.credit) < 1 ? (bn ? "মিলেছে" : "Balanced") : money(totals.debit - totals.credit), detail: `${money(totals.debit)} / ${money(totals.credit)}`, icon: BookOpen, tone: Math.abs(totals.debit - totals.credit) < 1 ? ("success" as const) : ("danger" as const) },
  ], [totals, bn, money]);

  const periodLabel = useCallback((value: string) => {
    const date = new Date(value);
    if (granularity === "year") return String(date.getFullYear());
    if (granularity === "month") return date.toLocaleDateString(bn ? "bn-BD" : "en-US", { month: "short", year: "2-digit" });
    return date.toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "short" });
  }, [granularity, bn]);

  const chartData = useMemo(() => periods.map((row) => ({ name: periodLabel(row.period_start), income: Number(row.income || 0), expense: Number(row.expense || 0) })), [periods, periodLabel]);

  const paymentRows = useMemo(() => payments.map((item) => ({
    ...item,
    clientName: clients[item.user_id]?.name || (bn ? "অজানা ক্লায়েন্ট" : "Unknown client"),
    clientPhone: clients[item.user_id]?.phone || "",
  })), [payments, clients, bn]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return paymentRows;
    return paymentRows.filter((row) => [row.invoice_number, row.clientName, row.clientPhone, row.payment_method, row.description, String(row.amount_bdt)].join(" ").toLowerCase().includes(q));
  }, [paymentRows, search]);
  const pagedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);

  const clientSummary = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; last: string }>();
    for (const row of filteredPayments) {
      const current = map.get(row.user_id) || { name: row.clientName, total: 0, count: 0, last: row.paid_at || row.created_at };
      current.total += Number(row.amount_bdt || 0);
      current.count += 1;
      const stamp = row.paid_at || row.created_at;
      if (Date.parse(stamp) > Date.parse(current.last)) current.last = stamp;
      map.set(row.user_id, current);
    }
    return [...map.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.total - a.total);
  }, [filteredPayments]);

  const filteredJournal = useMemo(() => {
    const q = journalSearch.trim().toLowerCase();
    if (!q) return journal;
    return journal.filter((row) => [row.reference, row.description, row.source, ...row.journal_lines.map((line) => line.ledger_accounts?.code)].join(" ").toLowerCase().includes(q));
  }, [journal, journalSearch]);
  const pagedJournal = filteredJournal.slice((jPage - 1) * 15, jPage * 15);

  const sourceLabel = (source: string) => source === "invoice" ? (bn ? "ইনভয়েস" : "Invoice") : source === "wallet" ? (bn ? "ওয়ালেট" : "Wallet") : source === "expense" ? (bn ? "খরচ" : "Expense") : (bn ? "ম্যানুয়াল" : "Manual");
  const accountName = (line: JournalLine) => bn ? line.ledger_accounts?.name_bn : line.ledger_accounts?.name_en;

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title={bn ? "সেন্ট্রাল একাউন্টস" : "Central Accounts"}
        description={bn ? "ক্লায়েন্টের পরিশোধিত টাকার পূর্ণ বিবরণ, দৈনিক–সাপ্তাহিক–মাসিক–বাৎসরিক আয়–ব্যয়, জার্নাল ও ট্রায়াল ব্যালেন্স এক জায়গায়।" : "Every client payment, daily/weekly/monthly/yearly income and expense, journal and trial balance in one ledger."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-11 w-40" />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-11 w-40" />
            <Button variant="outline" className="h-11" onClick={() => void load()}><RefreshCcw className="mr-2 size-4" />{bn ? "রিফ্রেশ" : "Refresh"}</Button>
          </div>
        }
      />

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

      <StaffMetricStrip metrics={metrics} />

      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        {(["day", "week", "month", "year"] as Granularity[]).map((value) => (
          <Button key={value} size="sm" variant={granularity === value ? "default" : "outline"} onClick={() => setGranularity(value)}>
            {value === "day" ? (bn ? "দৈনিক" : "Daily") : value === "week" ? (bn ? "সাপ্তাহিক" : "Weekly") : value === "month" ? (bn ? "মাসিক" : "Monthly") : (bn ? "বাৎসরিক" : "Yearly")}
          </Button>
        ))}
      </div>

      {loading ? <StaffLoading rows={6} /> : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">{bn ? "আয়–ব্যয়" : "Income & Expense"}</TabsTrigger>
            <TabsTrigger value="clients">{bn ? "ক্লায়েন্ট পেমেন্ট" : "Client Payments"}</TabsTrigger>
            <TabsTrigger value="journal">{bn ? "জার্নাল খাতা" : "Journal"}</TabsTrigger>
            <TabsTrigger value="trial">{bn ? "ট্রায়াল ব্যালেন্স" : "Trial Balance"}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: number) => money(Number(value))} />
                    <Legend />
                    <Bar dataKey="income" name={bn ? "আয়" : "Income"} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={bn ? "ব্যয়" : "Expense"} fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <h2 className="font-medium">{bn ? "সময়ভিত্তিক হিসাব" : "Period breakdown"}</h2>
                <Button variant="outline" size="sm" onClick={() => downloadCsv(`accounts-${granularity}`, ["Period", "Income", "Expense", "Net"], periods.map((row) => [row.period_start, row.income, row.expense, row.net]))}><Download className="mr-2 size-4" />CSV</Button>
              </div>
              {periods.length === 0 ? <StaffEmpty icon={SearchX} title={bn ? "কোনো হিসাব নেই" : "No records"} description={bn ? "এই সময়ে কোনো আয় বা ব্যয় পাওয়া যায়নি।" : "No income or expense in this range."} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="p-3">{bn ? "সময়" : "Period"}</th><th className="p-3 text-right">{bn ? "আয়" : "Income"}</th><th className="p-3 text-right">{bn ? "ব্যয়" : "Expense"}</th><th className="p-3 text-right">{bn ? "নিট" : "Net"}</th></tr>
                    </thead>
                    <tbody>
                      {periods.map((row) => (
                        <tr key={row.period_start} className="border-t border-border">
                          <td className="p-3">{periodLabel(row.period_start)}</td>
                          <td className="p-3 text-right tabular-nums text-success">{money(Number(row.income))}</td>
                          <td className="p-3 text-right tabular-nums text-warning">{money(Number(row.expense))}</td>
                          <td className={`p-3 text-right font-medium tabular-nums ${Number(row.net) >= 0 ? "text-success" : "text-destructive"}`}>{money(Number(row.net))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-secondary/40 font-semibold">
                        <td className="p-3">{bn ? "মোট" : "Total"}</td>
                        <td className="p-3 text-right tabular-nums">{money(totals.income)}</td>
                        <td className="p-3 text-right tabular-nums">{money(totals.expense)}</td>
                        <td className="p-3 text-right tabular-nums">{money(totals.net)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StaffSearch value={search} onChange={setSearch} placeholder={bn ? "ক্লায়েন্ট, ইনভয়েস বা পেমেন্ট মাধ্যম খুঁজুন" : "Search client, invoice or method"} />
              <Button variant="outline" className="h-11" onClick={() => downloadCsv("client-payments", ["Invoice", "Client", "Phone", "Amount", "Method", "Paid at"], filteredPayments.map((row) => [row.invoice_number, row.clientName, row.clientPhone, row.amount_bdt, row.payment_method || "", csvDate(row.paid_at || row.created_at)]))}><Download className="mr-2 size-4" />CSV</Button>
            </div>
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-3 font-medium">{bn ? "ক্লায়েন্টভিত্তিক মোট পরিশোধ" : "Total paid per client"}</div>
              {clientSummary.length === 0 ? <StaffEmpty icon={SearchX} title={bn ? "কোনো পেমেন্ট নেই" : "No payments"} description={bn ? "এখনো কোনো ক্লায়েন্ট পেমেন্ট রেকর্ড হয়নি।" : "No client payment recorded yet."} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="p-3">{bn ? "ক্লায়েন্ট" : "Client"}</th><th className="p-3 text-right">{bn ? "ইনভয়েস সংখ্যা" : "Invoices"}</th><th className="p-3 text-right">{bn ? "মোট পরিশোধ" : "Total paid"}</th><th className="p-3">{bn ? "সর্বশেষ" : "Last payment"}</th></tr>
                    </thead>
                    <tbody>
                      {clientSummary.slice(0, 15).map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="p-3">{row.name}</td>
                          <td className="p-3 text-right tabular-nums">{row.count}</td>
                          <td className="p-3 text-right font-medium tabular-nums">{money(row.total)}</td>
                          <td className="p-3 text-muted-foreground">{new Date(row.last).toLocaleDateString(bn ? "bn-BD" : "en-US")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-3 font-medium">{bn ? "পরিশোধের বিস্তারিত" : "Payment details"}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3">{bn ? "ইনভয়েস" : "Invoice"}</th><th className="p-3">{bn ? "ক্লায়েন্ট" : "Client"}</th><th className="p-3">{bn ? "বিবরণ" : "Description"}</th><th className="p-3">{bn ? "মাধ্যম" : "Method"}</th><th className="p-3 text-right">{bn ? "পরিমাণ" : "Amount"}</th><th className="p-3">{bn ? "তারিখ" : "Date"}</th></tr>
                  </thead>
                  <tbody>
                    {pagedPayments.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="p-3 font-medium">{row.invoice_number}</td>
                        <td className="p-3">{row.clientName}</td>
                        <td className="p-3 text-muted-foreground">{row.description || "—"}</td>
                        <td className="p-3">{row.payment_method || "—"}</td>
                        <td className="p-3 text-right tabular-nums">{money(Number(row.amount_bdt))}</td>
                        <td className="p-3 text-muted-foreground">{new Date(row.paid_at || row.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border p-3"><DataPagination total={filteredPayments.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} /></div>
            </div>
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StaffSearch value={journalSearch} onChange={setJournalSearch} placeholder={bn ? "রেফারেন্স বা খাত খুঁজুন" : "Search reference or account"} />
              <Button variant="outline" className="h-11" onClick={() => downloadCsv("journal", ["Date", "Reference", "Source", "Description", "Debit accounts", "Credit accounts", "Amount"], filteredJournal.map((row) => [row.entry_date, row.reference, row.source, row.description || "", row.journal_lines.filter((l) => Number(l.debit_bdt) > 0).map((l) => l.ledger_accounts?.code).join(" "), row.journal_lines.filter((l) => Number(l.credit_bdt) > 0).map((l) => l.ledger_accounts?.code).join(" "), row.journal_lines.reduce((sum, l) => sum + Number(l.debit_bdt || 0), 0)]))}><Download className="mr-2 size-4" />CSV</Button>
            </div>
            <div className="rounded-lg border border-border bg-card">
              {filteredJournal.length === 0 ? <StaffEmpty icon={SearchX} title={bn ? "কোনো এন্ট্রি নেই" : "No entries"} description={bn ? "এই সময়সীমায় জার্নাল এন্ট্রি নেই।" : "No journal entries in this range."} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="p-3">{bn ? "তারিখ" : "Date"}</th><th className="p-3">{bn ? "রেফারেন্স" : "Reference"}</th><th className="p-3">{bn ? "উৎস" : "Source"}</th><th className="p-3">{bn ? "ডেবিট খাত" : "Debit"}</th><th className="p-3">{bn ? "ক্রেডিট খাত" : "Credit"}</th><th className="p-3 text-right">{bn ? "পরিমাণ" : "Amount"}</th></tr>
                    </thead>
                    <tbody>
                      {pagedJournal.map((row) => (
                        <tr key={row.id} className="border-t border-border align-top">
                          <td className="p-3 whitespace-nowrap">{new Date(row.entry_date).toLocaleDateString(bn ? "bn-BD" : "en-US")}</td>
                          <td className="p-3 font-medium">{row.reference}</td>
                          <td className="p-3">{sourceLabel(row.source)}</td>
                          <td className="p-3">{row.journal_lines.filter((line) => Number(line.debit_bdt) > 0).map((line) => accountName(line)).join(", ") || "—"}</td>
                          <td className="p-3">{row.journal_lines.filter((line) => Number(line.credit_bdt) > 0).map((line) => accountName(line)).join(", ") || "—"}</td>
                          <td className="p-3 text-right tabular-nums">{money(row.journal_lines.reduce((sum, line) => sum + Number(line.debit_bdt || 0), 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-border p-3"><DataPagination total={filteredJournal.length} page={jPage} pageSize={15} onPage={setJPage} /></div>
            </div>
          </TabsContent>

          <TabsContent value="trial" className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <h2 className="font-medium">{bn ? "ট্রায়াল ব্যালেন্স" : "Trial balance"}</h2>
                <Button variant="outline" size="sm" onClick={() => downloadCsv("trial-balance", ["Code", "Account", "Type", "Debit", "Credit", "Balance"], trial.map((row) => [row.code, bn ? row.name_bn : row.name_en, row.type, row.debit_total, row.credit_total, row.balance]))}><Download className="mr-2 size-4" />CSV</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-3">{bn ? "কোড" : "Code"}</th><th className="p-3">{bn ? "হিসাব খাত" : "Account"}</th><th className="p-3">{bn ? "ধরন" : "Type"}</th><th className="p-3 text-right">{bn ? "ডেবিট" : "Debit"}</th><th className="p-3 text-right">{bn ? "ক্রেডিট" : "Credit"}</th><th className="p-3 text-right">{bn ? "স্থিতি" : "Balance"}</th></tr>
                  </thead>
                  <tbody>
                    {trial.map((row) => (
                      <tr key={row.code} className="border-t border-border">
                        <td className="p-3 tabular-nums">{row.code}</td>
                        <td className="p-3">{bn ? row.name_bn : row.name_en}</td>
                        <td className="p-3 text-muted-foreground">{row.type}</td>
                        <td className="p-3 text-right tabular-nums">{money(Number(row.debit_total))}</td>
                        <td className="p-3 text-right tabular-nums">{money(Number(row.credit_total))}</td>
                        <td className="p-3 text-right font-medium tabular-nums">{money(Number(row.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-secondary/40 font-semibold">
                      <td className="p-3" colSpan={3}>{bn ? "মোট" : "Total"}</td>
                      <td className="p-3 text-right tabular-nums">{money(totals.debit)}</td>
                      <td className="p-3 text-right tabular-nums">{money(totals.credit)}</td>
                      <td className="p-3 text-right tabular-nums">{Math.abs(totals.debit - totals.credit) < 1 ? (bn ? "মিলেছে" : "Balanced") : money(totals.debit - totals.credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminAccounts;
