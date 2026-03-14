import { useEffect, useState } from "react";
import { Users, Server, FileText, HeadphonesIcon, TrendingUp, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Stats {
  totalUsers: number;
  totalServices: number;
  activeServices: number;
  suspendedServices: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
  totalDue: number;
  openTickets: number;
  totalTickets: number;
}

const AdminDashboard = () => {
  const { tr } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalServices: 0, activeServices: 0, suspendedServices: 0,
    totalInvoices: 0, unpaidInvoices: 0, totalRevenue: 0, totalDue: 0,
    openTickets: 0, totalTickets: 0,
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, services, invoices, tickets] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("services").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("support_tickets").select("*"),
      ]);

      const servicesData = services.data || [];
      const invoicesData = invoices.data || [];
      const ticketsData = tickets.data || [];

      setStats({
        totalUsers: profiles.count || 0,
        totalServices: servicesData.length,
        activeServices: servicesData.filter(s => s.status === "active").length,
        suspendedServices: servicesData.filter(s => s.status === "suspended").length,
        totalInvoices: invoicesData.length,
        unpaidInvoices: invoicesData.filter(i => i.status === "unpaid" || i.status === "overdue").length,
        totalRevenue: invoicesData.filter(i => i.status === "paid").reduce((a, b) => a + Number(b.amount_bdt), 0),
        totalDue: invoicesData.filter(i => i.status === "unpaid" || i.status === "overdue").reduce((a, b) => a + Number(b.amount_bdt), 0),
        openTickets: ticketsData.filter(t => t.status === "open" || t.status === "in_progress").length,
        totalTickets: ticketsData.length,
      });

      setRecentTickets(ticketsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
      setRecentInvoices(invoicesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const statCards = [
    { label: tr("admin.totalUsers"), value: stats.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: tr("admin.activeServices"), value: stats.activeServices, icon: Server, color: "text-success", bg: "bg-success/10", sub: `${stats.suspendedServices} ${tr("admin.suspended")}` },
    { label: tr("admin.totalRevenue"), value: `৳${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: tr("admin.totalDue"), value: `৳${stats.totalDue.toLocaleString()}`, icon: DollarSign, color: "text-warning", bg: "bg-warning/10", sub: `${stats.unpaidInvoices} ${tr("admin.unpaidInvoices")}` },
    { label: tr("admin.openTickets"), value: stats.openTickets, icon: HeadphonesIcon, color: "text-destructive", bg: "bg-destructive/10", sub: `${stats.totalTickets} ${tr("admin.total")}` },
    { label: tr("admin.totalInvoices"), value: stats.totalInvoices, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  ];

  const statusColors: Record<string, string> = {
    open: "bg-warning/10 text-warning",
    in_progress: "bg-primary/10 text-primary",
    resolved: "bg-success/10 text-success",
    closed: "bg-muted text-muted-foreground",
    paid: "bg-success/10 text-success",
    unpaid: "bg-warning/10 text-warning",
    overdue: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{tr("admin.dashboardTitle")}</h1>
        <p className="text-sm text-muted-foreground">{tr("admin.dashboardSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-muted-foreground" />
            {tr("admin.recentTickets")}
          </h2>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("admin.noData")}</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">#{t.ticket_number} • {t.department}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[t.status] || ""}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            {tr("admin.recentInvoices")}
          </h2>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tr("admin.noData")}</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">#{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.description || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">৳{Number(inv.amount_bdt).toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] || ""}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
