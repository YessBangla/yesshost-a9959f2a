import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, DollarSign, Download, MousePointerClick, RefreshCw, Send, Share2, TrendingUp, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";

type Profile = { user_id: string; full_name: string | null };
type Commission = { id: string; user_id: string; amount_bdt: number; status: string; description: string | null; created_at: string };
type Payout = { id: string; user_id: string; amount_bdt: number; method: string | null; account_details: string | null; status: string; created_at: string };
type Click = { referrer_user_id: string; created_at: string };
type Referral = { referrer_user_id: string; status: string; created_at: string };
type QueueItem = (Commission & { kind: "commission" }) | (Payout & { kind: "payout" });

const money = (value: number, bn: boolean) => `৳${Number(value || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`;

const AdminAffiliates = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    const [commissionResult, payoutResult, clickResult, referralResult, profileResult] = await Promise.all([
      supabase.from("affiliate_commissions").select("id,user_id,amount_bdt,status,description,created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("affiliate_payouts").select("id,user_id,amount_bdt,method,account_details,status,created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("affiliate_clicks").select("referrer_user_id,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("affiliate_referrals").select("referrer_user_id,status,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("profiles").select("user_id,full_name").limit(1000),
    ]);
    const firstError = [commissionResult.error, payoutResult.error, clickResult.error, referralResult.error, profileResult.error].find(Boolean);
    if (firstError) setError(bn ? "অ্যাফিলিয়েট তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" : "Affiliate data could not be loaded. Please try again.");
    setCommissions((commissionResult.data || []) as Commission[]);
    setPayouts((payoutResult.data || []) as Payout[]);
    setClicks((clickResult.data || []) as Click[]);
    setReferrals((referralResult.data || []) as Referral[]);
    setProfiles((profileResult.data || []) as Profile[]);
    setLoading(false);
  }, [bn]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, kind, pageSize]);

  const names = useMemo(() => new Map(profiles.map((profile) => [profile.user_id, profile.full_name || (bn ? "নাম দেওয়া হয়নি" : "Unnamed partner")])), [profiles, bn]);
  const nameOf = (userId: string) => names.get(userId) || (bn ? "অজানা পার্টনার" : "Unknown partner");

  const metrics = useMemo(() => {
    const converted = referrals.filter((item) => ["converted", "active", "paid"].includes(item.status)).length;
    const conversion = clicks.length ? (converted / clicks.length) * 100 : 0;
    return [
      { label: bn ? "মোট ক্লিক" : "TOTAL CLICKS", value: clicks.length, detail: bn ? "ট্র্যাক করা ভিজিট" : "tracked visits", icon: MousePointerClick },
      { label: bn ? "কনভার্সন" : "CONVERSION", value: `${conversion.toFixed(1)}%`, detail: `${converted} ${bn ? "সফল" : "converted"}`, icon: TrendingUp, tone: "success" as const },
      { label: bn ? "পেআউট অপেক্ষমাণ" : "PAYOUT QUEUE", value: payouts.filter((item) => item.status === "requested").length, detail: bn ? "পর্যালোচনার জন্য" : "awaiting review", icon: Send, tone: "warning" as const },
      { label: bn ? "মোট পরিশোধিত" : "TOTAL PAID", value: money(payouts.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_bdt), 0), bn), detail: bn ? "সম্পন্ন পেআউট" : "settled payouts", icon: DollarSign, tone: "success" as const },
    ];
  }, [clicks, referrals, payouts, bn]);

  const queue = useMemo<QueueItem[]>(() => [
    ...payouts.map((item) => ({ ...item, kind: "payout" as const })),
    ...commissions.map((item) => ({ ...item, kind: "commission" as const })),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), [payouts, commissions]);

  const filtered = useMemo(() => queue.filter((item) => {
    const query = search.trim().toLocaleLowerCase(bn ? "bn-BD" : "en-US");
    const searchable = [nameOf(item.user_id), item.status, item.kind, String(item.amount_bdt), item.kind === "payout" ? item.method : item.description].filter(Boolean).join(" ").toLocaleLowerCase(bn ? "bn-BD" : "en-US");
    return (!query || searchable.includes(query)) && (status === "all" || item.status === status) && (kind === "all" || item.kind === kind);
  }), [queue, search, status, kind, names, bn]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const partners = useMemo(() => {
    const ids = new Set([...clicks.map((item) => item.referrer_user_id), ...referrals.map((item) => item.referrer_user_id), ...commissions.map((item) => item.user_id)]);
    return [...ids].map((userId) => {
      const partnerClicks = clicks.filter((item) => item.referrer_user_id === userId).length;
      const partnerReferrals = referrals.filter((item) => item.referrer_user_id === userId).length;
      const earned = commissions.filter((item) => item.user_id === userId && item.status === "approved").reduce((sum, item) => sum + Number(item.amount_bdt), 0);
      return { userId, name: nameOf(userId), clicks: partnerClicks, referrals: partnerReferrals, earned, rate: partnerClicks ? (partnerReferrals / partnerClicks) * 100 : 0 };
    }).sort((a, b) => b.earned - a.earned || b.referrals - a.referrals).slice(0, 5);
  }, [clicks, referrals, commissions, names, bn]);

  const updateCommission = async (id: string, nextStatus: "approved" | "rejected") => {
    setActing(id);
    const { error: actionError } = await supabase.from("affiliate_commissions").update({ status: nextStatus }).eq("id", id);
    setActing(null);
    if (actionError) return toast({ title: bn ? "আপডেট ব্যর্থ" : "Update failed", description: bn ? "অনুমতি ও তথ্য যাচাই করে আবার চেষ্টা করুন।" : "Check access and try again.", variant: "destructive" });
    toast({ title: nextStatus === "approved" ? (bn ? "কমিশন অনুমোদিত" : "Commission approved") : (bn ? "কমিশন বাতিল হয়েছে" : "Commission rejected") });
    await load(true);
  };

  const updatePayout = async (id: string, nextStatus: "paid" | "rejected") => {
    setActing(id);
    const { error: actionError } = await supabase.from("affiliate_payouts").update({ status: nextStatus, processed_at: nextStatus === "paid" ? new Date().toISOString() : null, note: nextStatus === "rejected" ? "Rejected by admin" : null }).eq("id", id);
    setActing(null);
    if (actionError) return toast({ title: bn ? "আপডেট ব্যর্থ" : "Update failed", description: bn ? "পেআউটটি আবার যাচাই করুন।" : "Review the payout and try again.", variant: "destructive" });
    toast({ title: nextStatus === "paid" ? (bn ? "পেআউট পরিশোধিত হয়েছে" : "Payout marked paid") : (bn ? "পেআউট বাতিল হয়েছে" : "Payout rejected") });
    await load(true);
  };

  const exportRows = () => downloadCsv("yesshost-affiliate-operations", ["type", "partner", "amount_bdt", "status", "method_or_description", "date"], filtered.map((item) => [item.kind, nameOf(item.user_id), item.amount_bdt, item.status, item.kind === "payout" ? item.method || "" : item.description || "", csvDate(item.created_at)]));

  return <div className="staff-console space-y-5">
    <StaffPageHeader title={bn ? "অ্যাফিলিয়েট অপারেশনস" : "Affiliate Operations"} description={bn ? "কনভার্সন, কমিশন এবং পেআউট এক জায়গা থেকে পরিচালনা করুন" : "Manage conversion, commissions and payouts from one workspace"} actions={<div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="size-4" />{bn ? "রিফ্রেশ" : "Refresh"}</Button><Button onClick={exportRows} disabled={!filtered.length}><Download className="size-4" />CSV</Button></div>} />
    <StaffMetricStrip metrics={metrics} />

    <section className="staff-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center">
        <StaffSearch value={search} onChange={setSearch} placeholder={bn ? "পার্টনার, মাধ্যম বা স্ট্যাটাস খুঁজুন" : "Search partner, method or status"} />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={kind} onValueChange={setKind}><SelectTrigger className="h-11 min-w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব রেকর্ড" : "All records"}</SelectItem><SelectItem value="payout">{bn ? "পেআউট" : "Payouts"}</SelectItem><SelectItem value="commission">{bn ? "কমিশন" : "Commissions"}</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-11 min-w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব স্ট্যাটাস" : "All statuses"}</SelectItem><SelectItem value="requested">{bn ? "অনুরোধ" : "Requested"}</SelectItem><SelectItem value="pending">{bn ? "অপেক্ষমাণ" : "Pending"}</SelectItem><SelectItem value="approved">{bn ? "অনুমোদিত" : "Approved"}</SelectItem><SelectItem value="paid">{bn ? "পরিশোধিত" : "Paid"}</SelectItem><SelectItem value="rejected">{bn ? "বাতিল" : "Rejected"}</SelectItem></SelectContent></Select>
        </div>
      </div>
      {loading ? <div className="p-4"><StaffLoading rows={6} /></div> : error ? <StaffEmpty icon={Share2} title={bn ? "তথ্য লোড হয়নি" : "Data unavailable"} description={error} /> : paged.length === 0 ? <StaffEmpty icon={Share2} title={bn ? "কোনো রেকর্ড পাওয়া যায়নি" : "No records found"} description={bn ? "সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।" : "Try changing the search or filters."} /> : <div className="divide-y divide-border">
        {paged.map((item) => <article key={`${item.kind}-${item.id}`} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_140px_130px_auto] md:items-center">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{nameOf(item.user_id)}</p><span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">{item.kind}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{item.kind === "payout" ? `${item.method || "—"} · ${item.account_details || "—"}` : item.description || "—"}</p></div>
          <div><p className="staff-eyebrow">{bn ? "পরিমাণ" : "AMOUNT"}</p><p className="mt-1 font-semibold tabular-nums text-foreground">{money(item.amount_bdt, bn)}</p></div>
          <div><p className="staff-eyebrow">{bn ? "স্ট্যাটাস" : "STATUS"}</p><p className="mt-1 text-sm font-medium capitalize text-foreground">{item.status}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p></div>
          <div className="flex min-w-44 gap-2 md:justify-end">{((item.kind === "payout" && item.status === "requested") || (item.kind === "commission" && item.status === "pending")) ? <><Button size="sm" disabled={acting === item.id} onClick={() => item.kind === "payout" ? void updatePayout(item.id, "paid") : void updateCommission(item.id, "approved")}><Check className="size-4" />{bn ? "অনুমোদন" : "Approve"}</Button><Button size="icon" variant="outline" disabled={acting === item.id} aria-label={bn ? "বাতিল করুন" : "Reject"} onClick={() => item.kind === "payout" ? void updatePayout(item.id, "rejected") : void updateCommission(item.id, "rejected")}><X className="size-4 text-destructive" /></Button></> : <span className="text-xs text-muted-foreground">{bn ? "কোনো পদক্ষেপ নেই" : "No action needed"}</span>}</div>
        </article>)}
      </div>}
    </section>
    <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 25, 50]} />

    <section className="staff-panel overflow-hidden">
      <div className="border-b border-border p-4"><h2 className="font-display font-semibold text-foreground">{bn ? "শীর্ষ পার্টনার পারফরম্যান্স" : "Top Partner Performance"}</h2><p className="mt-1 text-xs text-muted-foreground">{bn ? "ক্লিক থেকে রেফারেল ও অনুমোদিত কমিশনের সারসংক্ষেপ" : "Clicks, referrals and approved commission at a glance"}</p></div>
      {partners.length === 0 ? <StaffEmpty icon={Users} title={bn ? "পারফরম্যান্স তথ্য নেই" : "No performance data"} description={bn ? "অ্যাফিলিয়েট কার্যক্রম শুরু হলে তথ্য দেখা যাবে।" : "Partner performance will appear after affiliate activity begins."} /> : <div className="divide-y divide-border">{partners.map((partner, index) => <div key={partner.userId} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[28px_minmax(0,1fr)_100px_100px_110px] sm:items-center"><span className="text-sm font-semibold tabular-nums text-muted-foreground">{index + 1}</span><div className="min-w-0"><p className="truncate font-medium text-foreground">{partner.name}</p><p className="text-xs text-muted-foreground">{partner.rate.toFixed(1)}% {bn ? "কনভার্সন" : "conversion"}</p></div><p className="text-sm text-foreground"><span className="staff-eyebrow block">{bn ? "ক্লিক" : "CLICKS"}</span>{partner.clicks}</p><p className="text-sm text-foreground"><span className="staff-eyebrow block">{bn ? "রেফারেল" : "REFERRALS"}</span>{partner.referrals}</p><p className="text-sm font-semibold text-foreground"><span className="staff-eyebrow block">{bn ? "কমিশন" : "COMMISSION"}</span>{money(partner.earned, bn)}</p></div>)}</div>}
    </section>
  </div>;
};

export default AdminAffiliates;