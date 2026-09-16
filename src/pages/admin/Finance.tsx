import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Wallet, FileText, AlertTriangle, RefreshCcw, Download, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const AdminFinance = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [i, w, p, c] = await Promise.all([
      supabase.from("invoices").select("invoice_number,amount_bdt,status,created_at,paid_at,due_date,payment_method").order("created_at", { ascending: false }),
      supabase.from("wallet_transactions").select("type,amount_bdt,status,payment_method,created_at").order("created_at", { ascending: false }),
      supabase.from("affiliate_payouts").select("amount_bdt,status,method,created_at"),
      supabase.from("affiliate_commissions").select("amount_bdt,status,created_at"),
    ]);
    setInvoices(i.data || []);
    setWallet(w.data || []);
    setPayouts(p.data || []);
    setCommissions(c.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const money = (n: number) => `৳${Math.round(n).toLocaleString(bn ? "bn-BD" : "en-US")}`;
  const sum = (rows: any[]) => rows.reduce((a, b) => a + Number(b.amount_bdt || 0), 0);

  const stats = useMemo(() => {
    const now = new Date();
    const paid = invoices.filter(i => i.status === "paid");
    const unpaid = invoices.filter(i => i.status === "unpaid");
    const overdue = invoices.filter(i => i.status === "overdue" || (i.status === "unpaid" && i.due_date && new Date(i.due_date) < now));
    const refunded = invoices.filter(i => i.status === "refunded");
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = paid.filter(i => (i.paid_at || i.created_at || "").startsWith(monthKey));
    return {
      revenue: sum(paid),
      monthRevenue: sum(thisMonth),
      due: sum(unpaid),
      overdue: sum(overdue),
      overdueCount: overdue.length,
      refunded: sum(refunded),
      walletIn: sum(wallet.filter(w => w.type === "deposit" && w.status === "completed")),
      walletPending: sum(wallet.filter(w => w.status === "pending")),
      commissionPending: sum(commissions.filter(c => c.status !== "paid")),
      payoutPending: sum(payouts.filter(p => p.status === "requested" || p.status === "processing")),
    };
  }, [invoices, wallet, payouts, commissions]);

  const monthly = useMemo(() => {
    const rows: { name: string; paid: number; due: number; refunded: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      rows.push({
        name: d.toLocaleString(bn ? "bn-BD" : "en-US", { month: "short" }),
        paid: sum(invoices.filter(x => x.status === "paid" && (x.paid_at || "").startsWith(key))),
        due: sum(invoices.filter(x => ["unpaid", "overdue"].includes(x.status) && (x.created_at || "").startsWith(key))),
        refunded: sum(invoices.filter(x => x.status === "refunded" && (x.created_at || "").startsWith(key))),
      });
    }
    return rows;
  }, [invoices, bn]);

  const exportCsv = () => {
    const header = ["invoice", "amount_bdt", "status", "payment_method", "created_at", "paid_at"];
    const rows = invoices.map(i => [i.invoice_number, i.amount_bdt, i.status, i.payment_method || "", i.created_at, i.paid_at || ""]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "yesshost-finance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: bn ? "মোট আয়" : "Total revenue", value: money(stats.revenue), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: bn ? "এ মাসের আয়" : "This month", value: money(stats.monthRevenue), icon: FileText, tone: "text-primary" },
    { label: bn ? "বকেয়া" : "Outstanding", value: money(stats.due), icon: Clock, tone: "text-amber-600" },
    { label: bn ? "মেয়াদোত্তীর্ণ" : "Overdue", value: `${money(stats.overdue)} (${stats.overdueCount})`, icon: AlertTriangle, tone: "text-destructive" },
    { label: bn ? "রিফান্ড" : "Refunded", value: money(stats.refunded), icon: RefreshCcw, tone: "text-muted-foreground" },
    { label: bn ? "ওয়ালেট জমা" : "Wallet deposits", value: money(stats.walletIn), icon: Wallet, tone: "text-primary" },
    { label: bn ? "ওয়ালেট পেন্ডিং" : "Wallet pending", value: money(stats.walletPending), icon: Clock, tone: "text-amber-600" },
    { label: bn ? "কমিশন দেনা" : "Commission liability", value: money(stats.commissionPending + stats.payoutPending), icon: AlertTriangle, tone: "text-destructive" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{bn ? "হিসাব ও ফিন্যান্স" : "Accounts & Finance"}</h1>
          <p className="text-sm text-muted-foreground">{bn ? "আয়, বকেয়া, রিফান্ড ও ওয়ালেটের পূর্ণ হিসাব" : "Revenue, dues, refunds and wallet overview"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg border border-border bg-card text-xs font-medium hover:bg-accent/10">
            <RefreshCcw className="w-4 h-4" /> {bn ? "রিফ্রেশ" : "Refresh"}
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg border border-border bg-card text-xs font-medium hover:bg-accent/10">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-2 text-[11px] font-medium ${c.tone}`}>
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </div>
            <p className="mt-2 text-base font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">{bn ? "মাসভিত্তিক আয় ও বকেয়া" : "Monthly revenue vs dues"}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Bar dataKey="paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="refunded" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "সাম্প্রতিক ইনভয়েস" : "Recent invoices"}</h2>
          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {invoices.slice(0, 15).map((i, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.invoice_number}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(i.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{money(Number(i.amount_bdt))}</p>
                  <p className={`text-[11px] ${i.status === "paid" ? "text-emerald-600" : i.status === "overdue" ? "text-destructive" : "text-amber-600"}`}>{i.status}</p>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">{bn ? "কোনো ইনভয়েস নেই" : "No invoices"}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "ওয়ালেট লেনদেন" : "Wallet transactions"}</h2>
          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {wallet.slice(0, 15).map((w, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium capitalize truncate">{w.type} · {w.payment_method || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{money(Number(w.amount_bdt))}</p>
                  <p className="text-[11px] text-muted-foreground">{w.status}</p>
                </div>
              </div>
            ))}
            {wallet.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">{bn ? "কোনো লেনদেন নেই" : "No transactions"}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
