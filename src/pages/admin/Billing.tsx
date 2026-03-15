import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Search, DollarSign, TrendingUp, AlertTriangle, Eye,
  CreditCard, Calendar, CheckCircle2, Clock, XCircle, RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import InvoiceReport from "@/components/InvoiceReport";
import { formatAmount } from "@/lib/formatPrice";
import type { Tables } from "@/integrations/supabase/types";

type InvoiceWithUser = Tables<"invoices"> & { profiles?: Tables<"profiles"> | null };

const invoiceStatuses = ["paid", "unpaid", "overdue", "cancelled", "refunded"] as const;

const statusConfig: Record<string, { icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" | "outline"; color: string; bg: string }> = {
  paid: { icon: CheckCircle2, variant: "default", color: "text-success", bg: "bg-success/10" },
  unpaid: { icon: Clock, variant: "secondary", color: "text-warning", bg: "bg-warning/10" },
  overdue: { icon: AlertTriangle, variant: "destructive", color: "text-destructive", bg: "bg-destructive/10" },
  cancelled: { icon: XCircle, variant: "outline", color: "text-muted-foreground", bg: "bg-muted" },
  refunded: { icon: RotateCcw, variant: "outline", color: "text-primary", bg: "bg-primary/10" },
};

const AdminBilling = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reportInvoice, setReportInvoice] = useState<InvoiceWithUser | null>(null);

  const fetchData = async () => {
    const [inv, prof] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    const invoicesWithUser = (inv.data || []).map(i => ({
      ...i,
      profiles: (prof.data || []).find(p => p.user_id === i.user_id) || null,
    }));
    setInvoices(invoicesWithUser);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    await supabase.from("invoices").update(update).eq("id", id);
    toast({ title: isBn ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated" });
    fetchData();
  };

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((a, b) => a + Number(b.amount_bdt), 0);
  const totalDue = invoices.filter(i => i.status === "unpaid" || i.status === "overdue").reduce((a, b) => a + Number(b.amount_bdt), 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").length;
  const thisMonthRevenue = invoices.filter(i => {
    if (i.status !== "paid" || !i.paid_at) return false;
    const d = new Date(i.paid_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, b) => a + Number(b.amount_bdt), 0);

  const filtered = invoices.filter(i => {
    const matchSearch = !search || i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isBn ? "বিলিং ম্যানেজমেন্ট" : "Billing Management"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isBn ? "সকল ইনভয়েস ও পেমেন্ট পরিচালনা" : "Manage all invoices and payments"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isBn ? "মোট আয়" : "Total Revenue", value: `৳${formatAmount(totalPaid, lang)}`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: isBn ? "এই মাসের আয়" : "This Month", value: `৳${formatAmount(thisMonthRevenue, lang)}`, icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
          { label: isBn ? "মোট বকেয়া" : "Total Due", value: `৳${formatAmount(totalDue, lang)}`, icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
          { label: isBn ? "মেয়াদোত্তীর্ণ" : "Overdue", value: totalOverdue, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isBn ? "ইনভয়েস নম্বর, ক্লায়েন্ট বা বিবরণ দিয়ে সার্চ..." : "Search by invoice, client or description..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/50 overflow-x-auto">
          {["all", ...invoiceStatuses].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? (isBn ? "সকল" : "All") : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && <span className="ml-1 opacity-60">({invoices.filter(i => i.status === s).length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "ইনভয়েস" : "Invoice"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{isBn ? "ক্লায়েন্ট" : "Client"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{isBn ? "বিবরণ" : "Description"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "পরিমাণ" : "Amount"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{isBn ? "তারিখ" : "Date"}</th>
                <th className="text-right px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "অ্যাকশন" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const sc = statusConfig[inv.status] || statusConfig.unpaid;
                return (
                  <tr key={inv.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs text-primary font-semibold">#{inv.invoice_number}</p>
                      <p className="text-[10px] text-muted-foreground md:hidden">{inv.profiles?.full_name || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {(inv.profiles?.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{inv.profiles?.full_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{inv.profiles?.phone || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground text-sm max-w-[200px] truncate">{inv.description || "—"}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-foreground tabular-nums">৳{Number(inv.amount_bdt).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={sc.variant} className="text-[10px]">{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</Badge>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      {inv.due_date && <p className="text-[10px] text-muted-foreground">{isBn ? "ডিউ:" : "Due:"} {new Date(inv.due_date).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric" })}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReportInvoice(inv)}
                          className="p-2 rounded-lg hover:bg-secondary/60 text-primary hover:text-primary/80 transition-colors"
                          title={isBn ? "রিপোর্ট দেখুন" : "View Report"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={inv.status}
                          onChange={e => updateStatus(inv.id, e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg bg-secondary/40 border border-border/50 text-foreground outline-none"
                        >
                          {invoiceStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">{isBn ? "কোনো ইনভয়েস পাওয়া যায়নি" : "No invoices found"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border/30 bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            {isBn ? `${filtered.length} টি ইনভয়েস দেখাচ্ছে` : `Showing ${filtered.length} invoices`}
          </p>
        </div>
      </div>

      <InvoiceReport
        invoice={reportInvoice}
        open={!!reportInvoice}
        onClose={() => setReportInvoice(null)}
      />
    </div>
  );
};

export default AdminBilling;
