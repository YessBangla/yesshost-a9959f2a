import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Share2, Users, MousePointer, DollarSign, Wallet, Copy, TrendingUp,
  Clock, CheckCircle2, XCircle, RefreshCw, Link2, Send, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fmtBDT = (v: number, bn: boolean) =>
  `৳${Number(v || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`;

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [clicks, setClicks] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ method: "bkash", account: "", amount: "" });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Ensure affiliate profile exists (auto-create with unique code)
    let prof: any = null;
    const { data: existing } = await supabase
      .from("affiliate_profiles").select("*").eq("user_id", user.id).maybeSingle();
    prof = existing;
    if (!prof) {
      const code = `YH${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
      const { data: created, error } = await supabase
        .from("affiliate_profiles").insert({ user_id: user.id, referral_code: code }).select().single();
      if (!error) prof = created;
    }
    setProfile(prof);
    if (prof) {
      // Claim pending referral (user may have signed up with a ?ref= link)
      const storedRef = localStorage.getItem("yh_ref");
      if (storedRef) {
        supabase.functions.invoke("affiliate-track", { body: { action: "claim", referral_code: storedRef } })
          .then(() => localStorage.removeItem("yh_ref")).catch(() => {});
      }
      const [c, r, cm, p] = await Promise.all([
        supabase.from("affiliate_clicks").select("*").eq("referrer_user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("affiliate_referrals").select("*").eq("referrer_user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("affiliate_commissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("affiliate_payouts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setClicks(c.data || []); setReferrals(r.data || []);
      setCommissions(cm.data || []); setPayouts(p.data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const earned = commissions.filter(c => c.status !== "pending").reduce((s, c) => s + Number(c.amount_bdt), 0);
    const pending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount_bdt), 0);
    const paidOut = payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount_bdt), 0);
    const inReview = payouts.filter(p => p.status === "requested" || p.status === "processing").reduce((s, p) => s + Number(p.amount_bdt), 0);
    return {
      clicks: clicks.length,
      referrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === "active").length,
      earned, pending, paidOut, inReview,
      available: Math.max(0, earned - paidOut - inReview),
    };
  }, [clicks, referrals, commissions, payouts]);

  const referralLink = profile ? `${window.location.origin}/signup?ref=${profile.referral_code}` : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: bn ? "লিংক কপি হয়েছে!" : "Link copied!" });
  };

  const requestPayout = async () => {
    const amount = Number(payoutForm.amount);
    if (!payoutForm.account.trim() || !amount || amount < 500) {
      toast({ title: bn ? "সর্বনিম্ন ৳৫০০ উত্তোলন করা যাবে" : "Minimum withdrawal is ৳500", variant: "destructive" });
      return;
    }
    if (amount > stats.available) {
      toast({ title: bn ? "পর্যাপ্ত ব্যালেন্স নেই" : "Insufficient balance", variant: "destructive" });
      return;
    }
    setRequesting(true);
    const { error } = await supabase.from("affiliate_payouts").insert({
      user_id: user!.id, amount_bdt: amount, method: payoutForm.method, account_details: payoutForm.account.trim(),
    });
    setRequesting(false);
    if (error) { toast({ title: bn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" }); return; }
    // Save preferred payout method
    supabase.from("affiliate_profiles").update({ payout_method: payoutForm.method, payout_account: payoutForm.account.trim() }).eq("user_id", user!.id).then(() => {});
    toast({ title: bn ? "পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে!" : "Payment request submitted!" });
    setPayoutOpen(false);
    setPayoutForm(f => ({ ...f, amount: "" }));
    loadData();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: bn ? "অপেক্ষমাণ" : "Pending", cls: "bg-amber-500/10 text-amber-600" },
      approved: { label: bn ? "অনুমোদিত" : "Approved", cls: "bg-emerald-500/10 text-emerald-600" },
      paid: { label: bn ? "পরিশোধিত" : "Paid", cls: "bg-primary/10 text-primary" },
      requested: { label: bn ? "অনুরোধকৃত" : "Requested", cls: "bg-amber-500/10 text-amber-600" },
      processing: { label: bn ? "প্রসেসিং" : "Processing", cls: "bg-blue-500/10 text-blue-600" },
      rejected: { label: bn ? "বাতিল" : "Rejected", cls: "bg-destructive/10 text-destructive" },
      active: { label: bn ? "সক্রিয়" : "Active", cls: "bg-emerald-500/10 text-emerald-600" },
    };
    const m = map[s] || { label: s, cls: "bg-secondary text-muted-foreground" };
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-primary-foreground" />
            </div>
            {bn ? "অ্যাফিলিয়েট ড্যাশবোর্ড" : "Affiliate Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-10">
            {bn ? "রেফার করুন ও ১৫% কমিশন আয় করুন" : "Refer & earn 15% commission"}
          </p>
        </div>
        <button onClick={loadData} className="p-2 rounded-xl border border-border/50 hover:bg-secondary/50 text-muted-foreground transition-all" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Referral Link Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] bg-gradient-to-bl from-primary/8 to-transparent" />
        <div className="flex items-center gap-1.5 mb-3">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{bn ? "আপনার রেফারেল লিংক" : "Your Referral Link"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/50 min-w-0">
            <span className="text-xs sm:text-sm text-muted-foreground truncate font-mono">{referralLink}</span>
          </div>
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0">
            <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{bn ? "কপি" : "Copy"}</span>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {bn ? "এই লিংকে সাইনআপ করলে প্রতিটি পেমেন্টে ১৫% কমিশন পাবেন।" : "Anyone signing up via this link earns you 15% of their payments."}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: bn ? "লিংক ক্লিক" : "Link Clicks", value: stats.clicks, icon: MousePointer, cls: "text-blue-500 bg-blue-500/10" },
          { label: bn ? "রেফারেল" : "Referrals", value: `${stats.referrals}${stats.activeReferrals ? ` · ${stats.activeReferrals} ${bn ? "সক্রিয়" : "active"}` : ""}`, icon: Users, cls: "text-emerald-500 bg-emerald-500/10" },
          { label: bn ? "মোট আয়" : "Total Earned", value: fmtBDT(stats.earned, bn), icon: TrendingUp, cls: "text-primary bg-primary/10" },
          { label: bn ? "উত্তোলনযোগ্য" : "Available", value: fmtBDT(stats.available, bn), icon: Wallet, cls: "text-amber-500 bg-amber-500/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-3 sm:p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.cls}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Earnings breakdown + Request payout */}
      <div className="glass-card rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: bn ? "অনুমোদিত" : "Approved", value: fmtBDT(stats.earned, bn), icon: CheckCircle2, cls: "text-emerald-600" },
            { label: bn ? "অপেক্ষমাণ" : "Pending", value: fmtBDT(stats.pending, bn), icon: Clock, cls: "text-amber-600" },
            { label: bn ? "পরিশোধিত" : "Paid out", value: fmtBDT(stats.paidOut, bn), icon: DollarSign, cls: "text-primary" },
          ].map((b, i) => (
            <div key={i} className="bg-secondary/30 rounded-lg p-2.5 text-center">
              <b.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${b.cls}`} />
              <p className="text-sm font-bold text-foreground">{b.value}</p>
              <p className="text-[10px] text-muted-foreground">{b.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setPayoutOpen(true)} disabled={stats.available < 500}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40">
          <Send className="w-4 h-4" />
          {bn ? "পেমেন্ট রিকোয়েস্ট করুন" : "Request Payout"}
          <span className="text-xs opacity-75">({bn ? "সর্বনিম্ন ৳৫০০" : "min ৳500"})</span>
        </button>
        {stats.inReview > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {bn ? `৳${stats.inReview} উত্তোলন প্রক্রিয়াধীন` : `৳${stats.inReview} withdrawal in review`}
          </p>
        )}
      </div>

      {/* Commissions */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-semibold text-foreground">{bn ? "কমিশন ইতিহাস" : "Commission History"}</h3>
        </div>
        {commissions.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">
              {bn ? "এখনো কোনো কমিশন নেই — লিংক শেয়ার করুন!" : "No commissions yet — share your link!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {commissions.slice(0, 10).map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{c.description || (bn ? "কমিশন" : "Commission")}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-foreground">{fmtBDT(c.amount_bdt, bn)}</span>
                  {statusBadge(c.status)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Referral list */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-semibold text-foreground">{bn ? "আমার রেফারেল" : "My Referrals"}</h3>
        </div>
        {referrals.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">{bn ? "এখনো কোনো রেফারেল নেই" : "No referrals yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {referrals.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{r.referred?.full_name || (bn ? "ব্যবহারকারী" : "User")}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {bn ? "যোগ দিয়েছেন:" : "Joined:"} {new Date(r.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                    </p>
                  </div>
                </div>
                {statusBadge(r.status)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-semibold text-foreground">{bn ? "পেমেন্ট রিকোয়েস্ট ইতিহাস" : "Payout History"}</h3>
        </div>
        {payouts.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">{bn ? "কোনো উত্তোলন রিকোয়েস্ট নেই" : "No payout requests yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {payouts.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{fmtBDT(p.amount_bdt, bn)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{p.method} · {p.account_details}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.note && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                  {statusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout request dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{bn ? "পেমেন্ট রিকোয়েস্ট" : "Request Payout"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="bg-secondary/30 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{bn ? "উত্তোলনযোগ্য ব্যালেন্স" : "Available balance"}</span>
              <span className="text-sm font-bold text-foreground">{fmtBDT(stats.available, bn)}</span>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">{bn ? "পেমেন্ট মেথড" : "Payment Method"}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "bkash", label: "বিকাশ" },
                  { key: "nagad", label: "নগদ" },
                  { key: "bank", label: bn ? "ব্যাংক" : "Bank" },
                ].map(m => (
                  <button key={m.key} onClick={() => setPayoutForm(f => ({ ...f, method: m.key }))}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      payoutForm.method === m.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
                    }`}>{m.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                {payoutForm.method === "bank" ? (bn ? "অ্যাকাউন্ট নম্বর ও নাম" : "Account number & name") : (bn ? "ফোন নম্বর" : "Phone number")}
              </label>
              <input value={payoutForm.account} onChange={e => setPayoutForm(f => ({ ...f, account: e.target.value }))}
                placeholder={payoutForm.method === "bank" ? "AC 1234567890 — John Doe" : "01XXXXXXXXX"}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">{bn ? "পরিমাণ (৳)" : "Amount (৳)"}</label>
              <input type="number" min={500} value={payoutForm.amount} onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="500" className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/20" />
            </div>
            <button onClick={requestPayout} disabled={requesting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
              {requesting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {bn ? "রিকোয়েস্ট পাঠান" : "Submit Request"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliateDashboard;
