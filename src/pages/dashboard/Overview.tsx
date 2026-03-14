import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Server, FileText, HeadphonesIcon, Globe, ArrowUpRight, AlertCircle, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const DashboardOverview = () => {
  const { user, profile } = useAuth();
  const { tr } = useLanguage();
  const [stats, setStats] = useState({ services: 0, invoices: 0, tickets: 0, domains: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [servicesRes, invoicesRes, ticketsRes, domainsRes] = await Promise.all([
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("service_type", "domain"),
      ]);
      setStats({ services: servicesRes.count || 0, invoices: invoicesRes.data?.length || 0, tickets: ticketsRes.count || 0, domains: domainsRes.count || 0 });
      setRecentInvoices(invoicesRes.data || []);
    };
    fetchData();
  }, [user]);

  const cards = [
    { title: tr("dash.activeServices"), value: stats.services, icon: Server, color: "text-primary", link: "/dashboard/services" },
    { title: tr("dash.pendingInvoices"), value: stats.invoices, icon: FileText, color: "text-warning", link: "/dashboard/billing" },
    { title: tr("dash.supportTickets"), value: stats.tickets, icon: HeadphonesIcon, color: "text-success", link: "/dashboard/support" },
    { title: tr("dash.domains"), value: stats.domains, icon: Globe, color: "text-info", link: "/dashboard/domains" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{tr("dash.welcome")}, {profile?.full_name || "User"} 👋</h1>
        <p className="text-sm text-muted-foreground">{tr("dash.accountSummary")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={card.link} className="block glass-card p-5 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${card.color}`}><card.icon className="w-5 h-5" /></div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground mb-4">{tr("dash.quickActions")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/support" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium text-foreground transition-colors">
              <HeadphonesIcon className="w-4 h-4 text-primary" /> {tr("dash.openTicket")}
            </Link>
            <Link to="/dashboard/billing" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium text-foreground transition-colors">
              <FileText className="w-4 h-4 text-primary" /> {tr("dash.viewInvoices")}
            </Link>
            <Link to="/dashboard/services" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium text-foreground transition-colors">
              <Server className="w-4 h-4 text-primary" /> {tr("dash.myServices")}
            </Link>
            <Link to="/dashboard/domains" className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium text-foreground transition-colors">
              <Globe className="w-4 h-4 text-primary" /> {tr("dash.myDomains")}
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground mb-4">{tr("dash.recentInvoices")}</h3>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{tr("dash.noInvoices")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">৳{inv.amount_bdt}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-success/10 text-success" : inv.status === "unpaid" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{inv.status}</span>
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

export default DashboardOverview;
