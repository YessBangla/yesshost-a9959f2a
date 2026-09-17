import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminTableSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import {
  FileText, Search, DollarSign, TrendingUp, AlertTriangle, Eye,
  CreditCard, Calendar, CheckCircle2, Clock, XCircle, RotateCcw, Pencil, X, Save, Plus, Trash2, Download
} from "lucide-react";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [editInvoice, setEditInvoice] = useState<InvoiceWithUser | null>(null);
  const [editForm, setEditForm] = useState({
    invoice_number: "",
    description: "",
    amount_bdt: "",
    status: "unpaid" as string,
    payment_method: "",
    due_date: "",
    user_id: "",
    paid_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Tables<"profiles">[]>([]);
  const [createForm, setCreateForm] = useState({
    user_id: "",
    description: "",
    amount_bdt: "",
    status: "unpaid" as string,
    payment_method: "",
    due_date: "",
  });
  const [creating, setCreating] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<InvoiceWithUser | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setAllProfiles(prof.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateInvoiceNumber = () => {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const handleCreate = async () => {
    if (!createForm.user_id || !createForm.amount_bdt) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: isBn ? "ক্লায়েন্ট এবং পরিমাণ আবশ্যক" : "Client and amount are required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("invoices").insert({
      user_id: createForm.user_id,
      invoice_number: generateInvoiceNumber(),
      description: createForm.description || null,
      amount_bdt: Number(createForm.amount_bdt),
      status: createForm.status as any,
      payment_method: createForm.payment_method || null,
      due_date: createForm.due_date ? new Date(createForm.due_date).toISOString() : null,
      paid_at: createForm.status === "paid" ? new Date().toISOString() : null,
    });
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: isBn ? "নতুন ইনভয়েস তৈরি হয়েছে" : "Invoice created successfully" });
      setShowCreate(false);
      setCreateForm({ user_id: "", description: "", amount_bdt: "", status: "unpaid", payment_method: "", due_date: "" });
    }
    setCreating(false);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "paid") update.paid_at = new Date().toISOString();
    const { error } = await supabase.from("invoices").update(update).eq("id", id);
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: isBn ? `ইনভয়েস "${status}" এ আপডেট হয়েছে` : `Invoice updated to "${status}"` });
    }
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteInvoice) return;
    setDeleting(true);
    const { error } = await supabase.from("invoices").delete().eq("id", deleteInvoice.id);
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: isBn ? "ইনভয়েস ডিলিট হয়েছে" : "Invoice deleted successfully" });
    }
    setDeleteInvoice(null);
    setDeleting(false);
    fetchData();
  };

  const openEdit = (inv: InvoiceWithUser) => {
    setEditInvoice(inv);
    setEditForm({
      invoice_number: inv.invoice_number,
      description: inv.description || "",
      amount_bdt: String(inv.amount_bdt),
      status: inv.status,
      payment_method: inv.payment_method || "",
      due_date: inv.due_date ? inv.due_date.split("T")[0] : "",
      user_id: inv.user_id,
      paid_at: inv.paid_at ? inv.paid_at.split("T")[0] : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editInvoice) return;
    setSaving(true);
    const update: any = {
      invoice_number: editForm.invoice_number,
      description: editForm.description || null,
      amount_bdt: Number(editForm.amount_bdt),
      status: editForm.status,
      payment_method: editForm.payment_method || null,
      due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
      user_id: editForm.user_id,
      paid_at: editForm.paid_at ? new Date(editForm.paid_at).toISOString() : (editForm.status === "paid" && editInvoice.status !== "paid" ? new Date().toISOString() : null),
    };
    const { error } = await supabase.from("invoices").update(update).eq("id", editInvoice.id);
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: isBn ? "ইনভয়েস আপডেট হয়েছে" : "Invoice updated successfully" });
      setEditInvoice(null);
    }
    setSaving(false);
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

  if (loading) return <AdminTableSkeleton columns={7} rows={6} statsCount={4} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isBn ? "বিলিং ম্যানেজমেন্ট" : "Billing Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isBn ? "সকল ইনভয়েস ও পেমেন্ট পরিচালনা" : "Manage all invoices and payments"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => downloadCsv("yesshost-admin-invoices", ["invoice_number", "client", "description", "amount_bdt", "status", "due_date", "paid_at"],
              filtered.map((i: any) => [i.invoice_number, i.profiles?.full_name || "", i.description || "", i.amount_bdt, i.status, csvDate(i.due_date), csvDate(i.paid_at)]))}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {isBn ? "নতুন ইনভয়েস" : "New Invoice"}
          </Button>
        </div>
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/50 overflow-x-auto">
          {["all", ...invoiceStatuses].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
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
                      <p className="font-bold text-foreground tabular-nums">৳{formatAmount(Number(inv.amount_bdt), lang)}</p>
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
                        <button
                          onClick={() => openEdit(inv)}
                          className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                          title={isBn ? "এডিট করুন" : "Edit"}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteInvoice(inv)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title={isBn ? "ডিলিট করুন" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <select
                          value={inv.status}
                          onChange={e => updateStatus(inv.id, e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg bg-secondary/40 border border-border/50 text-foreground outline-hidden"
                        >
                          {invoiceStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title={isBn ? "কোনো ইনভয়েস পাওয়া যায়নি" : "No invoices found"}
                    description={isBn ? "সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন" : "Try adjusting your search filters"}
                  />
                </td></tr>
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

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editInvoice} onOpenChange={() => setEditInvoice(null)}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{isBn ? "ইনভয়েস এডিট করুন" : "Edit Invoice"}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "ক্লায়েন্ট" : "Client"}</label>
              <select
                value={editForm.user_id}
                onChange={e => setEditForm({ ...editForm, user_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{isBn ? "— ক্লায়েন্ট বাছুন —" : "— Choose client —"}</option>
                {allProfiles.map(p => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.full_name || p.user_id} {p.phone ? `(${p.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "ইনভয়েস নম্বর" : "Invoice Number"}</label>
              <input
                value={editForm.invoice_number}
                onChange={e => setEditForm({ ...editForm, invoice_number: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "বিবরণ" : "Description"}</label>
              <input
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder={isBn ? "সার্ভিসের বিবরণ" : "Service description"}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "পরিমাণ (৳)" : "Amount (৳)"}</label>
                <input
                  type="number"
                  value={editForm.amount_bdt}
                  onChange={e => setEditForm({ ...editForm, amount_bdt: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "স্ট্যাটাস" : "Status"}</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                >
                  {invoiceStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "পেমেন্ট মেথড" : "Payment Method"}</label>
                <input
                  value={editForm.payment_method}
                  onChange={e => setEditForm({ ...editForm, payment_method: e.target.value })}
                  placeholder="bKash, Nagad, Bank..."
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "ডিউ তারিখ" : "Due Date"}</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "পেমেন্ট তারিখ" : "Payment Date"}</label>
              <input
                type="date"
                value={editForm.paid_at}
                onChange={e => setEditForm({ ...editForm, paid_at: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveEdit} disabled={saving} className="flex-1 gap-2">
                <Save className="w-4 h-4" />
                {saving ? (isBn ? "সেভ হচ্ছে..." : "Saving...") : (isBn ? "সেভ করুন" : "Save Changes")}
              </Button>
              <Button variant="outline" onClick={() => setEditInvoice(null)}>
                {isBn ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <h2 className="text-lg font-bold text-foreground mb-4">{isBn ? "নতুন ইনভয়েস তৈরি করুন" : "Create New Invoice"}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "ক্লায়েন্ট নির্বাচন করুন" : "Select Client"}</label>
              <select
                value={createForm.user_id}
                onChange={e => setCreateForm({ ...createForm, user_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{isBn ? "— ক্লায়েন্ট বাছুন —" : "— Choose client —"}</option>
                {allProfiles.map(p => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.full_name || p.user_id} {p.phone ? `(${p.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "বিবরণ" : "Description"}</label>
              <input
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder={isBn ? "সার্ভিসের বিবরণ" : "Service description"}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "পরিমাণ (৳)" : "Amount (৳)"}</label>
                <input
                  type="number"
                  value={createForm.amount_bdt}
                  onChange={e => setCreateForm({ ...createForm, amount_bdt: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "স্ট্যাটাস" : "Status"}</label>
                <select
                  value={createForm.status}
                  onChange={e => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                >
                  {invoiceStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "পেমেন্ট মেথড" : "Payment Method"}</label>
                <input
                  value={createForm.payment_method}
                  onChange={e => setCreateForm({ ...createForm, payment_method: e.target.value })}
                  placeholder="bKash, Nagad, Bank..."
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{isBn ? "ডিউ তারিখ" : "Due Date"}</label>
                <input
                  type="date"
                  value={createForm.due_date}
                  onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={creating} className="flex-1 gap-2">
                <Plus className="w-4 h-4" />
                {creating ? (isBn ? "তৈরি হচ্ছে..." : "Creating...") : (isBn ? "ইনভয়েস তৈরি করুন" : "Create Invoice")}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {isBn ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBn ? "ইনভয়েস ডিলিট করুন" : "Delete Invoice"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBn
                ? `আপনি কি "${deleteInvoice?.invoice_number}" ইনভয়েসটি ডিলিট করতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`
                : `Are you sure you want to delete invoice "${deleteInvoice?.invoice_number}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isBn ? "বাতিল" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? (isBn ? "ডিলিট হচ্ছে..." : "Deleting...") : (isBn ? "ডিলিট করুন" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceReport
        invoice={reportInvoice}
        open={!!reportInvoice}
        onClose={() => setReportInvoice(null)}
      />
    </div>
  );
};

export default AdminBilling;
