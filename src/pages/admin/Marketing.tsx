import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Download, ExternalLink, Mail, MousePointerClick, RefreshCcw, SearchX, Share2, Tag, TrendingUp, UserPlus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";

type CampaignRow = { id: string; channel: "coupon" | "affiliate"; name: string; detail: string; engagements: number; conversions: number; value: number; status: "active" | "inactive"; createdAt: string };

const AdminMarketing = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [clicks, setClicks] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    const [couponResult, clickResult, referralResult, messageResult, orderResult] = await Promise.all([
      supabase.from("coupons").select("id,code,description,discount_type,discount_value,used_count,max_uses,is_active,expires_at,created_at").order("used_count", { ascending: false }),
      supabase.from("affiliate_clicks").select("id,ref_code,source_page,created_at"),
      supabase.from("affiliate_referrals").select("id,referrer_user_id,status,created_at"),
      supabase.from("contact_messages").select("id,is_read,created_at"),
      supabase.from("orders").select("id,coupon_code,discount_bdt,total_bdt,payment_status,created_at"),
    ]);
    const firstError = [couponResult.error, clickResult.error, referralResult.error, messageResult.error, orderResult.error].find(Boolean);
    if (firstError) setError(bn ? "মার্কেটিং তথ্য সম্পূর্ণ লোড করা যায়নি।" : "Marketing data could not be loaded completely.");
    setCoupons(couponResult.data || []); setClicks(clickResult.data || []); setReferrals(referralResult.data || []); setMessages(messageResult.data || []); setOrders(orderResult.data || []);
    setLoading(false);
  }, [bn]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, channel, status, pageSize]);
  const money = (value: number) => `৳${Math.round(value || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`;

  const campaignRows = useMemo<CampaignRow[]>(() => {
    const couponRows = coupons.map((coupon) => {
      const couponOrders = orders.filter((order) => order.coupon_code === coupon.code);
      return { id: `coupon-${coupon.id}`, channel: "coupon" as const, name: coupon.code, detail: coupon.description || (bn ? "ডিসকাউন্ট ক্যাম্পেইন" : "Discount campaign"), engagements: Number(coupon.used_count || couponOrders.length), conversions: couponOrders.filter((order) => order.payment_status === "paid").length, value: couponOrders.reduce((sum, order) => sum + Number(order.total_bdt || 0), 0), status: coupon.is_active && (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) ? "active" as const : "inactive" as const, createdAt: coupon.created_at };
    });
    const sourceMap = new Map<string, CampaignRow>();
    clicks.forEach((click) => { const name = click.source_page || click.ref_code || "Direct referral"; const current = sourceMap.get(name); if (current) current.engagements += 1; else sourceMap.set(name, { id: `affiliate-${name}`, channel: "affiliate", name, detail: bn ? "অ্যাফিলিয়েট ট্রাফিক উৎস" : "Affiliate traffic source", engagements: 1, conversions: 0, value: 0, status: "active", createdAt: click.created_at }); });
    const affiliateRows = Array.from(sourceMap.values());
    affiliateRows.forEach((row, index) => { row.conversions = index === 0 ? referrals.length : 0; });
    return [...couponRows, ...affiliateRows].sort((a, b) => b.engagements - a.engagements);
  }, [coupons, orders, clicks, referrals, bn]);

  const filtered = campaignRows.filter((row) => (!search || `${row.name} ${row.detail}`.toLowerCase().includes(search.toLowerCase())) && (channel === "all" || row.channel === channel) && (status === "all" || row.status === status));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const paidCouponOrders = orders.filter((order) => order.coupon_code && order.payment_status === "paid");
  const conversion = clicks.length ? referrals.length / clicks.length * 100 : 0;
  const metrics = [
    { label: bn ? "মোট রিচ" : "TOTAL REACH", value: clicks.length + campaignRows.filter((row) => row.channel === "coupon").reduce((sum, row) => sum + row.engagements, 0), detail: bn ? "ট্র্যাকড ইন্টার‍্যাকশন" : "tracked interactions", icon: MousePointerClick },
    { label: bn ? "কনভার্সন" : "CONVERSION", value: `${conversion.toFixed(1)}%`, detail: `${referrals.length} ${bn ? "রেফারেল" : "referrals"}`, icon: TrendingUp, tone: "success" as const },
    { label: bn ? "ক্যাম্পেইন আয়" : "CAMPAIGN REVENUE", value: money(paidCouponOrders.reduce((sum, order) => sum + Number(order.total_bdt || 0), 0)), detail: `${paidCouponOrders.length} ${bn ? "পরিশোধিত অর্ডার" : "paid orders"}`, icon: Tag },
    { label: bn ? "নতুন ইনকোয়ারি" : "NEW INQUIRIES", value: messages.filter((message) => !message.is_read).length, detail: bn ? "উত্তরের অপেক্ষায়" : "awaiting response", icon: Mail, tone: "warning" as const },
  ];
  const trend = useMemo(() => Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (13 - index)); const key = date.toISOString().slice(0, 10); return { name: date.toLocaleDateString(bn ? "bn-BD" : "en-US", { month: "short", day: "numeric" }), clicks: clicks.filter((item) => item.created_at.startsWith(key)).length, conversions: referrals.filter((item) => item.created_at.startsWith(key)).length }; }), [clicks, referrals, bn]);
  const exportRows = () => downloadCsv("yesshost-marketing-performance", ["channel", "campaign", "engagements", "conversions", "revenue_bdt", "status", "created_at"], filtered.map((row) => [row.channel, row.name, row.engagements, row.conversions, row.value, row.status, csvDate(row.createdAt)]));

  return <div className="staff-console space-y-5">
    <StaffPageHeader title={bn ? "মার্কেটিং অপারেশনস" : "Marketing Operations"} description={bn ? "ক্যাম্পেইন, কনভার্সন ও গ্রাহক আগ্রহ এক জায়গায় পর্যালোচনা করুন" : "Review campaign reach, conversion and customer interest in one workspace"} actions={<div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCcw />{bn ? "রিফ্রেশ" : "Refresh"}</Button><Button onClick={exportRows} disabled={!filtered.length}><Download />CSV</Button></div>} />
    <StaffMetricStrip metrics={metrics} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"><section className="staff-panel p-4"><h2 className="font-display font-semibold">{bn ? "১৪ দিনের অ্যাকুইজিশন ট্রেন্ড" : "14-day acquisition trend"}</h2><p className="mt-1 text-xs text-muted-foreground">{bn ? "অ্যাফিলিয়েট ক্লিক থেকে সাইনআপ" : "Affiliate clicks progressing to sign-ups"}</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ left: -24 }}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="name" fontSize={10} minTickGap={24} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} fontSize={10} tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar dataKey="clicks" name={bn ? "ক্লিক" : "Clicks"} fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} /><Bar dataKey="conversions" name={bn ? "সাইনআপ" : "Sign-ups"} fill="hsl(var(--success))" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></section><aside className="staff-panel p-4"><p className="staff-eyebrow">{bn ? "দ্রুত কাজ" : "QUICK ACTIONS"}</p><div className="mt-3 divide-y divide-border">{[{ to: "/admin/coupons", label: bn ? "কুপন পরিচালনা" : "Manage coupons", icon: Tag }, { to: "/admin/affiliates", label: bn ? "অ্যাফিলিয়েট রিপোর্ট" : "Affiliate reports", icon: Share2 }, { to: "/admin/contact-messages", label: bn ? "গ্রাহক ইনকোয়ারি" : "Customer inquiries", icon: Mail }, { to: "/admin/cms", label: bn ? "সাইট কন্টেন্ট" : "Site content", icon: ExternalLink }].map((item) => <Link key={item.to} to={item.to} className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm font-medium text-foreground hover:text-primary"><span className="flex items-center gap-2"><item.icon className="size-4 text-primary" />{item.label}</span><ExternalLink className="size-3.5 text-muted-foreground" /></Link>)}</div></aside></div>
    <section className="staff-panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row"><StaffSearch value={search} onChange={setSearch} placeholder={bn ? "ক্যাম্পেইন বা উৎস খুঁজুন" : "Search campaign or source"} /><div className="grid grid-cols-2 gap-2"><Select value={channel} onValueChange={setChannel}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব চ্যানেল" : "All channels"}</SelectItem><SelectItem value="coupon">{bn ? "কুপন" : "Coupon"}</SelectItem><SelectItem value="affiliate">{bn ? "অ্যাফিলিয়েট" : "Affiliate"}</SelectItem></SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব স্ট্যাটাস" : "All statuses"}</SelectItem><SelectItem value="active">{bn ? "সক্রিয়" : "Active"}</SelectItem><SelectItem value="inactive">{bn ? "নিষ্ক্রিয়" : "Inactive"}</SelectItem></SelectContent></Select></div></div>
      {loading ? <div className="p-4"><StaffLoading rows={6} /></div> : error && !campaignRows.length ? <StaffEmpty icon={Mail} title={bn ? "তথ্য পাওয়া যায়নি" : "Marketing data unavailable"} description={error} /> : !paged.length ? <StaffEmpty icon={SearchX} title={bn ? "কোনো ক্যাম্পেইন পাওয়া যায়নি" : "No campaign found"} description={bn ? "সার্চ বা ফিল্টার পরিবর্তন করুন।" : "Try changing the search or filters."} /> : <div className="divide-y divide-border">{paged.map((row) => <article key={row.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_110px_110px_120px] md:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-semibold">{row.name}</p><span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{row.channel}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{row.detail}</p></div><div><p className="staff-eyebrow">{bn ? "ইন্টার‍্যাকশন" : "ENGAGEMENTS"}</p><p className="mt-1 font-semibold tabular-nums">{row.engagements}</p></div><div><p className="staff-eyebrow">{bn ? "কনভার্সন" : "CONVERSIONS"}</p><p className="mt-1 font-semibold tabular-nums">{row.conversions}</p></div><div className="md:text-right"><p className={row.status === "active" ? "text-sm font-medium text-success" : "text-sm text-muted-foreground"}>{row.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "নিষ্ক্রিয়" : "Inactive")}</p><p className="mt-1 text-xs text-muted-foreground">{row.value ? money(row.value) : new Date(row.createdAt).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p></div></article>)}</div>}
    </section><DataPagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 25, 50]} />
  </div>;
};

export default AdminMarketing;