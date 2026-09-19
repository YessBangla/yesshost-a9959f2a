import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, BookOpen, CalendarDays, Download, Landmark, Plus, RefreshCcw, Scale, SearchX, Trash2, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";
import { useServerFn } from "@tanstack/react-start";
import { getAccountsReportSettings, saveAccountsReportSettings, sendAccountsReportNow } from "@/lib/accounts-report.functions";
import { getAccountsSummaries, getAccountsReconciliation, type AccountsReconciliation } from "@/lib/secure-operations.functions";
import { Mail, Send } from "lucide-react";

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
  const { toast } = useToast();
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
  const [cash, setCash] = useState<CashRow[]>([]);
  const [statementMonth, setStatementMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [cbForm, setCbForm] = useState({ direction: "in", method: "bank", amount: "", date: new Date().toISOString().slice(0, 10), counterparty: "", bank_name: "", account_number: "", reference: "", contra_code: "4000", note: "" });
  const [savingCb, setSavingCb] = useState(false);
  const loadSummaries = useServerFn(getAccountsSummaries);

  const money = useCallback((value: number) => `৳${Math.round(value || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`, [bn]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [summaryResult, journalResult, paymentResult, profileResult, cashResult] = await Promise.all([
      loadSummaries({ data: { granularity, from, to } }).catch(() => null),
      supabase.from("journal_entries").select("id,entry_date,reference,description,source,journal_lines(debit_bdt,credit_bdt,ledger_accounts(code,name_bn,name_en,type))").gte("entry_date", from).lte("entry_date", to).order("entry_date", { ascending: false }).limit(1000),
      supabase.from("invoices").select("id,invoice_number,amount_bdt,paid_at,created_at,payment_method,description,user_id,due_date").eq("status", "paid").order("paid_at", { ascending: false }).limit(1000),
      supabase.from("profiles").select("user_id,full_name,phone").limit(2000),
      supabase.from("cash_bank_transactions").select("id,direction,method,amount_bdt,txn_date,counterparty,bank_name,account_number,reference,contra_code,note").order("txn_date", { ascending: false }).limit(1000),
    ]);
    if (!summaryResult || [journalResult.error, paymentResult.error].some(Boolean)) {
      setError(bn ? "হিসাবের সব তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" : "Some accounting data could not be loaded. Please try again.");
    }
    setPeriods((summaryResult?.periods || []) as PeriodRow[]);
    setTrial((summaryResult?.trial || []) as TrialRow[]);
    setJournal((journalResult.data || []) as unknown as JournalRow[]);
    setPayments((paymentResult.data || []) as ClientPayment[]);
    setCash((cashResult.data || []) as CashRow[]);
    const map: Record<string, { name: string; phone: string | null }> = {};
    for (const row of profileResult.data || []) map[row.user_id] = { name: row.full_name || (bn ? "নামহীন ক্লায়েন্ট" : "Unnamed client"), phone: row.phone };
    setClients(map);
    setLoading(false);
  }, [granularity, from, to, bn, loadSummaries]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => { setJPage(1); }, [journalSearch]);

  // Scheduled statement + trial balance email (monthly, to outside accountants)
  const loadReportSettings = useServerFn(getAccountsReportSettings);
  const persistReportSettings = useServerFn(saveAccountsReportSettings);
  const sendReportNow = useServerFn(sendAccountsReportNow);
  const [reportRecipients, setReportRecipients] = useState("");
  const [reportEnabled, setReportEnabled] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const settings = await loadReportSettings();
        setReportRecipients(settings.recipients.join(", "));
        setReportEnabled(settings.enabled);
      } catch {
        /* non-admins never reach this page */
      }
    })();
  }, [loadReportSettings]);

  const parsedRecipients = () =>
    reportRecipients.split(/[\s,;]+/).map((v) => v.trim()).filter(Boolean);

  const saveReport = async (enabled: boolean) => {
    setReportBusy(true);
    try {
      const settings = await persistReportSettings({
        data: { recipients: parsedRecipients(), enabled, includeExpenses: true, includeCashbank: true },
      });
      setReportEnabled(settings.enabled);
      setReportRecipients(settings.recipients.join(", "));
      toast({ title: bn ? "সেটিংস সংরক্ষিত হয়েছে" : "Settings saved" });
    } catch (e) {
      toast({ title: bn ? "সংরক্ষণ করা যায়নি" : "Could not save", description: String((e as Error)?.message || e), variant: "destructive" });
    }
    setReportBusy(false);
  };

  const sendReport = async () => {
    setReportBusy(true);
    try {
      const res = await sendReportNow({ data: { month: statementMonth } });
      toast({
        title: res.ok ? (bn ? "রিপোর্ট পাঠানো হয়েছে" : "Report sent") : (bn ? "পাঠানো যায়নি" : "Could not send"),
        description: res.ok
          ? `${res.sent.join(", ")}`
          : res.detail || res.failed.map((f) => `${f.to}: ${f.detail || ""}`).join(" · "),
        variant: res.ok ? undefined : "destructive",
      });
    } catch (e) {
      toast({ title: bn ? "পাঠানো যায়নি" : "Could not send", description: String((e as Error)?.message || e), variant: "destructive" });
    }
    setReportBusy(false);
  };

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

  const sourceLabel = (source: string) => source === "invoice" ? (bn ? "ইনভয়েস" : "Invoice") : source === "wallet" ? (bn ? "ওয়ালেট" : "Wallet") : source === "expense" ? (bn ? "খরচ" : "Expense") : source === "cashbank" ? (bn ? "ব্যাংক/ক্যাশ" : "Bank/Cash") : (bn ? "ম্যানুয়াল" : "Manual");
  const accountName = (line: JournalLine) => bn ? line.ledger_accounts?.name_bn : line.ledger_accounts?.name_en;

  const monthOptions = useMemo(() => {
    const set = new Set<string>([statementMonth]);
    for (const row of journal) set.add(row.entry_date.slice(0, 7));
    for (const row of payments) set.add((row.paid_at || row.created_at).slice(0, 7));
    return [...set].sort().reverse();
  }, [journal, payments, statementMonth]);

  const statement = useMemo(() => {
    const lines = new Map<string, { code: string; name: string; type: string; amount: number }>();
    for (const entry of journal.filter((row) => row.entry_date.startsWith(statementMonth))) {
      for (const line of entry.journal_lines) {
        const account = line.ledger_accounts;
        if (!account || !["income", "expense"].includes(account.type)) continue;
        const value = account.type === "income" ? Number(line.credit_bdt || 0) - Number(line.debit_bdt || 0) : Number(line.debit_bdt || 0) - Number(line.credit_bdt || 0);
        if (!value) continue;
        const current = lines.get(account.code) || { code: account.code, name: bn ? account.name_bn : account.name_en, type: account.type, amount: 0 };
        current.amount += value;
        lines.set(account.code, current);
      }
    }
    const all = [...lines.values()].sort((a, b) => a.code.localeCompare(b.code));
    const income = all.filter((row) => row.type === "income");
    const expense = all.filter((row) => row.type === "expense");
    const incomeTotal = income.reduce((sum, row) => sum + row.amount, 0);
    const expenseTotal = expense.reduce((sum, row) => sum + row.amount, 0);
    const invoiceRows = payments
      .filter((row) => (row.paid_at || row.created_at).startsWith(statementMonth))
      .map((row) => ({
        id: row.id,
        invoice: row.invoice_number,
        client: clients[row.user_id]?.name || (bn ? "অজানা ক্লায়েন্ট" : "Unknown client"),
        billed: row.created_at,
        due: row.due_date,
        paid: row.paid_at || row.created_at,
        method: row.payment_method || "—",
        amount: Number(row.amount_bdt || 0),
      }))
      .sort((a, b) => Date.parse(a.paid) - Date.parse(b.paid));
    return { income, expense, incomeTotal, expenseTotal, net: incomeTotal - expenseTotal, invoiceRows };
  }, [journal, payments, clients, statementMonth, bn]);

  const monthLabel = useCallback((key: string) => new Date(`${key}-01T00:00:00`).toLocaleDateString(bn ? "bn-BD" : "en-US", { month: "long", year: "numeric" }), [bn]);

  const cashTotals = useMemo(() => {
    const inflow = cash.filter((row) => row.direction === "in").reduce((sum, row) => sum + Number(row.amount_bdt || 0), 0);
    const outflow = cash.filter((row) => row.direction === "out").reduce((sum, row) => sum + Number(row.amount_bdt || 0), 0);
    const bankBalance = cash.filter((row) => row.method === "bank").reduce((sum, row) => sum + (row.direction === "in" ? 1 : -1) * Number(row.amount_bdt || 0), 0);
    const cashBalance = cash.filter((row) => row.method === "cash").reduce((sum, row) => sum + (row.direction === "in" ? 1 : -1) * Number(row.amount_bdt || 0), 0);
    return { inflow, outflow, bankBalance, cashBalance };
  }, [cash]);

  const contraOptions = useMemo(() => cbForm.direction === "in"
    ? [
        { code: "4000", label: bn ? "হোস্টিং ও সেবা আয়" : "Hosting & service revenue" },
        { code: "4100", label: bn ? "থিম বিক্রয় আয়" : "Theme sales revenue" },
        { code: "1100", label: bn ? "প্রাপ্য আদায়" : "Receivable collection" },
        { code: "3000", label: bn ? "মূলধন জমা" : "Owner capital" },
      ]
    : [
        { code: "5000", label: bn ? "সার্ভার ও ডেটাসেন্টার" : "Servers & datacenter" },
        { code: "5100", label: bn ? "বেতন" : "Salaries" },
        { code: "5200", label: bn ? "মার্কেটিং" : "Marketing" },
        { code: "5300", label: bn ? "সফটওয়্যার ও লাইসেন্স" : "Software & licences" },
        { code: "5400", label: bn ? "অফিস" : "Office" },
        { code: "5900", label: bn ? "অন্যান্য ব্যয়" : "Other expenses" },
      ], [cbForm.direction, bn]);

  const saveCashEntry = async () => {
    const amount = Number(cbForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: bn ? "পরিমাণ দিন" : "Enter amount", description: bn ? "সঠিক টাকার পরিমাণ লিখুন।" : "Enter a valid amount.", variant: "destructive" });
      return;
    }
    setSavingCb(true);
    const { error: insertError } = await supabase.from("cash_bank_transactions").insert({
      direction: cbForm.direction,
      method: cbForm.method,
      amount_bdt: amount,
      txn_date: cbForm.date,
      counterparty: cbForm.counterparty.trim() || null,
      bank_name: cbForm.method === "bank" ? cbForm.bank_name.trim() || null : null,
      account_number: cbForm.method === "bank" ? cbForm.account_number.trim() || null : null,
      reference: cbForm.reference.trim() || null,
      contra_code: cbForm.contra_code,
      note: cbForm.note.trim() || null,
    });
    setSavingCb(false);
    if (insertError) {
      toast({ title: bn ? "সংরক্ষণ হয়নি" : "Not saved", description: insertError.message, variant: "destructive" });
      return;
    }
    toast({ title: bn ? "এন্ট্রি যোগ হয়েছে" : "Entry recorded", description: bn ? "হিসাব খাতায় স্বয়ংক্রিয়ভাবে বসে গেছে।" : "Posted to the ledger automatically." });
    setCbForm({ ...cbForm, amount: "", counterparty: "", reference: "", note: "" });
    void load();
  };

  const removeCashEntry = async (id: string) => {
    const { error: deleteError } = await supabase.from("cash_bank_transactions").delete().eq("id", id);
    if (deleteError) {
      toast({ title: bn ? "মুছতে সমস্যা" : "Delete failed", description: deleteError.message, variant: "destructive" });
      return;
    }
    void load();
  };

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
            <TabsTrigger value="statement">{bn ? "মাসিক বিবরণী" : "Monthly Statement"}</TabsTrigger>
            <TabsTrigger value="cashbank">{bn ? "ব্যাংক ও ক্যাশ" : "Bank & Cash"}</TabsTrigger>
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

          <TabsContent value="statement" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statementMonth} onValueChange={setStatementMonth}>
                <SelectTrigger className="h-11 w-56"><SelectValue /></SelectTrigger>
                <SelectContent>{monthOptions.map((key) => <SelectItem key={key} value={key}>{monthLabel(key)}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" className="h-11" onClick={() => downloadCsv(`monthly-statement-${statementMonth}`, ["Section", "Code", "Account", "Amount"], [
                ...statement.income.map((row) => [bn ? "আয়" : "Income", row.code, row.name, Math.round(row.amount)]),
                ...statement.expense.map((row) => [bn ? "ব্যয়" : "Expense", row.code, row.name, Math.round(row.amount)]),
                [bn ? "নিট" : "Net", "", "", Math.round(statement.net)],
              ])}><Download className="mr-2 size-4" />CSV</Button>
              <p className="text-xs text-muted-foreground">{bn ? "সব তথ্য হিসাব খাতা থেকে স্বয়ংক্রিয়ভাবে তৈরি — আলাদা করে লিখতে হবে না।" : "Generated automatically from the ledger — nothing to type in twice."}</p>
            </div>

            {/* Scheduled email of statement + trial balance to outside accountants */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">{bn ? "নিয়মিত ইমেইল রিপোর্ট" : "Scheduled email report"}</h3>
                <span className={`rounded-sm px-2 py-0.5 text-[10px] font-medium ${reportEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {reportEnabled ? (bn ? "চালু" : "On") : (bn ? "বন্ধ" : "Off")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {bn
                  ? "প্রতি মাসের ১ তারিখে আগের মাসের আয়–ব্যয় বিবরণী, অফিস খরচ, ব্যাংক ও ক্যাশ এন্ট্রি এবং ট্রায়াল ব্যালেন্স এই ঠিকানাগুলোতে চলে যাবে।"
                  : "On the 1st of each month the previous month's statement, office expenses, bank & cash entries and trial balance are emailed to these addresses."}
              </p>
              <Input
                value={reportRecipients}
                onChange={(e) => setReportRecipients(e.target.value)}
                placeholder={bn ? "accountant@example.com, auditor@example.com" : "accountant@example.com, auditor@example.com"}
                className="h-11"
              />
              <div className="flex flex-wrap gap-2">
                <Button className="h-11" disabled={reportBusy} onClick={() => void saveReport(true)}>
                  {bn ? "সংরক্ষণ ও চালু করুন" : "Save & enable"}
                </Button>
                <Button variant="outline" className="h-11" disabled={reportBusy} onClick={() => void saveReport(false)}>
                  {bn ? "বন্ধ করুন" : "Turn off"}
                </Button>
                <Button variant="outline" className="h-11" disabled={reportBusy || !reportRecipients.trim()} onClick={() => void sendReport()}>
                  <Send className="mr-2 size-4" />{bn ? "এখনই পাঠান" : "Send now"}
                </Button>
              </div>
            </div>



            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border p-3 font-medium">{bn ? "আয়" : "Income"}</div>
                {statement.income.length === 0 ? <StaffEmpty icon={SearchX} title={bn ? "আয় নেই" : "No income"} description={bn ? "এই মাসে কোনো আয় রেকর্ড হয়নি।" : "No income recorded this month."} /> : (
                  <table className="w-full text-sm">
                    <tbody>
                      {statement.income.map((row) => (
                        <tr key={row.code} className="border-t border-border"><td className="p-3 tabular-nums text-muted-foreground">{row.code}</td><td className="p-3">{row.name}</td><td className="p-3 text-right tabular-nums text-success">{money(row.amount)}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-border bg-secondary/40 font-semibold"><td className="p-3" colSpan={2}>{bn ? "মোট আয়" : "Total income"}</td><td className="p-3 text-right tabular-nums">{money(statement.incomeTotal)}</td></tr></tfoot>
                  </table>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border p-3 font-medium">{bn ? "ব্যয়" : "Expense"}</div>
                {statement.expense.length === 0 ? <StaffEmpty icon={SearchX} title={bn ? "ব্যয় নেই" : "No expense"} description={bn ? "এই মাসে কোনো খরচ রেকর্ড হয়নি।" : "No expense recorded this month."} /> : (
                  <table className="w-full text-sm">
                    <tbody>
                      {statement.expense.map((row) => (
                        <tr key={row.code} className="border-t border-border"><td className="p-3 tabular-nums text-muted-foreground">{row.code}</td><td className="p-3">{row.name}</td><td className="p-3 text-right tabular-nums text-warning">{money(row.amount)}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-border bg-secondary/40 font-semibold"><td className="p-3" colSpan={2}>{bn ? "মোট ব্যয়" : "Total expense"}</td><td className="p-3 text-right tabular-nums">{money(statement.expenseTotal)}</td></tr></tfoot>
                  </table>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{bn ? "নিট ফলাফল" : "Net result"} · {monthLabel(statementMonth)}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${statement.net >= 0 ? "text-success" : "text-destructive"}`}>{money(statement.net)}</p>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <h2 className="font-medium">{bn ? "এই মাসের বিল ও পরিশোধ" : "Bills and payments this month"}</h2>
                <Button variant="outline" size="sm" onClick={() => downloadCsv(`monthly-invoices-${statementMonth}`, ["Invoice", "Client", "Billed on", "Due date", "Paid on", "Method", "Amount"], statement.invoiceRows.map((row) => [row.invoice, row.client, csvDate(row.billed), row.due ? csvDate(row.due) : "", csvDate(row.paid), row.method, Math.round(row.amount)]))} disabled={!statement.invoiceRows.length}><Download className="mr-2 size-4" />CSV</Button>
              </div>
              {statement.invoiceRows.length === 0 ? <StaffEmpty icon={SearchX} title={bn ? "কোনো পরিশোধ নেই" : "No payments"} description={bn ? "এই মাসে কোনো বিল পরিশোধ হয়নি।" : "No invoice was paid this month."} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="p-3">{bn ? "ইনভয়েস" : "Invoice"}</th><th className="p-3">{bn ? "ক্লায়েন্ট" : "Client"}</th><th className="p-3">{bn ? "বিলের দিন" : "Billed on"}</th><th className="p-3">{bn ? "শেষ তারিখ" : "Due"}</th><th className="p-3">{bn ? "পরিশোধের দিন" : "Paid on"}</th><th className="p-3">{bn ? "মাধ্যম" : "Method"}</th><th className="p-3 text-right">{bn ? "পরিমাণ" : "Amount"}</th></tr>
                    </thead>
                    <tbody>
                      {statement.invoiceRows.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="p-3 font-medium">{row.invoice}</td>
                          <td className="p-3">{row.client}</td>
                          <td className="p-3 text-muted-foreground">{new Date(row.billed).toLocaleDateString(bn ? "bn-BD" : "en-US")}</td>
                          <td className="p-3 text-muted-foreground">{row.due ? new Date(row.due).toLocaleDateString(bn ? "bn-BD" : "en-US") : "—"}</td>
                          <td className="p-3">{new Date(row.paid).toLocaleDateString(bn ? "bn-BD" : "en-US")}</td>
                          <td className="p-3">{row.method}</td>
                          <td className="p-3 text-right font-medium tabular-nums">{money(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-border bg-secondary/40 font-semibold"><td className="p-3" colSpan={6}>{bn ? "মোট আদায়" : "Total collected"}</td><td className="p-3 text-right tabular-nums">{money(statement.invoiceRows.reduce((sum, row) => sum + row.amount, 0))}</td></tr></tfoot>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cashbank" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{bn ? "ব্যাংক স্থিতি" : "Bank balance"}</p><p className="mt-1 text-xl font-semibold tabular-nums">{money(cashTotals.bankBalance)}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{bn ? "ক্যাশ স্থিতি" : "Cash balance"}</p><p className="mt-1 text-xl font-semibold tabular-nums">{money(cashTotals.cashBalance)}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{bn ? "মোট জমা" : "Total in"}</p><p className="mt-1 text-xl font-semibold tabular-nums text-success">{money(cashTotals.inflow)}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{bn ? "মোট উত্তোলন/প্রদান" : "Total out"}</p><p className="mt-1 text-xl font-semibold tabular-nums text-warning">{money(cashTotals.outflow)}</p></div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-medium">{bn ? "ব্যাংক ট্রানজেকশন ও ক্যাশ পেমেন্ট এন্ট্রি" : "Bank transaction & cash payment entry"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{bn ? "প্রতিটি এন্ট্রি সংরক্ষণের সাথে সাথেই জার্নাল ও ট্রায়াল ব্যালেন্সে মিলে যাবে।" : "Each entry posts straight into the journal and trial balance."}</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                <Select value={cbForm.direction} onValueChange={(value) => setCbForm({ ...cbForm, direction: value, contra_code: value === "in" ? "4000" : "5400" })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="in">{bn ? "টাকা জমা (Receipt)" : "Money in (receipt)"}</SelectItem><SelectItem value="out">{bn ? "টাকা প্রদান (Payment)" : "Money out (payment)"}</SelectItem></SelectContent>
                </Select>
                <Select value={cbForm.method} onValueChange={(value) => setCbForm({ ...cbForm, method: value })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="bank">{bn ? "ব্যাংক ট্রানজেকশন" : "Bank transaction"}</SelectItem><SelectItem value="cash">{bn ? "ক্যাশ" : "Cash"}</SelectItem></SelectContent>
                </Select>
                <Input value={cbForm.amount} onChange={(event) => setCbForm({ ...cbForm, amount: event.target.value })} inputMode="decimal" placeholder={bn ? "টাকার পরিমাণ" : "Amount"} className="h-11" />
                <Input type="date" value={cbForm.date} onChange={(event) => setCbForm({ ...cbForm, date: event.target.value })} className="h-11" />
                <Select value={cbForm.contra_code} onValueChange={(value) => setCbForm({ ...cbForm, contra_code: value })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{contraOptions.map((item) => <SelectItem key={item.code} value={item.code}>{`${item.label} (${item.code})`}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={cbForm.counterparty} onChange={(event) => setCbForm({ ...cbForm, counterparty: event.target.value })} placeholder={bn ? "যার সাথে লেনদেন" : "Counterparty"} className="h-11" />
                {cbForm.method === "bank" ? <Input value={cbForm.bank_name} onChange={(event) => setCbForm({ ...cbForm, bank_name: event.target.value })} placeholder={bn ? "ব্যাংকের নাম" : "Bank name"} className="h-11" /> : null}
                {cbForm.method === "bank" ? <Input value={cbForm.account_number} onChange={(event) => setCbForm({ ...cbForm, account_number: event.target.value })} placeholder={bn ? "হিসাব নম্বর" : "Account number"} className="h-11" /> : null}
                <Input value={cbForm.reference} onChange={(event) => setCbForm({ ...cbForm, reference: event.target.value })} placeholder={bn ? "রেফারেন্স / ট্রানজেকশন আইডি" : "Reference / transaction id"} className="h-11" />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <Textarea value={cbForm.note} onChange={(event) => setCbForm({ ...cbForm, note: event.target.value })} rows={2} placeholder={bn ? "বিবরণ (ঐচ্ছিক)" : "Description (optional)"} />
                <Button className="h-11 self-end" onClick={() => void saveCashEntry()} disabled={savingCb}><Plus className="mr-2 size-4" />{bn ? "এন্ট্রি সংরক্ষণ" : "Save entry"}</Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <h2 className="font-medium">{bn ? "সব ব্যাংক ও ক্যাশ এন্ট্রি" : "All bank & cash entries"}</h2>
                <Button variant="outline" size="sm" onClick={() => downloadCsv("bank-cash-entries", ["Date", "Direction", "Method", "Counterparty", "Bank", "Account", "Reference", "Contra", "Amount"], cash.map((row) => [row.txn_date, row.direction, row.method, row.counterparty || "", row.bank_name || "", row.account_number || "", row.reference || "", row.contra_code, row.amount_bdt]))} disabled={!cash.length}><Download className="mr-2 size-4" />CSV</Button>
              </div>
              {cash.length === 0 ? <StaffEmpty icon={Landmark} title={bn ? "কোনো এন্ট্রি নেই" : "No entries"} description={bn ? "উপরের ফর্ম দিয়ে প্রথম ব্যাংক বা ক্যাশ এন্ট্রি যোগ করুন।" : "Add your first bank or cash entry above."} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="p-3">{bn ? "তারিখ" : "Date"}</th><th className="p-3">{bn ? "ধরন" : "Type"}</th><th className="p-3">{bn ? "মাধ্যম" : "Method"}</th><th className="p-3">{bn ? "বিবরণ" : "Details"}</th><th className="p-3">{bn ? "হিসাব কোড" : "Contra"}</th><th className="p-3 text-right">{bn ? "পরিমাণ" : "Amount"}</th><th className="p-3" /></tr>
                    </thead>
                    <tbody>
                      {cash.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="p-3 whitespace-nowrap">{new Date(row.txn_date).toLocaleDateString(bn ? "bn-BD" : "en-US")}</td>
                          <td className={`p-3 font-medium ${row.direction === "in" ? "text-success" : "text-warning"}`}>{row.direction === "in" ? (bn ? "জমা" : "In") : (bn ? "প্রদান" : "Out")}</td>
                          <td className="p-3">{row.method === "bank" ? <span className="inline-flex items-center gap-1"><Landmark className="size-3.5" />{bn ? "ব্যাংক" : "Bank"}</span> : <span className="inline-flex items-center gap-1"><Banknote className="size-3.5" />{bn ? "ক্যাশ" : "Cash"}</span>}</td>
                          <td className="p-3 text-muted-foreground">{[row.counterparty, row.bank_name, row.account_number, row.reference, row.note].filter(Boolean).join(" · ") || "—"}</td>
                          <td className="p-3 tabular-nums text-muted-foreground">{row.contra_code}</td>
                          <td className="p-3 text-right font-semibold tabular-nums">{money(Number(row.amount_bdt))}</td>
                          <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => void removeCashEntry(row.id)} aria-label={bn ? "মুছুন" : "Delete"}><Trash2 className="size-4 text-destructive" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
