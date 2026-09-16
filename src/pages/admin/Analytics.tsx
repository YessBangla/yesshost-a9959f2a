import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign, Download, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
const RANGES = [30, 90, 180, 365];

const AdminAnalytics = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [range, setRange] = useState(90);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clicks, setClicks] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [i, o, p, s, c] = await Promise.all([
        supabase.from("invoices").select("amount_bdt,status,created_at,paid_at,payment_method"),
        supabase.from("orders").select("total_bdt,status,created_at,payment_method"),
        supabase.from("profiles").select("created_at"),
        supabase.from("services").select("service_type,status,price_bdt,created_at"),
        supabase.from("affiliate_clicks").select("created_at,source_page"),
      ]);
      setInvoices(i.data || []);
      setOrders(o.data || []);
      setProfiles(p.data || []);
      setServices(s.data || []);
      setClicks(c.data || []);
      setLoading(false);
    })();
  }, []);

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - range);
    return d;
  }, [range]);

  const inRange = (v?: string | null) => !!v && new Date(v) >= since;

  const kpis = useMemo(() => {
    const paid = invoices.filter(i => i.status === "paid" && inRange(i.paid_at || i.created_at));
    const revenue = paid.reduce((a, b) => a + Number(b.amount_bdt || 0), 0);
    const rangeOrders = orders.filter(o => inRange(o.created_at));
    const newUsers = profiles.filter(p => inRange(p.created_at)).length;
    const completed = rangeOrders.filter(o => ["active", "completed"].includes(o.status)).length;
    return {
      revenue,
      orders: rangeOrders.length,
      newUsers,
      arpu: newUsers ? revenue / newUsers : 0,
      conversion: rangeOrders.length ? (completed / rangeOrders.length) * 100 : 0,
      aov: paid.length ? revenue / paid.length : 0,
    };
  }, [invoices, orders, profiles, range]);

  const trend = useMemo(() => {
    const buckets = range <= 90 ? range : Math.ceil(range / 7);
    const stepDays = range <= 90 ? 1 : 7;
    const rows: { name: string; revenue: number; orders: number; users: number }[] = [];
    for (let b = buckets - 1; b >= 0; b--) {
      const end = new Date();
      end.setDate(end.getDate() - b * stepDays);
      const start = new Date(end);
      start.setDate(start.getDate() - stepDays);
      const within = (v?: string | null) => !!v && new Date(v) > start && new Date(v) <= end;
      rows.push({
        name: end.toLocaleDateString(bn ? "bn-BD" : "en-US", { month: "short", day: "numeric" }),
        revenue: invoices.filter(i => i.status === "paid" && within(i.paid_at || i.created_at)).reduce((a, x) => a + Number(x.amount_bdt || 0), 0),
        orders: orders.filter(o => within(o.created_at)).length,
        users: profiles.filter(p => within(p.created_at)).length,
      });
    }
    return rows;
  }, [invoices, orders, profiles, range, bn]);

  const serviceMix = useMemo(() => {
    const map: Record<string, number> = {};
    services.filter(s => inRange(s.created_at)).forEach(s => {
      const key = String(s.service_type).replace(/_/g, " ");
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [services, range]);

  const paymentMix = useMemo(() => {
    const map: Record<string, number> = {};
    invoices
      .filter(i => i.status === "paid" && inRange(i.paid_at || i.created_at))
      .forEach(i => {
        const key = i.payment_method || (bn ? "অজানা" : "Unknown");
        map[key] = (map[key] || 0) + Number(i.amount_bdt || 0);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [invoices, bn, range]);

  const topPages = useMemo(() => {
    const map: Record<string, number> = {};
    clicks.filter(c => inRange(c.created_at)).forEach(c => {
      const key = c.source_page || "/";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [clicks, range]);

  const exportCsv = () => {
    const header = ["period", "revenue_bdt", "orders", "new_users"];
    const rows = trend.map(t => [t.name, t.revenue, t.orders, t.users]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `yesshost-analytics-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const money = (n: number) => `৳${Math.round(n).toLocaleString(bn ? "bn-BD" : "en-US")}`;

  const cards = [
    { label: bn ? "আয়" : "Revenue", value: money(kpis.revenue), icon: DollarSign },
    { label: bn ? "অর্ডার" : "Orders", value: kpis.orders.toLocaleString(), icon: ShoppingCart },
    { label: bn ? "নতুন গ্রাহক" : "New customers", value: kpis.newUsers.toLocaleString(), icon: Users },
    { label: bn ? "গড় অর্ডার মূল্য" : "Avg. order value", value: money(kpis.aov), icon: TrendingUp },
    { label: bn ? "গ্রাহকপ্রতি আয়" : "Revenue / customer", value: money(kpis.arpu), icon: DollarSign },
    { label: bn ? "অর্ডার সফলতার হার" : "Order success rate", value: `${kpis.conversion.toFixed(1)}%`, icon: Percent },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{bn ? "অ্যানালিটিক্স ও রিপোর্ট" : "Analytics & Reports"}</h1>
          <p className="text-sm text-muted-foreground">{bn ? "আয়, অর্ডার ও গ্রাহক বৃদ্ধির বিশ্লেষণ" : "Revenue, orders and customer growth insights"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-2 text-xs font-medium min-h-[40px] ${range === r ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent/10"}`}
              >
                {r}{bn ? "দি" : "d"}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg border border-border bg-card text-xs font-medium hover:bg-accent/10">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </div>
            <p className="mt-2 text-lg font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">{bn ? "আয়ের ধারা" : "Revenue trend"}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" fontSize={11} minTickGap={24} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "অর্ডার ও নতুন গ্রাহক" : "Orders & new customers"}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} minTickGap={24} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="users" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "সার্ভিস মিক্স" : "Service mix"}</h2>
          {serviceMix.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">{bn ? "এখনো কোনো সার্ভিস নেই" : "No services yet"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={serviceMix} dataKey="value" nameKey="name" outerRadius={90} label>
                  {serviceMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "পেমেন্ট মাধ্যম অনুযায়ী আয়" : "Revenue by payment method"}</h2>
          {paymentMix.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">{bn ? "কোনো পরিশোধিত ইনভয়েস নেই" : "No paid invoices yet"}</p>
          ) : (
            <ul className="space-y-2">
              {paymentMix.map(p => (
                <li key={p.name} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                  <span className="capitalize">{p.name}</span>
                  <span className="font-semibold">{money(p.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "রেফারেল ট্রাফিক (টপ পেজ)" : "Referral traffic (top pages)"}</h2>
          {topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">{bn ? "এই সময়ে কোনো ক্লিক নেই" : "No clicks in this period"}</p>
          ) : (
            <ul className="space-y-2">
              {topPages.map(p => (
                <li key={p.name} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                  <span className="truncate mr-3">{p.name}</span>
                  <span className="font-semibold">{p.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
