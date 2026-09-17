import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardBilling } from "@/lib/dashboard.functions";
import { logApiError } from "@/lib/errorReporting";
import { FileText, Eye, CreditCard, Building2, Loader2, History, Receipt, CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle, CalendarIcon, X, Filter, Download, Wallet } from "lucide-react";
import { BillingSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";
import InvoiceReport from "@/components/InvoiceReport";
import { formatAmount } from "@/lib/formatPrice";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DataToolbar from "@/components/DataToolbar";
import DataPagination from "@/components/DataPagination";
import { downloadCsv, csvDate } from "@/lib/export-csv";

import bkashLogo from "@/assets/partners/bkash.svg";
import nagadLogo from "@/assets/partners/nagad.svg";
import sslLogo from "@/assets/partners/ssl-wireless.png";

const statusColors: Record<string, string> = {
  paid: "bg-success/10 text-success",
  unpaid: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-info/10 text-info",
};

const statusLabels: Record<string, { bn: string; en: string }> = {
  paid: { bn: "পরিশোধিত", en: "Paid" },
  unpaid: { bn: "অপরিশোধিত", en: "Unpaid" },
  overdue: { bn: "মেয়াদোত্তীর্ণ", en: "Overdue" },
  cancelled: { bn: "বাতিল", en: "Cancelled" },
  refunded: { bn: "ফেরত", en: "Refunded" },
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  paid: CheckCircle2,
  unpaid: Clock,
  overdue: AlertTriangle,
  cancelled: XCircle,
  refunded: RotateCcw,
};

const paymentMethodLabels: Record<string, { bn: string; en: string }> = {
  sslcommerz: { bn: "SSLCommerz", en: "SSLCommerz" },
  bkash: { bn: "বিকাশ", en: "bKash" },
  nagad: { bn: "নগদ", en: "Nagad" },
  bank: { bn: "ব্যাংক ট্রান্সফার", en: "Bank Transfer" },
};

const paymentMethods = [
  { id: "wallet", label: "Wallet", labelBn: "ওয়ালেট", icon: Wallet, desc: "Pay from your wallet balance", descBn: "ওয়ালেট ব্যালেন্স থেকে পে করুন", ready: true },
  { id: "sslcommerz", label: "SSLCommerz", labelBn: "SSLCommerz", logo: sslLogo, desc: "Visa, Master, bKash, Nagad, Mobile Banking", descBn: "ভিসা, মাস্টার, বিকাশ, নগদ, মোবাইল ব্যাংকিং", ready: true },
  { id: "bkash", label: "bKash", labelBn: "বিকাশ", logo: bkashLogo, desc: "bKash Tokenized Payment", descBn: "বিকাশ টোকেনাইজড পেমেন্ট", ready: false },
  { id: "nagad", label: "Nagad", labelBn: "নগদ", logo: nagadLogo, desc: "Nagad Digital Payment", descBn: "নগদ ডিজিটাল পেমেন্ট", ready: false },
  { id: "bank", label: "Bank Transfer", labelBn: "ব্যাংক ট্রান্সফার", icon: Building2, desc: "Manual Bank Transfer", descBn: "ম্যানুয়াল ব্যাংক ট্রান্সফার", ready: true },
];

type TabType = "invoices" | "history" | "chart";

const DashboardBilling = () => {
  const { user } = useAuth();
  const { tr, lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const [reportInvoice, setReportInvoice] = useState<Tables<"invoices"> | null>(null);
  const [payInvoice, setPayInvoice] = useState<Tables<"invoices"> | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [paying, setPaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("invoices");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [invSearch, setInvSearch] = useState("");
  const [invStatus, setInvStatus] = useState("all");

  // Billing data is fetched on the server (server function -> Supabase) so the
  // page renders with real data and stays identical across domains/environments.
  const fetchBilling = useServerFn(getDashboardBilling);
  const billingQuery = useQuery({
    queryKey: ["dashboard", "billing", user?.id ?? "anon"],
    queryFn: () => fetchBilling(),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (billingQuery.error) logApiError("dashboard.billing", billingQuery.error, { area: "billing" });
  }, [billingQuery.error]);

  const invoices: Tables<"invoices">[] = billingQuery.data?.invoices ?? [];
  const walletBalance = billingQuery.data?.walletBalance ?? 0;
  const loading = !!user && billingQuery.isPending;

  const fetchInvoices = () => { void billingQuery.refetch(); };
  const fetchWalletBalance = () => { void billingQuery.refetch(); };


  const handlePay = async () => {
    if (!payInvoice || !selectedPayment) return;

    if (selectedPayment === "wallet") {
      const amount = Number(payInvoice.amount_bdt);
      if (walletBalance < amount) {
        toast({
          title: isBn ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient Balance",
          description: isBn
            ? `আপনার ওয়ালেটে ৳${formatAmount(walletBalance, lang)} আছে, কিন্তু ৳${formatAmount(amount, lang)} প্রয়োজন।`
            : `Your wallet has ৳${formatAmount(walletBalance, lang)}, but ৳${formatAmount(amount, lang)} is required.`,
          variant: "destructive",
        });
        return;
      }
      setPaying(true);
      try {
        const { data, error } = await supabase.functions.invoke("wallet-pay-invoice", {
          body: { invoice_id: payInvoice.id },
        });
        if (error || !data?.success) {
          toast({
            title: isBn ? "ত্রুটি" : "Error",
            description: data?.error || (isBn ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment failed"),
            variant: "destructive",
          });
        } else {
          toast({
            title: isBn ? "সফল!" : "Success!",
            description: isBn
              ? `৳${formatAmount(amount, lang)} ওয়ালেট থেকে পরিশোধ করা হয়েছে`
              : `৳${formatAmount(amount, lang)} paid from wallet`,
          });
          setPayInvoice(null);
          setSelectedPayment("");
          fetchInvoices();
          fetchWalletBalance();
        }
      } catch {
        toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট প্রসেসিং এ সমস্যা" : "Payment processing error", variant: "destructive" });
      }
      setPaying(false);
      return;
    }

    if (selectedPayment === "bank") {
      toast({
        title: isBn ? "ব্যাংক ট্রান্সফার" : "Bank Transfer",
        description: isBn
          ? `৳${formatAmount(Number(payInvoice.amount_bdt), lang)} ব্যাংক ট্রান্সফার করুন এবং রেফারেন্সে "${payInvoice.invoice_number}" উল্লেখ করুন। পেমেন্ট নিশ্চিত হলে আমরা আপনাকে জানাবো।`
          : `Please transfer ৳${formatAmount(Number(payInvoice.amount_bdt), lang)} and mention "${payInvoice.invoice_number}" as reference. We'll confirm once payment is verified.`,
      });
      setPayInvoice(null);
      setSelectedPayment("");
      return;
    }

    if (selectedPayment === "sslcommerz") {
      setPaying(true);
      try {
        const { data, error } = await supabase.functions.invoke("sslcommerz-init", {
          body: {
            amount: Number(payInvoice.amount_bdt),
            invoice_number: payInvoice.invoice_number,
            invoice_id: payInvoice.id,
            customer_name: user?.user_metadata?.full_name || "Customer",
            customer_email: user?.email || "",
          },
        });
        if (error || !data?.gateway_url) {
          toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট সেশন শুরু করা যায়নি" : "Failed to initiate payment", variant: "destructive" });
        } else {
          window.location.href = data.gateway_url;
        }
      } catch {
        toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট প্রসেসিং এ সমস্যা হয়েছে" : "Payment processing error", variant: "destructive" });
      }
      setPaying(false);
      return;
    }

    if (selectedPayment === "bkash" || selectedPayment === "nagad") {
      setPaying(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          selectedPayment === "bkash" ? "bkash-init" : "nagad-init",
          {
            body: {
              amount: Number(payInvoice.amount_bdt),
              invoice_id: payInvoice.id,
              invoice_number: payInvoice.invoice_number,
              payer_reference: user?.email || "",
              callback_url: `${window.location.origin}/dashboard/billing`,
            },
          },
        );
        const gatewayUrl = data?.gateway_url || data?.bkashURL || data?.callBackUrl;
        if (gatewayUrl) {
          window.location.href = gatewayUrl;
          return;
        }
        toast({
          title: isBn ? "এই মাধ্যমটি এখনো চালু হয়নি" : "This method isn't live yet",
          description: isBn
            ? `${selectedPayment === "bkash" ? "বিকাশ" : "নগদ"} পেমেন্ট এখনো সক্রিয় করা হয়নি। এখন SSLCommerz (কার্ড/মোবাইল ব্যাংকিং), ওয়ালেট অথবা ব্যাংক ট্রান্সফার ব্যবহার করুন।`
            : `${selectedPayment === "bkash" ? "bKash" : "Nagad"} is not activated yet. Please use SSLCommerz (card/mobile banking), wallet or bank transfer for now.`,
          variant: "destructive",
        });
        if (error) console.error("[billing] gateway init failed", error);
      } catch (err) {
        console.error("[billing] payment error", err);
        toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট প্রসেসিং এ সমস্যা হয়েছে" : "Payment processing error", variant: "destructive" });
      }
      setPaying(false);
      return;
    }

    toast({
      title: isBn ? "মাধ্যম নির্বাচন করুন" : "Select a method",
      description: isBn
        ? "অনুগ্রহ করে একটি সক্রিয় পেমেন্ট মাধ্যম বেছে নিন।"
        : "Please choose an available payment method.",
      variant: "destructive",
    });
  };

  const paidInvoicesAll = useMemo(() => invoices.filter(i => i.status === "paid" || i.status === "refunded"), [invoices]);

  const paidInvoices = useMemo(() => {
    return paidInvoicesAll.filter(inv => {
      if (filterMethod !== "all" && (inv.payment_method || "") !== filterMethod) return false;
      const paidDate = inv.paid_at ? new Date(inv.paid_at) : null;
      if (!paidDate) return true;
      if (dateFrom && paidDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (paidDate > endOfDay) return false;
      }
      return true;
    });
  }, [paidInvoicesAll, dateFrom, dateTo, filterMethod]);


  const downloadHistoryPdf = () => {
    const doc = new jsPDF();
    const title = isBn ? "Payment History Report" : "Payment History Report";
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    const filterInfo: string[] = [];
    if (dateFrom) filterInfo.push(`From: ${format(dateFrom, "dd MMM yyyy")}`);
    if (dateTo) filterInfo.push(`To: ${format(dateTo, "dd MMM yyyy")}`);
    if (filterMethod !== "all") {
      const ml = paymentMethodLabels[filterMethod];
      filterInfo.push(`Method: ${ml ? (isBn ? ml.bn : ml.en) : filterMethod}`);
    }
    if (filterInfo.length > 0) {
      doc.text(filterInfo.join("  |  "), 14, 28);
    }

    doc.setFontSize(9);
    const startY = filterInfo.length > 0 ? 36 : 30;
    const headers = ["Invoice", "Amount (BDT)", "Method", "Status", "Date"];
    const colX = [14, 50, 90, 130, 160];

    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => doc.text(h, colX[i], startY));
    doc.setFont("helvetica", "normal");

    let y = startY + 6;
    paidInvoices.forEach((inv) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const pmLabel = inv.payment_method
        ? (paymentMethodLabels[inv.payment_method]?.[isBn ? "bn" : "en"] || inv.payment_method)
        : "-";
      const sl = statusLabels[inv.status] || { bn: inv.status, en: inv.status };
      const dateStr = inv.paid_at
        ? new Date(inv.paid_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "-";

      doc.text(inv.invoice_number, colX[0], y);
      doc.text(`${Number(inv.amount_bdt).toLocaleString()}`, colX[1], y);
      doc.text(pmLabel, colX[2], y);
      doc.text(isBn ? sl.bn : sl.en, colX[3], y);
      doc.text(dateStr, colX[4], y);
      y += 6;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    const total = paidInvoices.reduce((s, i) => s + Number(i.amount_bdt), 0);
    doc.text(`Total: ${total.toLocaleString()} BDT`, 14, y);

    doc.save(`payment-history-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };
  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, 0);
    }
    paidInvoicesAll.forEach(inv => {
      if (!inv.paid_at) return;
      const d = new Date(inv.paid_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(inv.amount_bdt));
    });
    return Array.from(map.entries()).map(([month, amount]) => {
      const [y, m] = month.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short" });
      return { month: label, amount };
    });
  }, [paidInvoicesAll, isBn]);

  const filteredInvoices = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return invoices.filter(i => {
      const okSearch = !q || [i.invoice_number, i.description, i.status, i.payment_method, String(i.amount_bdt)]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      const okStatus = invStatus === "all" || i.status === invStatus;
      return okSearch && okStatus;
    });
  }, [invoices, invSearch, invStatus]);

  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(10);
  useEffect(() => { setInvPage(1); }, [invSearch, invStatus]);
  const pagedInvoices = useMemo(
    () => filteredInvoices.slice((invPage - 1) * invPageSize, invPage * invPageSize),
    [filteredInvoices, invPage, invPageSize]
  );

  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(10);
  useEffect(() => { setHistPage(1); }, [dateFrom, dateTo, filterMethod]);
  const pagedHistory = useMemo(
    () => paidInvoices.slice((histPage - 1) * histPageSize, histPage * histPageSize),
    [paidInvoices, histPage, histPageSize]
  );

  const invoiceFilters = useMemo(() => ([
    { value: "all", label: isBn ? "সব" : "All", count: invoices.length },
    { value: "unpaid", label: isBn ? "অপরিশোধিত" : "Unpaid", count: invoices.filter(i => i.status === "unpaid").length },
    { value: "overdue", label: isBn ? "মেয়াদোত্তীর্ণ" : "Overdue", count: invoices.filter(i => i.status === "overdue").length },
    { value: "paid", label: isBn ? "পরিশোধিত" : "Paid", count: invoices.filter(i => i.status === "paid").length },
    { value: "cancelled", label: isBn ? "বাতিল" : "Cancelled", count: invoices.filter(i => i.status === "cancelled").length },
  ]), [invoices, isBn]);

  if (loading) return <BillingSkeleton />;

  const totalDue = invoices.filter(i => i.status === "unpaid" || i.status === "overdue").reduce((sum, i) => sum + Number(i.amount_bdt), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount_bdt), 0);
  const unpaidInvoices = invoices.filter(i => i.status === "unpaid" || i.status === "overdue");

  const exportInvoices = () => {
    downloadCsv(
      "yesshost-invoices",
      ["invoice_number", "description", "amount_bdt", "status", "due_date", "paid_at", "payment_method"],
      filteredInvoices.map(i => [
        i.invoice_number, i.description || "", i.amount_bdt, i.status,
        csvDate(i.due_date), csvDate(i.paid_at), i.payment_method || "",
      ]),
    );
  };


  const tabs: { id: TabType; label: string; icon: typeof FileText; count?: number }[] = [
    { id: "invoices", label: isBn ? "ইনভয়েস" : "Invoices", icon: FileText, count: invoices.length },
    { id: "history", label: isBn ? "পেমেন্ট হিস্ট্রি" : "Payment History", icon: History, count: paidInvoicesAll.length },
    { id: "chart", label: isBn ? "মাসিক সামারি" : "Monthly Summary", icon: BarChart3 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{tr("dash.billingTitle")}</h1>
        <p className="text-sm text-muted-foreground">{tr("dash.billingSubtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{tr("dash.totalInvoices")}</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{isBn ? "বকেয়া ইনভয়েস" : "Unpaid"}</p>
          <p className="text-2xl font-bold text-warning">{unpaidInvoices.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{tr("dash.totalDue")}</p>
          <p className="text-2xl font-bold text-warning">৳{formatAmount(totalDue, lang)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{tr("dash.totalPaid")}</p>
          <p className="text-2xl font-bold text-success">৳{formatAmount(totalPaid, lang)}</p>
        </div>
      </div>

      {/* Due Soon Alert */}
      {(() => {
        const dueSoon = invoices.filter(i => {
          if (i.status !== "unpaid" && i.status !== "overdue") return false;
          if (!i.due_date) return false;
          const diff = Math.ceil((new Date(i.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return diff <= 3;
        });
        if (dueSoon.length === 0) return null;
        return (
          <div className="mb-5 p-3 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isBn ? `${dueSoon.length}টি ইনভয়েস শীঘ্রই পরিশোধযোগ্য!` : `${dueSoon.length} invoice(s) due soon!`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn ? "বিলম্ব ফি এড়াতে অনুগ্রহ করে এখনই পরিশোধ করুন" : "Please pay now to avoid late fees"}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 border border-border/50 mb-5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-primary-foreground/20" : "bg-secondary"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <>
          {invoices.length > 0 && (
            <div className="mb-4">
              <DataToolbar
                search={invSearch}
                onSearch={setInvSearch}
                placeholder={isBn ? "ইনভয়েস নম্বর বা বিবরণ খুঁজুন..." : "Search invoice no. or description..."}
                filters={invoiceFilters}
                activeFilter={invStatus}
                onFilter={setInvStatus}
                onExport={exportInvoices}
                resultCount={filteredInvoices.length}
              />
            </div>
          )}
          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={tr("dash.noInvoicesTitle")}
              description={tr("dash.noInvoicesDesc")}
            />
          ) : filteredInvoices.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
              {isBn ? "এই ফিল্টারে কোনো ইনভয়েস নেই" : "No invoices match this filter"}
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{tr("dash.invoiceNo")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{tr("dash.description")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{tr("dash.amount")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{tr("dash.status")}</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">{tr("dash.dueDate")}</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "অ্যাকশন" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInvoices.map((inv) => {
                      const canPay = inv.status === "unpaid" || inv.status === "overdue";
                      const sl = statusLabels[inv.status] || { bn: inv.status, en: inv.status };
                      return (
                        <tr key={inv.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-mono text-xs text-primary font-semibold">{inv.invoice_number}</p>
                            <p className="text-[11px] text-muted-foreground md:hidden mt-0.5">{inv.description || "-"}</p>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{inv.description || "-"}</td>
                          <td className="px-4 py-3.5 font-bold text-foreground tabular-nums">৳{formatAmount(Number(inv.amount_bdt), lang)}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[inv.status]}`}>
                              {isBn ? sl.bn : sl.en}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground text-sm hidden sm:table-cell">{inv.due_date ? new Date(inv.due_date).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {canPay && (
                                <Button
                                  size="sm"
                                  onClick={() => { setPayInvoice(inv); setSelectedPayment(""); }}
                                  className="gap-1.5 text-xs h-8"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  {isBn ? "পে করুন" : "Pay Now"}
                                </Button>
                              )}
                              <button
                                onClick={() => setReportInvoice(inv)}
                                className="p-1.5 rounded-lg hover:bg-secondary/60 text-primary hover:text-primary/80 transition-colors"
                                title={isBn ? "রিপোর্ট দেখুন" : "View Report"}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <DataPagination
                  total={filteredInvoices.length}
                  page={invPage}
                  pageSize={invPageSize}
                  onPage={setInvPage}
                  onPageSize={setInvPageSize}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment History Tab */}
      {activeTab === "history" && (
        <>
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-8", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateFrom ? format(dateFrom, "dd MMM yyyy") : (isBn ? "শুরুর তারিখ" : "From")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">—</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs h-8", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateTo ? format(dateTo, "dd MMM yyyy") : (isBn ? "শেষ তারিখ" : "To")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="h-8 text-xs rounded-lg border border-border bg-secondary/20 px-2 py-1 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="all">{isBn ? "সব মেথড" : "All Methods"}</option>
                <option value="sslcommerz">SSLCommerz</option>
                <option value="bkash">{isBn ? "বিকাশ" : "bKash"}</option>
                <option value="nagad">{isBn ? "নগদ" : "Nagad"}</option>
                <option value="bank">{isBn ? "ব্যাংক ট্রান্সফার" : "Bank Transfer"}</option>
              </select>
            </div>

            {(dateFrom || dateTo || filterMethod !== "all") && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setFilterMethod("all"); }}>
                <X className="w-3 h-3" />
                {isBn ? "রিসেট" : "Reset"}
              </Button>
            )}
            {(dateFrom || dateTo || filterMethod !== "all") && (
              <span className="text-[11px] text-muted-foreground ml-1">
                {paidInvoices.length}/{paidInvoicesAll.length} {isBn ? "টি ফলাফল" : "results"}
              </span>
            )}
            {/* Download PDF */}
            {paidInvoices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 ml-auto"
                onClick={() => downloadHistoryPdf()}
              >
                <Download className="w-3.5 h-3.5" />
                {isBn ? "PDF ডাউনলোড" : "Download PDF"}
              </Button>
            )}
          </div>

          {paidInvoices.length === 0 ? (
            <EmptyState
              icon={History}
              title={isBn ? "কোনো পেমেন্ট হিস্ট্রি নেই" : "No Payment History"}
              description={isBn ? "আপনার এখনো কোনো সম্পন্ন পেমেন্ট নেই" : "You don't have any completed payments yet"}
            />
          ) : (
            <div className="space-y-3">
              {pagedHistory.map((inv) => {
                const StatusIcon = statusIcons[inv.status] || CheckCircle2;
                const sl = statusLabels[inv.status] || { bn: inv.status, en: inv.status };
                const pmLabel = inv.payment_method
                  ? (paymentMethodLabels[inv.payment_method]?.[isBn ? "bn" : "en"] || inv.payment_method)
                  : (isBn ? "অনির্ধারিত" : "Unknown");

                // Extract TXN ID from description if available
                const txnMatch = inv.description?.match(/TXN:\s*(TXN-[^\s|]+)/);
                const txnId = txnMatch?.[1] || null;

                return (
                  <div key={inv.id} className="glass-card rounded-xl p-4 hover:bg-secondary/5 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg shrink-0 ${statusColors[inv.status]}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">
                            ৳{formatAmount(Number(inv.amount_bdt), lang)}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status]}`}>
                            {isBn ? sl.bn : sl.en}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground truncate">
                          {inv.description?.replace(/\s*\|\s*TXN:.*$/, "") || (isBn ? "ইনভয়েস পেমেন্ট" : "Invoice Payment")}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            {inv.invoice_number}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {pmLabel}
                          </span>
                          {inv.paid_at && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(inv.paid_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                              {" "}
                              {new Date(inv.paid_at).toLocaleTimeString(isBn ? "bn-BD" : "en-US", {
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        {txnId && (
                          <div className="mt-2 px-2 py-1 rounded-md bg-secondary/40 inline-block">
                            <p className="text-[10px] font-mono text-muted-foreground">
                              TXN: {txnId}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Report Button */}
                      <button
                        onClick={() => setReportInvoice(inv)}
                        className="p-2 rounded-lg hover:bg-secondary/60 text-primary hover:text-primary/80 transition-colors shrink-0"
                        title={isBn ? "রিপোর্ট দেখুন" : "View Report"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <DataPagination
                total={paidInvoices.length}
                page={histPage}
                pageSize={histPageSize}
                onPage={setHistPage}
                onPageSize={setHistPageSize}
              />
            </div>
          )}
        </>
      )}

      {/* Monthly Chart Tab */}
      {activeTab === "chart" && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {isBn ? "গত ৬ মাসের পেমেন্ট সামারি" : "Last 6 Months Payment Summary"}
          </h3>
          {monthlyData.every(d => d.amount === 0) ? (
            <EmptyState
              icon={BarChart3}
              title={isBn ? "কোনো ডেটা নেই" : "No Data"}
              description={isBn ? "গত ৬ মাসে কোনো পেমেন্ট পাওয়া যায়নি" : "No payments found in the last 6 months"}
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, isBn ? "পরিমাণ" : "Amount"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!payInvoice} onOpenChange={() => { setPayInvoice(null); setSelectedPayment(""); }}>
        <DialogContent className="max-w-md">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">{isBn ? "ইনভয়েস পেমেন্ট" : "Invoice Payment"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isBn ? "ইনভয়েস" : "Invoice"}: <span className="font-mono text-primary font-semibold">{payInvoice?.invoice_number}</span>
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isBn ? "পরিশোধযোগ্য পরিমাণ" : "Amount Due"}</p>
                <p className="text-2xl font-bold text-foreground">৳{formatAmount(Number(payInvoice?.amount_bdt || 0), lang)}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[payInvoice?.status || "unpaid"]}`}>
                {isBn ? statusLabels[payInvoice?.status || "unpaid"].bn : statusLabels[payInvoice?.status || "unpaid"].en}
              </div>
            </div>

            {payInvoice?.description && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{isBn ? "বিবরণ:" : "Description:"}</span> {payInvoice.description}
              </p>
            )}

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">{isBn ? "পেমেন্ট মেথড নির্বাচন করুন" : "Select Payment Method"}</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedPayment(pm.id)}
                      disabled={!pm.ready}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedPayment === pm.id
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                          : "border-border/50 hover:border-border bg-secondary/20 hover:bg-secondary/40"
                      } ${!pm.ready ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {pm.logo ? (
                        <img src={pm.logo} alt={pm.label} className="h-7 object-contain" />
                      ) : Icon ? (
                        <Icon className="w-7 h-7 text-muted-foreground" />
                      ) : null}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-foreground">{isBn ? pm.labelBn : pm.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{isBn ? pm.descBn : pm.desc}</p>
                      </div>
                      {!pm.ready && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                          {isBn ? "শীঘ্রই" : "Soon"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {paymentMethods.some((pm) => !pm.ready) && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  {isBn
                    ? "বিকাশ ও নগদ সরাসরি এখনো চালু হয়নি। তবে SSLCommerz দিয়ে বিকাশ, নগদ, কার্ড ও মোবাইল ব্যাংকিং — সবই ব্যবহার করা যায়।"
                    : "Direct bKash and Nagad aren't live yet. SSLCommerz already covers bKash, Nagad, cards and mobile banking."}
                </p>
              )}

              {/* Wallet balance indicator */}
              {selectedPayment === "wallet" && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  walletBalance >= Number(payInvoice?.amount_bdt || 0)
                    ? "border-success/30 bg-success/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isBn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}</span>
                    <span className={`text-sm font-bold ${
                      walletBalance >= Number(payInvoice?.amount_bdt || 0) ? "text-success" : "text-destructive"
                    }`}>
                      ৳{formatAmount(walletBalance, lang)}
                    </span>
                  </div>
                  {walletBalance < Number(payInvoice?.amount_bdt || 0) && (
                    <p className="text-[10px] text-destructive mt-1">
                      {isBn ? "অপর্যাপ্ত ব্যালেন্স। অনুগ্রহ করে প্রথমে ফান্ড যোগ করুন।" : "Insufficient balance. Please add funds first."}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handlePay}
                disabled={!selectedPayment || paying}
                className="flex-1 gap-2"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {paying
                  ? (isBn ? "প্রসেসিং..." : "Processing...")
                  : (isBn ? "পেমেন্ট করুন" : "Proceed to Pay")}
              </Button>
              <Button variant="outline" onClick={() => { setPayInvoice(null); setSelectedPayment(""); }}>
                {isBn ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceReport
        invoice={reportInvoice}
        open={!!reportInvoice}
        onClose={() => setReportInvoice(null)}
      />
    </div>
  );
};

export default DashboardBilling;
