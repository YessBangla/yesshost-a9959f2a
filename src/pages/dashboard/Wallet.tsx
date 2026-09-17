import { useEffect, useState, useMemo } from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, Building2, Loader2, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";
import { BillingSkeleton } from "@/components/DashboardSkeleton";
import DataToolbar from "@/components/DataToolbar";
import DataPagination from "@/components/DataPagination";
import { downloadCsv, csvDate } from "@/lib/export-csv";

import bkashLogo from "@/assets/partners/bkash.svg";
import nagadLogo from "@/assets/partners/nagad.svg";
import sslLogo from "@/assets/partners/ssl-wireless.png";

const paymentMethods = [
  { id: "sslcommerz", label: "SSLCommerz", labelBn: "SSLCommerz", logo: sslLogo, desc: "Visa, Master, bKash, Nagad, Mobile Banking", descBn: "ভিসা, মাস্টার, বিকাশ, নগদ, মোবাইল ব্যাংকিং", ready: true },
  { id: "bkash", label: "bKash", labelBn: "বিকাশ", logo: bkashLogo, desc: "bKash Tokenized Payment", descBn: "বিকাশ টোকেনাইজড পেমেন্ট", ready: false },
  { id: "nagad", label: "Nagad", labelBn: "নগদ", logo: nagadLogo, desc: "Nagad Digital Payment", descBn: "নগদ ডিজিটাল পেমেন্ট", ready: false },
  { id: "bank", label: "Bank Transfer", labelBn: "ব্যাংক ট্রান্সফার", icon: Building2, desc: "Manual Bank Transfer", descBn: "ম্যানুয়াল ব্যাংক ট্রান্সফার", ready: true },
];

const quickAmounts = [500, 1000, 2000, 5000, 10000];

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; labelBn: string; labelEn: string }> = {
  completed: { icon: CheckCircle2, color: "bg-success/10 text-success", labelBn: "সম্পন্ন", labelEn: "Completed" },
  pending: { icon: Clock, color: "bg-warning/10 text-warning", labelBn: "অপেক্ষমাণ", labelEn: "Pending" },
  failed: { icon: XCircle, color: "bg-destructive/10 text-destructive", labelBn: "ব্যর্থ", labelEn: "Failed" },
  cancelled: { icon: AlertTriangle, color: "bg-muted text-muted-foreground", labelBn: "বাতিল", labelEn: "Cancelled" },
};

const typeLabels: Record<string, { bn: string; en: string; icon: typeof ArrowUpRight }> = {
  deposit: { bn: "জমা", en: "Deposit", icon: ArrowDownLeft },
  withdrawal: { bn: "উত্তোলন", en: "Withdrawal", icon: ArrowUpRight },
  payment: { bn: "পেমেন্ট", en: "Payment", icon: ArrowUpRight },
  refund: { bn: "ফেরত", en: "Refund", icon: ArrowDownLeft },
};

