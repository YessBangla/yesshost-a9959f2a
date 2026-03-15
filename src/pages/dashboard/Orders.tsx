import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, FileText, CreditCard, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import InvoiceReport from "@/components/InvoiceReport";
import { formatAmount } from "@/lib/formatPrice";

type Invoice = {
  id: string;
  invoice_number: string;
  description: string | null;
  amount_bdt: number;
  status: string;
  payment_method: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  service_id: string | null;
};

const statusConfig: Record<string, { label_en: string; label_bn: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label_en: "Paid", label_bn: "পরিশোধিত", variant: "default" },
  unpaid: { label_en: "Unpaid", label_bn: "অপরিশোধিত", variant: "secondary" },
  overdue: { label_en: "Overdue", label_bn: "মেয়াদোত্তীর্ণ", variant: "destructive" },
  cancelled: { label_en: "Cancelled", label_bn: "বাতিল", variant: "outline" },
  refunded: { label_en: "Refunded", label_bn: "ফেরতকৃত", variant: "outline" },
};

const OrdersPage = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportInvoice, setReportInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setInvoices((data as Invoice[]) || []);
        setLoading(false);
      });
  }, [user]);

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    unpaid: invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length,
    totalSpent: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount_bdt), 0),
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(isBn ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {isBn ? "অর্ডার হিস্ট্রি" : "Order History"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isBn ? "আপনার সকল অর্ডার ও পেমেন্ট স্ট্যাটাস" : "All your orders and payment status"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isBn ? "মোট অর্ডার" : "Total Orders", value: stats.total, icon: ShoppingBag },
          { label: isBn ? "পরিশোধিত" : "Paid", value: stats.paid, icon: CreditCard },
          { label: isBn ? "বকেয়া" : "Due", value: stats.unpaid, icon: FileText },
          { label: isBn ? "মোট ব্যয়" : "Total Spent", value: `৳${stats.totalSpent.toLocaleString()}`, icon: CreditCard },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Orders list */}
      {invoices.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{isBn ? "কোনো অর্ডার পাওয়া যায়নি" : "No orders found"}</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold text-muted-foreground">{isBn ? "ইনভয়েস" : "Invoice"}</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">{isBn ? "বিবরণ" : "Description"}</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">{isBn ? "পরিমাণ" : "Amount"}</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">{isBn ? "তারিখ" : "Date"}</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">{isBn ? "রিপোর্ট" : "Report"}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const sc = statusConfig[inv.status] || statusConfig.unpaid;
                  return (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{inv.description || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground tabular-nums">৳{Number(inv.amount_bdt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sc.variant}>{isBn ? sc.label_bn : sc.label_en}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setReportInvoice(inv)}
                          className="p-1.5 rounded-lg hover:bg-secondary/60 text-primary hover:text-primary/80 transition-colors"
                          title={isBn ? "রিপোর্ট দেখুন" : "View Report"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/50">
            {invoices.map((inv) => {
              const sc = statusConfig[inv.status] || statusConfig.unpaid;
              return (
                <button key={inv.id} onClick={() => setReportInvoice(inv)} className="w-full text-left p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-primary">{inv.invoice_number}</span>
                    <Badge variant={sc.variant} className="text-xs">{isBn ? sc.label_bn : sc.label_en}</Badge>
                  </div>
                  <p className="text-sm text-foreground truncate">{inv.description || "—"}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">৳{Number(inv.amount_bdt).toLocaleString()}</span>
                    <span>{formatDate(inv.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <InvoiceReport
        invoice={reportInvoice}
        open={!!reportInvoice}
        onClose={() => setReportInvoice(null)}
      />
    </div>
  );
};

export default OrdersPage;
