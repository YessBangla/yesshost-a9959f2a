import { useEffect, useState, useMemo } from "react";
import { AdminDashboardSkeleton } from "@/components/DashboardSkeleton";
import {
  Users, Server, FileText, HeadphonesIcon, TrendingUp,
  DollarSign, Activity, ArrowUpRight, ArrowDownRight, Tag, BarChart3, Target, Download
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
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

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const AdminDashboard = () => {
  const { tr } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalServices: 0, activeServices: 0, suspendedServices: 0,
    totalInvoices: 0, unpaidInvoices: 0, totalRevenue: 0, totalDue: 0,
    openTickets: 0, totalTickets: 0,
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [allCoupons, setAllCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, services, invoices, tickets, coupons] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("services").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("support_tickets").select("*"),
        supabase.from("coupons").select("*"),
      ]);

      const profilesData = profiles.data || [];
      const servicesData = services.data || [];
      const invoicesData = invoices.data || [];
      const ticketsData = tickets.data || [];
      const couponsData = coupons.data || [];

      setAllProfiles(profilesData);
      setAllServices(servicesData);
      setAllInvoices(invoicesData);
      setAllTickets(ticketsData);
      setAllCoupons(couponsData);

      setStats({
        totalUsers: profilesData.length,
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

  // Monthly revenue chart data (last 6 months)
  const revenueChartData = useMemo(() => {
    const months: { name: string; revenue: number; due: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthName = d.toLocaleString("default", { month: "short", year: "2-digit" });

      const revenue = allInvoices
        .filter(inv => inv.status === "paid" && inv.paid_at?.startsWith(monthKey))
        .reduce((sum, inv) => sum + Number(inv.amount_bdt), 0);

      const due = allInvoices
        .filter(inv => (inv.status === "unpaid" || inv.status === "overdue") && inv.created_at?.startsWith(monthKey))
        .reduce((sum, inv) => sum + Number(inv.amount_bdt), 0);

      months.push({ name: monthName, revenue, due });
    }
    return months;
  }, [allInvoices]);

  // User signup growth (last 6 months)
  const userGrowthData = useMemo(() => {
    const months: { name: string; users: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthName = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const count = allProfiles.filter(p => p.created_at?.startsWith(monthKey)).length;
      months.push({ name: monthName, users: count });
    }
    return months;
  }, [allProfiles]);

  // Service type distribution
  const serviceTypeData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    allServices.forEach(s => {
      const label = s.service_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      typeMap[label] = (typeMap[label] || 0) + 1;
    });
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [allServices]);

  // Ticket status distribution
  const ticketStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    allTickets.forEach(t => {
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [allTickets]);

  // Daily revenue trend (last 30 days)
  const dailyRevenueData = useMemo(() => {
    const days: { name: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("default", { month: "short", day: "numeric" });
      const dayInvoices = allInvoices.filter(inv => inv.status === "paid" && inv.paid_at?.startsWith(dayKey));
      days.push({
        name: label,
        revenue: dayInvoices.reduce((sum, inv) => sum + Number(inv.amount_bdt), 0),
        orders: dayInvoices.length,
      });
    }
    return days;
  }, [allInvoices]);

  // Conversion metrics
  const conversionMetrics = useMemo(() => {
    const totalInv = allInvoices.length;
    const paidInv = allInvoices.filter(i => i.status === "paid").length;
    const paymentRate = totalInv > 0 ? Math.round((paidInv / totalInv) * 100) : 0;

    const totalUsers = allProfiles.length;
    const usersWithService = new Set(allServices.map(s => s.user_id)).size;
    const activationRate = totalUsers > 0 ? Math.round((usersWithService / totalUsers) * 100) : 0;

    const last7 = allInvoices.filter(i => i.status === "paid" && i.paid_at && new Date(i.paid_at) > new Date(Date.now() - 7 * 86400000));
    const prev7 = allInvoices.filter(i => i.status === "paid" && i.paid_at && new Date(i.paid_at) > new Date(Date.now() - 14 * 86400000) && new Date(i.paid_at) <= new Date(Date.now() - 7 * 86400000));
    const rev7 = last7.reduce((s, i) => s + Number(i.amount_bdt), 0);
    const revPrev7 = prev7.reduce((s, i) => s + Number(i.amount_bdt), 0);
    const revGrowth = revPrev7 > 0 ? Math.round(((rev7 - revPrev7) / revPrev7) * 100) : rev7 > 0 ? 100 : 0;

    const avgOrderValue = paidInv > 0 ? Math.round(allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount_bdt), 0) / paidInv) : 0;

    return { paymentRate, activationRate, revGrowth, avgOrderValue, rev7 };
  }, [allInvoices, allProfiles, allServices]);

  if (loading) return <AdminDashboardSkeleton />;

  const statCards = [
    { label: tr("admin.totalUsers"), value: stats.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", trend: "+12%", up: true },
    { label: tr("admin.activeServices"), value: stats.activeServices, icon: Server, color: "text-success", bg: "bg-success/10", sub: `${stats.suspendedServices} ${tr("admin.suspended")}` },
    { label: tr("admin.totalRevenue"), value: `৳${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-success", bg: "bg-success/10", trend: "+8%", up: true },
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: ৳{Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  const SimpleTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportInvoices = () => {
    downloadCSV("invoices",
      ["Invoice#", "Amount (BDT)", "Status", "Payment Method", "Description", "Created", "Paid At", "Due Date"],
      allInvoices.map(i => [i.invoice_number, i.amount_bdt, i.status, i.payment_method || "", i.description || "", i.created_at?.slice(0, 10) || "", i.paid_at?.slice(0, 10) || "", i.due_date?.slice(0, 10) || ""])
    );
  };

  const exportUsers = () => {
    downloadCSV("users",
      ["Name", "Phone", "Company", "City", "Country", "Joined"],
      allProfiles.map(p => [p.full_name || "", p.phone || "", p.company_name || "", p.city || "", p.country || "", p.created_at?.slice(0, 10) || ""])
    );
  };

  const exportServices = () => {
    downloadCSV("services",
      ["Name", "Type", "Status", "Domain", "Price (BDT)", "Billing Cycle", "Start", "Expiry"],
      allServices.map(s => [s.name, s.service_type, s.status, s.domain || "", s.price_bdt, s.billing_cycle || "", s.start_date?.slice(0, 10) || "", s.expiry_date?.slice(0, 10) || ""])
    );
  };

  const exportTickets = () => {
    downloadCSV("tickets",
      ["Ticket#", "Subject", "Status", "Priority", "Department", "Created"],
      allTickets.map(t => [t.ticket_number, t.subject, t.status, t.priority, t.department, t.created_at?.slice(0, 10) || ""])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tr("admin.dashboardTitle")}</h1>
          <p className="text-sm text-muted-foreground">{tr("admin.dashboardSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "ইনভয়েস", fn: exportInvoices },
            { label: "ইউজার", fn: exportUsers },
            { label: "সার্ভিস", fn: exportServices },
            { label: "টিকেট", fn: exportTickets },
          ].map(e => (
            <button key={e.label} onClick={e.fn} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-xs font-medium text-foreground transition-colors">
              <Download className="w-3.5 h-3.5" />
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5 flex items-start gap-4 group hover:shadow-lg transition-shadow">
            <div className={`p-3 rounded-xl ${card.bg} group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                {card.trend && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${card.up ? "text-success" : "text-destructive"}`}>
                    {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.trend}
                  </span>
                )}
              </div>
              {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "পেমেন্ট কনভার্সন", value: `${conversionMetrics.paymentRate}%`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "ইনভয়েস → পেমেন্ট" },
          { label: "ইউজার অ্যাক্টিভেশন", value: `${conversionMetrics.activationRate}%`, icon: Users, color: "text-primary", bg: "bg-primary/10", desc: "সাইনআপ → সার্ভিস" },
          { label: "সাপ্তাহিক গ্রোথ", value: `${conversionMetrics.revGrowth > 0 ? "+" : ""}${conversionMetrics.revGrowth}%`, icon: TrendingUp, color: conversionMetrics.revGrowth >= 0 ? "text-emerald-500" : "text-destructive", bg: conversionMetrics.revGrowth >= 0 ? "bg-emerald-500/10" : "bg-destructive/10", desc: `৳${conversionMetrics.rev7.toLocaleString()} গত ৭ দিনে` },
          { label: "গড় অর্ডার ভ্যালু", value: `৳${conversionMetrics.avgOrderValue.toLocaleString()}`, icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10", desc: "পেইড অর্ডার প্রতি" },
        ].map((m, i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${m.bg}`}><m.icon className={`w-4 h-4 ${m.color}`} /></div>
              <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Daily Revenue Trend */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            দৈনিক রেভিনিউ ট্রেন্ড (৩০ দিন)
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenueData}>
              <defs>
                <linearGradient id="dailyRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="রেভিনিউ" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="orders" name="অর্ডার সংখ্যা" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 5 }} yAxisId={0} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 1: Revenue + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              {tr("admin.monthlyRevenue")}
            </h2>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={tr("admin.revenue")}
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="due"
                  name={tr("admin.due")}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#dueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              {tr("admin.userGrowth")}
            </h2>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar
                  dataKey="users"
                  name={tr("admin.newUsers")}
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Service Distribution + Ticket Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Type Distribution */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-muted-foreground" />
            {tr("admin.serviceDistribution")}
          </h2>
          <div className="h-64 flex items-center justify-center">
            {serviceTypeData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr("admin.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {serviceTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ticket Status Distribution */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-muted-foreground" />
            {tr("admin.ticketOverview")}
          </h2>
          <div className="h-64 flex items-center justify-center">
            {ticketStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr("admin.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name={tr("admin.ticketCount")} radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {ticketStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Coupon Usage Analytics */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-muted-foreground" />
          কুপন ইউসেজ অ্যানালিটিক্স
        </h2>
        {allCoupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">কোনো কুপন নেই</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Bar Chart */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">ব্যবহারের সংখ্যা</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allCoupons.filter(c => c.used_count > 0).sort((a: any, b: any) => b.used_count - a.used_count).slice(0, 10).map((c: any) => ({ name: c.code, uses: c.used_count }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={100} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="uses" name="ব্যবহার" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Coupon Summary Table */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">কুপন সামারি</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allCoupons.sort((a: any, b: any) => b.used_count - a.used_count).map((c: any) => {
                  const totalDiscount = c.discount_type === "percentage"
                    ? `${c.discount_value}% × ${c.used_count}`
                    : `৳${Number(c.discount_value).toLocaleString()} × ${c.used_count}`;
                  const estimatedSaved = c.discount_type === "fixed"
                    ? Number(c.discount_value) * c.used_count
                    : null;
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary font-mono">{c.code}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {c.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{totalDiscount}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground tabular-nums">{c.used_count} বার</p>
                        {estimatedSaved !== null && estimatedSaved > 0 && (
                          <p className="text-[10px] text-muted-foreground">৳{estimatedSaved.toLocaleString()} ছাড়</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
