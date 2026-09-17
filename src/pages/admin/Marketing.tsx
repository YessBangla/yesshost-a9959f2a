import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Tag, Share2, Mail, Star, MousePointerClick, UserPlus, TrendingUp, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const AdminMarketing = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [clicks, setClicks] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, cl, r, cm, m, t, o] = await Promise.all([
        supabase.from("coupons").select("*").order("used_count", { ascending: false }),
        supabase.from("affiliate_clicks").select("created_at,source_page"),
        supabase.from("affiliate_referrals").select("status,created_at"),
        supabase.from("affiliate_commissions").select("amount_bdt,status"),
        supabase.from("contact_messages").select("is_read,created_at"),
        supabase.from("testimonials").select("is_active,rating"),
        supabase.from("orders").select("coupon_code,discount_bdt,total_bdt,created_at"),
      ]);
      setCoupons(c.data || []);
      setClicks(cl.data || []);
      setReferrals(r.data || []);
      setCommissions(cm.data || []);
      setMessages(m.data || []);
      setTestimonials(t.data || []);
      setOrders(o.data || []);
      setLoading(false);
    })();
  }, []);

  const money = (n: number) => `৳${Math.round(n).toLocaleString(bn ? "bn-BD" : "en-US")}`;

  const stats = useMemo(() => {
    const activeCoupons = coupons.filter(c => c.is_active).length;
    const discountGiven = orders.reduce((a, b) => a + Number(b.discount_bdt || 0), 0);
    const couponOrders = orders.filter(o => o.coupon_code).length;
    return {
      activeCoupons,
      couponOrders,
      discountGiven,
      clicks: clicks.length,
      referrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === "active").length,
      commission: commissions.reduce((a, b) => a + Number(b.amount_bdt || 0), 0),
      unreadMessages: messages.filter(m => !m.is_read).length,
      testimonials: testimonials.filter(t => t.is_active).length,
      conversion: clicks.length ? (referrals.length / clicks.length) * 100 : 0,
    };
  }, [coupons, orders, clicks, referrals, commissions, messages, testimonials]);

  const clickTrend = useMemo(() => {
    const rows: { name: string; clicks: number; signups: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      rows.push({
        name: d.toLocaleDateString(bn ? "bn-BD" : "en-US", { month: "short", day: "numeric" }),
        clicks: clicks.filter(c => (c.created_at || "").startsWith(key)).length,
        signups: referrals.filter(r => (r.created_at || "").startsWith(key)).length,
      });
    }
    return rows;
  }, [clicks, referrals, bn]);

  const couponUsage = useMemo(() => {
    const map: Record<string, { uses: number; discount: number }> = {};
    orders.filter(o => o.coupon_code).forEach(o => {
      const k = o.coupon_code as string;
      map[k] = map[k] || { uses: 0, discount: 0 };
      map[k].uses += 1;
      map[k].discount += Number(o.discount_bdt || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].uses - a[1].uses).slice(0, 8);
  }, [orders]);

  const cards = [
    { label: bn ? "সক্রিয় কুপন" : "Active coupons", value: stats.activeCoupons, icon: Tag },
    { label: bn ? "কুপন ব্যবহৃত অর্ডার" : "Coupon orders", value: stats.couponOrders, icon: TrendingUp },
    { label: bn ? "মোট ছাড়" : "Discount given", value: money(stats.discountGiven), icon: Tag },
    { label: bn ? "রেফারেল ক্লিক" : "Referral clicks", value: stats.clicks, icon: MousePointerClick },
    { label: bn ? "রেফার করা গ্রাহক" : "Referred customers", value: `${stats.referrals} (${stats.activeReferrals})`, icon: UserPlus },
    { label: bn ? "ক্লিক → সাইনআপ" : "Click → signup", value: `${stats.conversion.toFixed(1)}%`, icon: Share2 },
    { label: bn ? "অপঠিত বার্তা" : "Unread messages", value: stats.unreadMessages, icon: Mail },
    { label: bn ? "প্রকাশিত রিভিউ" : "Published reviews", value: stats.testimonials, icon: Star },
  ];

  const quickLinks = [
    { to: "/admin/coupons", label: bn ? "কুপন ব্যবস্থাপনা" : "Manage coupons", icon: Tag },
    { to: "/admin/affiliates", label: bn ? "অ্যাফিলিয়েট" : "Affiliates", icon: Share2 },
    { to: "/admin/contact-messages", label: bn ? "কন্টাক্ট বার্তা" : "Contact messages", icon: Mail },
    { to: "/admin/cms", label: bn ? "সাইট কন্টেন্ট" : "Site content", icon: ExternalLink },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{bn ? "মার্কেটিং" : "Marketing"}</h1>
        <p className="text-sm text-muted-foreground">{bn ? "কুপন, অ্যাফিলিয়েট ও প্রচারণার ফলাফল" : "Coupons, affiliate and campaign performance"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <h2 className="text-sm font-semibold mb-3">{bn ? "গত ৩০ দিনের রেফারেল ক্লিক ও সাইনআপ" : "Referral clicks & signups (30 days)"}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={clickTrend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" fontSize={11} minTickGap={24} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="signups" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "সেরা কুপন" : "Top coupons"}</h2>
          {couponUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">{bn ? "এখনো কোনো কুপন ব্যবহৃত হয়নি" : "No coupon used yet"}</p>
          ) : (
            <ul className="space-y-2">
              {couponUsage.map(([code, v]) => (
                <li key={code} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                  <span className="font-mono font-medium">{code}</span>
                  <span className="text-muted-foreground">{v.uses} × · {money(v.discount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">{bn ? "কুপনের অবস্থা" : "Coupon inventory"}</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {coupons.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="font-mono font-medium truncate">{c.code}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : money(Number(c.discount_value))}
                    {c.expires_at ? ` · ${new Date(c.expires_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}` : ""}
                  </p>
                </div>
                <span className={`text-[11px] font-medium ${c.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
                </span>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">{bn ? "কোনো কুপন নেই" : "No coupons"}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(q => (
          <Link key={q.to} to={q.to} className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium hover:bg-accent/10 min-h-[56px]">
            <q.icon className="w-4 h-4 text-primary" /> {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminMarketing;
