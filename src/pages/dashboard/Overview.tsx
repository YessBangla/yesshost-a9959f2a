import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Server, FileText, HeadphonesIcon, Globe, ArrowUpRight, AlertCircle,
  Bell, Clock, TrendingUp, Zap, ChevronRight, CreditCard, Activity,
  Sun, Moon, CloudSun, Sunrise
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const getGreeting = (bn: boolean) => {
  const h = new Date().getHours();
  if (h < 6) return { text: bn ? "শুভ রাত্রি" : "Good Night", icon: Moon };
  if (h < 12) return { text: bn ? "সুপ্রভাত" : "Good Morning", icon: Sunrise };
  if (h < 17) return { text: bn ? "শুভ অপরাহ্ন" : "Good Afternoon", icon: Sun };
  if (h < 21) return { text: bn ? "শুভ সন্ধ্যা" : "Good Evening", icon: CloudSun };
  return { text: bn ? "শুভ রাত্রি" : "Good Night", icon: Moon };
};

const DashboardOverview = () => {
  const { user, profile } = useAuth();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const [stats, setStats] = useState({ services: 0, invoices: 0, tickets: 0, domains: 0, activeServices: 0, totalSpent: 0, openTickets: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [servicesRes, invoicesRes, ticketsRes, domainsRes, activeRes, openTicketsRes, allServicesRes] = await Promise.all([
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("service_type", "domain"),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]),
        supabase.from("services").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      const totalSpent = (invoicesRes.data || []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount_bdt), 0);

      setStats({
        services: servicesRes.count || 0,
        invoices: invoicesRes.data?.length || 0,
        tickets: ticketsRes.count || 0,
        domains: domainsRes.count || 0,
        activeServices: activeRes.count || 0,
        totalSpent,
        openTickets: openTicketsRes.count || 0,
      });
      setRecentInvoices(invoicesRes.data || []);
      setRecentServices(allServicesRes.data || []);

      const { data: notifData } = await supabase
        .from("notifications").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(5);
      setRecentNotifications(notifData || []);
    };
    fetchData();
  }, [user]);

  const greeting = useMemo(() => getGreeting(bn), [bn]);
  const GreetingIcon = greeting.icon;

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    suspended: "bg-destructive/10 text-destructive",
  };

  const cards = [
    { title: bn ? "সক্রিয় সার্ভিস" : "Active Services", value: stats.activeServices, total: stats.services, icon: Server, color: "from-blue-500 to-indigo-600", link: "/dashboard/services" },
    { title: bn ? "ডোমেইন" : "Domains", value: stats.domains, icon: Globe, color: "from-emerald-500 to-green-600", link: "/dashboard/domains" },
    { title: bn ? "ওপেন টিকেট" : "Open Tickets", value: stats.openTickets, total: stats.tickets, icon: HeadphonesIcon, color: "from-amber-500 to-orange-600", link: "/dashboard/support" },
    { title: bn ? "মোট ব্যয়" : "Total Spent", value: `৳${stats.totalSpent.toLocaleString()}`, icon: CreditCard, color: "from-purple-500 to-violet-600", link: "/dashboard/billing" },
  ];

  const ago = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return bn ? "এইমাত্র" : "Just now";
    if (mins < 60) return bn ? `${mins} মিনিট আগে` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return bn ? `${hrs} ঘন্টা আগে` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return bn ? `${days} দিন আগে` : `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: brandCurve }}
        className="relative overflow-hidden rounded-2xl gradient-primary p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl -translate-x-1/3 translate-y-1/3" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GreetingIcon className="w-5 h-5 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80 font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {profile?.full_name || "User"} 👋
            </h1>
            <p className="text-sm text-primary-foreground/70 mt-1">
              {bn ? "আপনার অ্যাকাউন্টের সংক্ষিপ্ত বিবরণ" : "Here's your account summary"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/support"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-primary-foreground text-sm font-semibold transition-colors backdrop-blur-sm"
            >
              <HeadphonesIcon className="w-4 h-4" />
              {bn ? "সাপোর্ট" : "Get Help"}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          >
            <Link to={card.link} className="block glass-card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.title}</p>
              {card.total !== undefined && card.total > 0 && (
                <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                    style={{ width: `${Math.min(100, (Number(card.value) / card.total) * 100)}%` }}
                  />
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 sm:p-6 rounded-xl"
        >
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {bn ? "দ্রুত অ্যাকশন" : "Quick Actions"}
          </h3>
          <div className="space-y-2">
            {[
              { to: "/dashboard/support", icon: HeadphonesIcon, label: bn ? "নতুন টিকেট খুলুন" : "Open New Ticket", color: "text-blue-500" },
              { to: "/dashboard/billing", icon: FileText, label: bn ? "ইনভয়েস দেখুন" : "View Invoices", color: "text-amber-500" },
              { to: "/dashboard/services", icon: Server, label: bn ? "সার্ভিস ম্যানেজ" : "Manage Services", color: "text-emerald-500" },
              { to: "/dashboard/domains", icon: Globe, label: bn ? "ডোমেইন ম্যানেজ" : "Manage Domains", color: "text-purple-500" },
              { to: "/dashboard/profile", icon: Activity, label: bn ? "প্রোফাইল আপডেট" : "Update Profile", color: "text-pink-500" },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5 sm:p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {bn ? "সাম্প্রতিক ইনভয়েস" : "Recent Invoices"}
            </h3>
            <Link to="/dashboard/billing" className="text-xs text-primary hover:underline font-medium">
              {bn ? "সব দেখুন" : "View all"}
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{bn ? "কোনো ইনভয়েস নেই" : "No invoices yet"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{inv.invoice_number}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{inv.description || "—"}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-foreground tabular-nums">৳{Number(inv.amount_bdt).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      inv.status === "paid" ? "bg-success/10 text-success" :
                      inv.status === "unpaid" ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {inv.status === "paid" ? (bn ? "পরিশোধিত" : "Paid") :
                       inv.status === "unpaid" ? (bn ? "বকেয়া" : "Unpaid") :
                       inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 sm:p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              {bn ? "সাম্প্রতিক সার্ভিস" : "Recent Services"}
            </h3>
            <Link to="/dashboard/services" className="text-xs text-primary hover:underline font-medium">
              {bn ? "সব দেখুন" : "View all"}
            </Link>
          </div>
          {recentServices.length === 0 ? (
            <div className="text-center py-10">
              <Server className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{bn ? "কোনো সার্ভিস নেই" : "No services yet"}</p>
              <Link to="/#pricing" className="inline-block mt-3 text-xs text-primary hover:underline font-medium">
                {bn ? "প্ল্যান দেখুন" : "Browse Plans"} →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentServices.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Server className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.domain || s.plan || s.service_type}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[s.status] || "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card p-5 sm:p-6 rounded-xl"
      >
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          {bn ? "সাম্প্রতিক নোটিফিকেশন" : "Recent Notifications"}
        </h3>
        {recentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{bn ? "কোনো নোটিফিকেশন নেই" : "No notifications yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {recentNotifications.map((n: any) => {
              const icon = n.type === "payment_success" ? "✅" : n.type === "payment_failed" ? "❌" : "📢";
              return (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.is_read ? "bg-primary/5 border border-primary/10" : "bg-secondary/30"}`}>
                  <span className="text-base mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ago(n.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
