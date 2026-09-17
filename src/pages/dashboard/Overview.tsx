import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { OverviewSkeleton } from "@/components/DashboardSkeleton";
import ChatCallSummaryWidget from "@/components/ChatCallSummaryWidget";
import {
  Server, FileText, HeadphonesIcon, Globe, AlertCircle,
  Bell, Clock, TrendingUp, Zap, ChevronRight, CreditCard, Activity,
  Copy, RefreshCw, ShoppingBag,
  CheckCircle2, Calendar, MapPin, Mail, User, LogIn, Wallet,
  AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import { formatAmount } from "@/lib/formatPrice";
import { format } from "date-fns";
import { toast } from "sonner";

const DashboardOverview = () => {
  const { user, profile } = useAuth();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const [stats, setStats] = useState({
    services: 0, invoices: 0, tickets: 0, domains: 0,
    activeServices: 0, totalSpent: 0, openTickets: 0,
    unpaidCount: 0, unpaidTotal: 0, overdueTotal: 0,
    walletBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [expiringServices, setExpiringServices] = useState<any[]>([]);
  const [expiringDomains, setExpiringDomains] = useState<any[]>([]);
  const [clientActivitiesOpen, setClientActivitiesOpen] = useState(true);

  const supportPin = useMemo(() => {
    if (!user?.id) return "000000";
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash) % 1000000).padStart(6, "0");
  }, [user?.id]);

  const copyPin = () => {
    navigator.clipboard.writeText(supportPin);
    toast.success(bn ? "কপি করা হয়েছে" : "Copied!");
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [servicesRes, invoicesRes, ticketsRes, domainsRes, activeRes, openTicketsRes, unpaidInvRes, walletRes] = await Promise.all([
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("service_type", "domain"),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]),
        supabase.from("invoices").select("*").eq("user_id", user.id).in("status", ["unpaid", "overdue"]),
        supabase.from("wallet_transactions").select("*").eq("user_id", user.id).eq("status", "completed"),
      ]);

      const totalSpent = (invoicesRes.data || []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount_bdt), 0);
      const unpaidData = unpaidInvRes.data || [];
      const unpaidTotal = unpaidData.filter((i: any) => i.status === "unpaid").reduce((s: number, i: any) => s + Number(i.amount_bdt), 0);
      const overdueTotal = unpaidData.filter((i: any) => i.status === "overdue").reduce((s: number, i: any) => s + Number(i.amount_bdt), 0);

      const walletBalance = (walletRes.data || []).reduce((sum: number, t: any) => {
        const isCredit = t.type === "deposit" || t.type === "refund";
        return isCredit ? sum + Number(t.amount_bdt) : sum - Number(t.amount_bdt);
      }, 0);

      setStats({
        services: servicesRes.count || 0,
        invoices: invoicesRes.data?.length || 0,
        tickets: ticketsRes.count || 0,
        domains: domainsRes.count || 0,
        activeServices: activeRes.count || 0,
        totalSpent,
        openTickets: openTicketsRes.count || 0,
        unpaidCount: unpaidData.length,
        unpaidTotal,
        overdueTotal,
        walletBalance,
      });

      const { data: allServices } = await supabase
        .from("services").select("*").eq("user_id", user.id)
        .neq("service_type", "domain").eq("status", "active");
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 86400000);
      setExpiringServices((allServices || []).filter((s: any) =>
        s.expiry_date && new Date(s.expiry_date) <= in30 && new Date(s.expiry_date) >= now
      ));

      const { data: allDomains } = await supabase
        .from("services").select("*").eq("user_id", user.id)
        .eq("service_type", "domain").eq("status", "active");
      setExpiringDomains((allDomains || []).filter((s: any) =>
        s.expiry_date && new Date(s.expiry_date) <= in30 && new Date(s.expiry_date) >= now
      ));

      const { data: notifData } = await supabase
        .from("notifications").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(5);
      setRecentNotifications(notifData || []);
      setLoading(false);
    };
    fetchData();

    const walletChannel = supabase
      .channel('overview-wallet')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from("wallet_transactions").select("*")
            .eq("user_id", user.id).eq("status", "completed");
          const balance = (data || []).reduce((sum: number, t: any) => {
            const isCredit = t.type === "deposit" || t.type === "refund";
            return isCredit ? sum + Number(t.amount_bdt) : sum - Number(t.amount_bdt);
          }, 0);
          setStats(prev => ({ ...prev, walletBalance: balance }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(walletChannel); };
  }, [user]);

  const daysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const ago = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return bn ? "এইমাত্র" : "Just now";
    if (mins < 60) return bn ? `${mins} মিনিট আগে` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return bn ? `${hrs} ঘন্টা আগে` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return bn ? `${days} দিন আগে` : `${days}d ago`;
  };

  const markRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    setRecentNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) {
      setRecentNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: false } : n)));
      toast.error(bn ? "আপডেট করা যায়নি" : "Could not update");
    }
  };

  const clientFor = useMemo(() => {
    if (!user?.created_at) return "";
    const created = new Date(user.created_at);
    const now = new Date();
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years > 0) return bn ? `${years} বছর, ${rem} মাস` : `${years} Year${years > 1 ? "s" : ""}, ${rem} Month${rem !== 1 ? "s" : ""}`;
    return bn ? `${rem} মাস` : `${rem} Month${rem !== 1 ? "s" : ""}`;
  }, [user?.created_at, bn]);

  if (loading) return <OverviewSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="space-y-4 order-2 lg:order-1">
        {/* Support PIN Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="bg-primary px-4 py-2.5">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-bold text-primary-foreground">
                {bn ? "সাপোর্ট পিন" : "Support PIN"}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {bn ? "আইডেন্টিটি পিন" : "IDENTITY PIN"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {bn ? "সক্রিয়" : "Active"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-foreground tracking-wider tabular-nums">
                {supportPin}
              </span>
              <button onClick={copyPin} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors" title="Copy">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Client Activities */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <button
            onClick={() => setClientActivitiesOpen(!clientActivitiesOpen)}
            className="w-full bg-primary px-4 py-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-bold text-primary-foreground">
                {bn ? "ক্লায়েন্ট তথ্য" : "Client Activities"}
              </span>
            </div>
            {clientActivitiesOpen ? (
              <ChevronUp className="w-4 h-4 text-primary-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
          {clientActivitiesOpen && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bn ? "স্ট্যাটাস" : "Status"}</span>
                <span className="text-emerald-600 font-semibold">{bn ? "সক্রিয়" : "Active"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bn ? "নিবন্ধন" : "Registered"}</span>
                <span className="text-foreground font-medium">
                  {user?.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bn ? "ক্লায়েন্ট" : "Client for"}</span>
                <span className="text-foreground font-medium">{clientFor || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-muted-foreground shrink-0">{bn ? "ইমেইল" : "Email"}</span>
                <span className="text-foreground font-medium text-xs truncate" title={user?.email || ""}>
                  {user?.email || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bn ? "ইমেইল যাচাই" : "Email Verified"}</span>
                {user?.email_confirmed_at ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">
                    {bn ? "যাচাইকৃত" : "Verified"}
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold">
                    {bn ? "যাচাই বাকি" : "Pending"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bn ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}</span>
                <Link to="/dashboard/wallet" className="text-foreground font-bold tabular-nums hover:text-primary transition-colors">
                  ৳{formatAmount(stats.walletBalance, lang)}
                </Link>
              </div>

              {/* Last Login */}
              <div className="mt-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold text-center">
                <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
                {bn ? "শেষ লগইন:" : "Last Login:"} {user?.last_sign_in_at
                  ? format(new Date(user.last_sign_in_at), "dd MMM yyyy, hh:mm a")
                  : "—"}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-4 space-y-1"
        >
          {[
            { to: "/hosting-plans", icon: ShoppingBag, label: bn ? "নতুন সার্ভিস অর্ডার" : "Order New Services" },
            { to: "/domain-search", icon: Globe, label: bn ? "নতুন ডোমেইন রেজিস্টার" : "Register New Domain" },
            { to: "/dashboard/wallet", icon: Wallet, label: bn ? "ফান্ড যোগ করুন" : "Add Fund" },
            { to: "/dashboard/support", icon: HeadphonesIcon, label: bn ? "সাপোর্ট টিকেট" : "Support Ticket" },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors group"
            >
              <action.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </motion.div>
      </div>

      {/* ===== RIGHT MAIN CONTENT ===== */}
      <div className="space-y-5 order-1 lg:order-2">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {bn ? "স্বাগতম," : "Welcome,"}{" "}
            <span className="text-primary">{profile?.full_name || "User"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bn ? "আজ আপনার অ্যাকাউন্টে কী হচ্ছে তা দেখুন।" : "Here's what's happening with your account today."}
          </p>
          <div className="h-1 w-16 bg-primary rounded-full mt-3" />
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Active Services */}
          <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">{bn ? "সক্রিয় সার্ভিস" : "Active Services"}</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{stats.activeServices}</p>
            <Link to="/hosting-plans" className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline">
              <span>+</span> {bn ? "নতুন সার্ভিস অর্ডার" : "Order New Service"}
            </Link>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-b-xl" />
          </div>

          {/* Total Domains */}
          <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">{bn ? "মোট ডোমেইন" : "Total Domains"}</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{stats.domains}</p>
            <Link to="/domain-pricing" className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
              <span>+</span> {bn ? "ডোমেইন কিনুন" : "Buy Domain"}
            </Link>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-xl" />
          </div>

          {/* Unpaid Invoices */}
          <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">{bn ? "বকেয়া ইনভয়েস" : "Unpaid Invoices"}</span>
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{stats.unpaidCount}</p>
            <div className="mt-1 space-y-0.5">
              <p className="text-[10px] text-destructive font-medium">
                {bn ? "ওভারডিউ:" : "Overdue:"} ৳{formatAmount(stats.overdueTotal, lang)}
              </p>
              <p className="text-[10px] text-amber-600 font-medium">
                {bn ? "বকেয়া:" : "Unpaid:"} ৳{formatAmount(stats.unpaidTotal, lang)}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-b-xl" />
          </div>

          {/* Active Tickets */}
          <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">{bn ? "ওপেন টিকেট" : "Active Tickets"}</span>
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <HeadphonesIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{stats.openTickets}</p>
            <Link to="/dashboard/support" className="mt-3 flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline">
              <span>+</span> {bn ? "টিকেট খুলুন" : "Open Ticket"}
            </Link>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-b-xl" />
          </div>
        </motion.div>

        {/* Expiring Services + Domains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Services Expiring Soon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {bn ? "মেয়াদ শেষ হচ্ছে সার্ভিস" : "Services Expiring Soon"}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">
                {expiringServices.length}
              </span>
            </div>
            <div className="p-4">
              {expiringServices.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {bn ? "শীঘ্রই মেয়াদ শেষ হচ্ছে এমন কোনো সার্ভিস নেই" : "No services expiring soon"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expiringServices.map((s: any) => {
                    const days = daysUntil(s.expiry_date);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.domain || s.plan || ""}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(s.expiry_date), "dd/MM/yyyy")}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            days <= 7 ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {days} {bn ? "দিন" : "days"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Domains Expiring Soon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {bn ? "মেয়াদ শেষ হচ্ছে ডোমেইন" : "Domains Expiring Soon"}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
                {expiringDomains.length}
              </span>
            </div>
            <div className="p-4">
              {expiringDomains.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {bn ? "শীঘ্রই মেয়াদ শেষ হচ্ছে এমন কোনো ডোমেইন নেই" : "No domains expiring soon"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expiringDomains.map((d: any) => {
                    const days = daysUntil(d.expiry_date);
                    return (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{d.domain || d.name}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(d.expiry_date), "dd/MM/yyyy")}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            days <= 7 ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {days} {bn ? "দিন" : "days"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Chat & Call Summary */}
        <ChatCallSummaryWidget userId={user?.id} bn={bn} />

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-5"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentNotifications.map((n: any) => {
                const icon = n.type === "payment_success" ? "✅" : n.type === "payment_failed" ? "❌" : "📢";
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id, n.is_read)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${!n.is_read ? "bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10" : "bg-secondary/30"}`}
                  >
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
    </div>
  );
};

export default DashboardOverview;
