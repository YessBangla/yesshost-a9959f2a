import { useEffect, useState, useMemo } from "react";
import {
  Users, Server, FileText, HeadphonesIcon, TrendingUp,
  DollarSign, Activity, ArrowUpRight, ArrowDownRight, Tag
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{tr("admin.dashboardTitle")}</h1>
        <p className="text-sm text-muted-foreground">{tr("admin.dashboardSubtitle")}</p>
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
