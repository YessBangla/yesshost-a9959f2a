import { useEffect, useState } from "react";
import { FileText, Search, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type InvoiceWithUser = Tables<"invoices"> & { profiles?: Tables<"profiles"> | null };

const invoiceStatuses = ["paid", "unpaid", "overdue", "cancelled", "refunded"] as const;

const AdminBilling = () => {
  const { tr } = useLanguage();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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
    toast({ title: tr("admin.statusUpdated") });
    fetchData();
  };

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((a, b) => a + Number(b.amount_bdt), 0);
  const totalDue = invoices.filter(i => i.status === "unpaid" || i.status === "overdue").reduce((a, b) => a + Number(b.amount_bdt), 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").length;

  const statusColors: Record<string, string> = {
    paid: "bg-success/10 text-success",
    unpaid: "bg-warning/10 text-warning",
    overdue: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    refunded: "bg-primary/10 text-primary",
  };

  const filtered = invoices.filter(i => {
    const matchSearch = i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <FileText className="w-6 h-6" /> {tr("admin.billingManagement")}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{tr("admin.totalPaid")}</p>
            <p className="text-xl font-bold text-foreground">৳{totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10"><DollarSign className="w-5 h-5 text-warning" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{tr("admin.totalDue")}</p>
            <p className="text-xl font-bold text-foreground">৳{totalDue.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{tr("admin.overdueInvoices")}</p>
            <p className="text-xl font-bold text-foreground">{totalOverdue}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tr("admin.searchInvoices")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none"
        >
          <option value="all">{tr("admin.allStatus")}</option>
          {invoiceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.invoiceNo")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.client")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.description")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.amount")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.status")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.dueDate")}</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{tr("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">#{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.profiles?.full_name || inv.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.description || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">৳{Number(inv.amount_bdt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[inv.status] || ""}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={inv.status}
                      onChange={e => updateStatus(inv.id, e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground outline-none"
                    >
                      {invoiceStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{tr("admin.noData")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBilling;