interface WalletTransaction {
  id: string;
  user_id: string;
  type: string;
  amount_bdt: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const DashboardWallet = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFund, setShowAddFund] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnType, setTxnType] = useState("all");

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTransactions((data as WalletTransaction[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("wallet-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` }, () => {
        fetchTransactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const balance = useMemo(() => {
    return transactions
      .filter(t => t.status === "completed")
      .reduce((sum, t) => {
        if (t.type === "deposit" || t.type === "refund") return sum + Number(t.amount_bdt);
        return sum - Number(t.amount_bdt);
      }, 0);
  }, [transactions]);

  const totalDeposited = useMemo(() =>
    transactions.filter(t => t.status === "completed" && t.type === "deposit").reduce((s, t) => s + Number(t.amount_bdt), 0),
    [transactions]
  );

  const totalSpent = useMemo(() =>
    transactions.filter(t => t.status === "completed" && t.type === "payment").reduce((s, t) => s + Number(t.amount_bdt), 0),
    [transactions]
  );

  const filteredTxns = useMemo(() => {
    const q = txnSearch.trim().toLowerCase();
    return transactions.filter(t => {
      const okSearch = !q || [t.description, t.type, t.status, t.payment_method, String(t.amount_bdt)]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      const okType = txnType === "all" || t.type === txnType;
      return okSearch && okType;
    });
  }, [transactions, txnSearch, txnType]);

  const [txnPage, setTxnPage] = useState(1);
  const [txnPageSize, setTxnPageSize] = useState(10);
  useEffect(() => { setTxnPage(1); }, [txnSearch, txnType]);
  const pagedTxns = useMemo(
    () => filteredTxns.slice((txnPage - 1) * txnPageSize, txnPage * txnPageSize),
    [filteredTxns, txnPage, txnPageSize]
  );

  const txnFilters = useMemo(() => ([
    { value: "all", label: isBn ? "সব" : "All", count: transactions.length },
    { value: "deposit", label: isBn ? "জমা" : "Deposit", count: transactions.filter(t => t.type === "deposit").length },
    { value: "payment", label: isBn ? "পেমেন্ট" : "Payment", count: transactions.filter(t => t.type === "payment").length },
    { value: "refund", label: isBn ? "ফেরত" : "Refund", count: transactions.filter(t => t.type === "refund").length },
  ]), [transactions, isBn]);

  const exportTransactions = () => {
    downloadCsv(
      "yesshost-wallet",
      ["date", "type", "status", "description", "payment_method", "amount_bdt"],
      filteredTxns.map(t => [csvDate(t.created_at), t.type, t.status, t.description || "", (t as any).payment_method || "", t.amount_bdt]),
    );
  };



  const handleAddFund = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "সর্বনিম্ন ১০০ টাকা জমা দিতে হবে" : "Minimum deposit is ৳100", variant: "destructive" });
      return;
    }
    if (!selectedMethod) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট মেথড নির্বাচন করুন" : "Select a payment method", variant: "destructive" });
      return;
    }

    if (selectedMethod === "bank") {
      // Create pending transaction and show bank details
      await supabase.from("wallet_transactions").insert({
        user_id: user!.id,
        type: "deposit",
        amount_bdt: numAmount,
        status: "pending",
        payment_method: "bank",
        description: isBn ? "ব্যাংক ট্রান্সফারে ফান্ড জমা" : "Fund deposit via Bank Transfer",
      });
      toast({
        title: isBn ? "ব্যাংক ট্রান্সফার" : "Bank Transfer",
        description: isBn
          ? `৳${formatAmount(numAmount, lang)} ব্যাংক ট্রান্সফার করুন। পেমেন্ট ভেরিফাই হলে আপনার ব্যালেন্সে যুক্ত হবে।`
          : `Please transfer ৳${formatAmount(numAmount, lang)}. Your balance will be updated once verified.`,
      });
      setShowAddFund(false);
      setAmount("");
      setSelectedMethod("");
      fetchTransactions();
      return;
    }

    if (selectedMethod === "sslcommerz") {
      setProcessing(true);
      try {
        // Create pending transaction first
        const { data: txn } = await supabase.from("wallet_transactions").insert({
          user_id: user!.id,
          type: "deposit",
          amount_bdt: numAmount,
          status: "pending",
          payment_method: "sslcommerz",
          description: isBn ? "SSLCommerz দিয়ে ফান্ড জমা" : "Fund deposit via SSLCommerz",
        }).select().single();

        const { data, error } = await supabase.functions.invoke("sslcommerz-init", {
          body: {
            amount: numAmount,
            invoice_number: `WALLET-${txn?.id?.slice(0, 8).toUpperCase()}`,
            invoice_id: txn?.id,
            customer_name: user?.user_metadata?.full_name || "Customer",
            customer_email: user?.email || "",
            is_wallet_deposit: true,
          },
        });
        if (error || !data?.gateway_url) {
          toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট সেশন শুরু করা যায়নি" : "Failed to initiate payment", variant: "destructive" });
        } else {
          window.location.href = data.gateway_url;
        }
      } catch {
        toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট প্রসেসিং এ সমস্যা" : "Payment processing error", variant: "destructive" });
      }
      setProcessing(false);
      return;
    }

    if (selectedMethod === "bkash" || selectedMethod === "nagad") {
      setProcessing(true);
      try {
        const { data: txn } = await supabase.from("wallet_transactions").insert({
          user_id: user!.id,
          type: "deposit",
          amount_bdt: numAmount,
          status: "pending",
          payment_method: selectedMethod,
          description: isBn
            ? `${selectedMethod === "bkash" ? "বিকাশ" : "নগদ"} দিয়ে ফান্ড জমা`
            : `Fund deposit via ${selectedMethod === "bkash" ? "bKash" : "Nagad"}`,
        }).select().single();

        const { data, error } = await supabase.functions.invoke(
          selectedMethod === "bkash" ? "bkash-init" : "nagad-init",
          {
            body: {
              amount: numAmount,
              invoice_id: txn?.id,
              invoice_number: `WALLET-${txn?.id?.slice(0, 8).toUpperCase()}`,
              payer_reference: user?.email || "",
              is_wallet_deposit: true,
              callback_url: `${window.location.origin}/dashboard/wallet`,
            },
          },
        );

        const gatewayUrl = data?.gateway_url || data?.bkashURL || data?.callBackUrl;
        if (gatewayUrl) {
          window.location.href = gatewayUrl;
          return;
        }

        if (txn?.id) {
          await supabase.from("wallet_transactions").update({ status: "cancelled" }).eq("id", txn.id);
        }
        toast({
          title: isBn ? "এই মাধ্যমটি এখনো চালু হয়নি" : "This method isn't live yet",
          description: isBn
            ? `${selectedMethod === "bkash" ? "বিকাশ" : "নগদ"} পেমেন্ট এখনো সক্রিয় করা হয়নি। এখন SSLCommerz (কার্ড/মোবাইল ব্যাংকিং) অথবা ব্যাংক ট্রান্সফার ব্যবহার করুন।`
            : `${selectedMethod === "bkash" ? "bKash" : "Nagad"} is not activated yet. Please use SSLCommerz (card/mobile banking) or bank transfer for now.`,
          variant: "destructive",
        });
        if (error) console.error("[wallet] gateway init failed", error);
      } catch (err) {
        console.error("[wallet] payment error", err);
        toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "পেমেন্ট প্রসেসিং এ সমস্যা" : "Payment processing error", variant: "destructive" });
      }
      setProcessing(false);
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

  if (loading) return <BillingSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isBn ? "ওয়ালেট" : "Wallet"}</h1>
          <p className="text-sm text-muted-foreground">{isBn ? "আপনার ফান্ড ব্যালেন্স ও লেনদেন" : "Your fund balance & transactions"}</p>
        </div>
        <Button onClick={() => setShowAddFund(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {isBn ? "ফান্ড যোগ করুন" : "Add Fund"}
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-6 -mt-6" />
          <Wallet className="w-5 h-5 text-primary mb-2" />
          <p className="text-xs text-muted-foreground mb-1">{isBn ? "বর্তমান ব্যালেন্স" : "Current Balance"}</p>
          <p className="text-3xl font-bold text-foreground">৳{formatAmount(balance, lang)}</p>
        </div>
        <div className="glass-card p-5">
          <ArrowDownLeft className="w-5 h-5 text-success mb-2" />
          <p className="text-xs text-muted-foreground mb-1">{isBn ? "মোট জমা" : "Total Deposited"}</p>
          <p className="text-2xl font-bold text-success">৳{formatAmount(totalDeposited, lang)}</p>
        </div>
        <div className="glass-card p-5">
          <ArrowUpRight className="w-5 h-5 text-warning mb-2" />
          <p className="text-xs text-muted-foreground mb-1">{isBn ? "মোট ব্যয়" : "Total Spent"}</p>
          <p className="text-2xl font-bold text-warning">৳{formatAmount(totalSpent, lang)}</p>
        </div>
      </div>

      {/* Transaction History */}
      <h2 className="text-base font-semibold text-foreground mb-3">{isBn ? "লেনদেনের ইতিহাস" : "Transaction History"}</h2>
      {transactions.length > 0 && (
        <div className="mb-4">
          <DataToolbar
            search={txnSearch}
            onSearch={setTxnSearch}
            placeholder={isBn ? "বিবরণ, ধরন বা পরিমাণ খুঁজুন..." : "Search description, type or amount..."}
            filters={txnFilters}
            activeFilter={txnType}
            onFilter={setTxnType}
            onExport={exportTransactions}
            resultCount={filteredTxns.length}
          />
        </div>
      )}
      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={isBn ? "কোনো লেনদেন নেই" : "No Transactions"}
          description={isBn ? "আপনার ওয়ালেটে এখনো কোনো লেনদেন হয়নি" : "Your wallet has no transactions yet"}
        />
      ) : filteredTxns.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
          {isBn ? "এই ফিল্টারে কোনো লেনদেন নেই" : "No transactions match this filter"}
        </div>
      ) : (
        <div className="space-y-2.5">
          {pagedTxns.map(txn => {
            const sc = statusConfig[txn.status] || statusConfig.pending;
            const tl = typeLabels[txn.type] || typeLabels.deposit;
            const TypeIcon = tl.icon;
            const StatusIcon = sc.icon;
            const isCredit = txn.type === "deposit" || txn.type === "refund";

            return (
              <div key={txn.id} className="glass-card rounded-xl p-4 hover:bg-secondary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${isCredit ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {isCredit ? "+" : "-"}৳{formatAmount(Number(txn.amount_bdt), lang)}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                        {isBn ? sc.labelBn : sc.labelEn}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {txn.description || (isBn ? tl.bn : tl.en)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {txn.payment_method && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {txn.payment_method}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(txn.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <DataPagination
            total={filteredTxns.length}
            page={txnPage}
            pageSize={txnPageSize}
            onPage={setTxnPage}
            onPageSize={setTxnPageSize}
          />
        </div>
      )}

      {/* Add Fund Dialog */}
      <Dialog open={showAddFund} onOpenChange={() => { setShowAddFund(false); setAmount(""); setSelectedMethod(""); }}>
        <DialogContent className="max-w-md">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">{isBn ? "ফান্ড যোগ করুন" : "Add Fund"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isBn ? "আপনার ওয়ালেটে টাকা জমা করুন" : "Deposit money to your wallet"}
              </p>
            </div>

            {/* Current Balance */}
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{isBn ? "বর্তমান ব্যালেন্স" : "Current Balance"}</p>
                <p className="text-xl font-bold text-foreground">৳{formatAmount(balance, lang)}</p>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {isBn ? "জমার পরিমাণ (৳)" : "Deposit Amount (৳)"}
              </label>
              <Input
                type="number"
                placeholder={isBn ? "পরিমাণ লিখুন (সর্বনিম্ন ১০০)" : "Enter amount (min 100)"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={100}
                className="text-lg font-semibold"
              />
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map(qa => (
                  <button
                    key={qa}
                    onClick={() => setAmount(String(qa))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      amount === String(qa)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/30"
                    }`}
                  >
                    ৳{qa.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">
                {isBn ? "পেমেন্ট মেথড নির্বাচন করুন" : "Select Payment Method"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedMethod(pm.id)}
                      disabled={!pm.ready}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedMethod === pm.id
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
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleAddFund} disabled={!amount || !selectedMethod || processing} className="flex-1 gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {processing
                  ? (isBn ? "প্রসেসিং..." : "Processing...")
                  : (isBn ? `৳${amount || "0"} জমা করুন` : `Deposit ৳${amount || "0"}`)}
              </Button>
              <Button variant="outline" onClick={() => { setShowAddFund(false); setAmount(""); setSelectedMethod(""); }}>
                {isBn ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardWallet;
