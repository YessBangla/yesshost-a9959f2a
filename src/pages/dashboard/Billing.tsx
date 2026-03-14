import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  paid: "bg-success/10 text-success",
  unpaid: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-info/10 text-info",
};

const DashboardBilling = () => {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const [invoices, setInvoices] = useState<Tables<"invoices">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { setInvoices(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const totalDue = invoices.filter(i => i.status === "unpaid" || i.status === "overdue").reduce((sum, i) => sum + Number(i.amount_bdt), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{tr("dash.billingTitle")}</h1>
        <p className="text-sm text-muted-foreground">{tr("dash.billingSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{tr("dash.totalInvoices")}</p>
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{tr("dash.totalDue")}</p>
          <p className="text-2xl font-bold text-warning">৳{totalDue.toFixed(2)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{tr("dash.totalPaid")}</p>
          <p className="text-2xl font-bold text-success">৳{invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount_bdt), 0).toFixed(2)}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{tr("dash.noInvoicesTitle")}</h3>
          <p className="text-sm text-muted-foreground">{tr("dash.noInvoicesDesc")}</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-semibold text-muted-foreground">{tr("dash.invoiceNo")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{tr("dash.description")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{tr("dash.amount")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{tr("dash.status")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{tr("dash.dueDate")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="p-4 text-muted-foreground">{inv.description || "-"}</td>
                    <td className="p-4 font-bold text-foreground">৳{inv.amount_bdt}</td>
                    <td className="p-4"><span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[inv.status]}`}>{inv.status}</span></td>
                    <td className="p-4 text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString("bn-BD") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardBilling;
