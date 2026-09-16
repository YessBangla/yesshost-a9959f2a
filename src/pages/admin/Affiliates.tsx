import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Share2, Check, X, RefreshCw, DollarSign, Send, Users } from "lucide-react";
import DataToolbar from "@/components/DataToolbar";
import { downloadCsv, csvDate } from "@/lib/export-csv";

const fmtBDT = (v: number, bn: boolean) => `৳${Number(v || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`;

const AdminAffiliates = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [cm, po] = await Promise.all([
      supabase.from("affiliate_commissions").select("*, user:profiles!affiliate_commissions_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
      supabase.from("affiliate_payouts").select("*, user:profiles!affiliate_payouts_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
    ]);
    setCommissions(cm.data || []);
    setPayouts(po.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCommissionStatus = async (id: string, status: "approved" | "rejected") => {
    setActing(id);
    const { error } = await supabase.from("affiliate_commissions").update({ status }).eq("id", id);
    setActing(null);
    if (error) { toast({ title: bn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === "approved" ? (bn ? "কমিশন অনুমোদিত" : "Commission approved") : (bn ? "কমিশন বাতিল" : "Commission rejected") });
    load();
  };

  const setPayoutStatus = async (id: string, status: "paid" | "rejected" | "processing", note?: string) => {
    setActing(id);
    const { error } = await supabase.from("affiliate_payouts")
      .update({ status, note: note || null, processed_at: status === "rejected" ? null : new Date().toISOString() })
      .eq("id", id);
    setActing(null);
    if (error) { toast({ title: bn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: bn ? "সফল" : "Done" });
    load();
  };

  const stats = useMemo(() => ({
    pendingCommissions: commissions.filter(c => c.status === "pending").length,
    pendingPayouts: payouts.filter(p => p.status === "requested").length,
    totalPaid: payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount_bdt), 0),
  }), [commissions, payouts]);

  const match = (row: any) => {
    const q = search.trim().toLowerCase();
    const okSearch = !q || [row.user?.full_name, row.method, row.account_details, row.description, row.status, String(row.amount_bdt)]
      .filter(Boolean).some((v: string) => String(v).toLowerCase().includes(q));
    const okStatus = status === "all" || row.status === status;
    return okSearch && okStatus;
  };

  const filteredPayouts = useMemo(() => payouts.filter(match), [payouts, search, status]);
  const filteredCommissions = useMemo(() => commissions.filter(match), [commissions, search, status]);

  const statusFilters = useMemo(() => ([
    { value: "all", label: bn ? "সব" : "All" },
    { value: "requested", label: bn ? "রিকোয়েস্ট" : "Requested" },
    { value: "pending", label: bn ? "অপেক্ষমাণ" : "Pending" },
    { value: "approved", label: bn ? "অনুমোদিত" : "Approved" },
    { value: "paid", label: bn ? "পরিশোধিত" : "Paid" },
    { value: "rejected", label: bn ? "বাতিল" : "Rejected" },
  ]), [bn]);

  const exportCsv = () => {
    downloadCsv(
      "yesshost-affiliates",
      ["type", "user", "amount_bdt", "status", "method", "details", "date"],
      [
        ...filteredPayouts.map(p => ["payout", p.user?.full_name || "", p.amount_bdt, p.status, p.method || "", p.account_details || "", csvDate(p.created_at)]),
        ...filteredCommissions.map(c => ["commission", c.user?.full_name || "", c.amount_bdt, c.status, "", c.description || "", csvDate(c.created_at)]),
      ],
    );
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600", approved: "bg-emerald-500/10 text-emerald-600",
      paid: "bg-primary/10 text-primary", requested: "bg-amber-500/10 text-amber-600",
      processing: "bg-blue-500/10 text-blue-600", rejected: "bg-destructive/10 text-destructive",
    };
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] || "bg-secondary text-muted-foreground"}`}>{s}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          {bn ? "অ্যাফিলিয়েট ম্যানেজমেন্ট" : "Affiliate Management"}
        </h1>
        <button onClick={load} className="p-2 rounded-lg border border-border/50 hover:bg-secondary/50 text-muted-foreground">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: bn ? "অপেক্ষমাণ কমিশন" : "Pending Commissions", value: stats.pendingCommissions, icon: DollarSign },
          { label: bn ? "পেআউট রিকোয়েস্ট" : "Payout Requests", value: stats.pendingPayouts, icon: Send },
          { label: bn ? "মোট পরিশোধিত" : "Total Paid", value: fmtBDT(stats.totalPaid, bn), icon: Users },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-3">
            <s.icon className="w-4 h-4 text-primary mb-1.5" />
            <p className="text-base font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <DataToolbar
        search={search}
        onSearch={setSearch}
        placeholder={bn ? "নাম, মাধ্যম বা পরিমাণ খুঁজুন..." : "Search name, method or amount..."}
        filters={statusFilters}
        activeFilter={status}
        onFilter={setStatus}
        onExport={exportCsv}
        onRefresh={load}
        refreshing={loading}
        resultCount={filteredPayouts.length + filteredCommissions.length}
      />

      {/* Payout requests */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-semibold text-foreground">{bn ? "পেআউট রিকোয়েস্ট" : "Payout Requests"}</h3>
        </div>
        {filteredPayouts.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">{bn ? "কোনো রিকোয়েস্ট নেই" : "No requests"}</p>
        ) : (
          <div className="divide-y divide-border/20">
            {filteredPayouts.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{fmtBDT(p.amount_bdt, bn)} <span className="text-[10px] font-normal text-muted-foreground uppercase">· {p.method}</span></p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {p.user?.full_name || "—"} · {p.account_details} · {new Date(p.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {badge(p.status)}
                  {p.status === "requested" && (
                    <>
                      <button disabled={acting === p.id} onClick={() => setPayoutStatus(p.id, "paid")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" /> {bn ? "পরিশোধ" : "Mark Paid"}
                      </button>
                      <button disabled={acting === p.id} onClick={() => setPayoutStatus(p.id, "rejected", bn ? "অ্যাডমিন বাতিল করেছেন" : "Rejected by admin")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50">
                        <X className="w-3.5 h-3.5" /> {bn ? "বাতিল" : "Reject"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commissions */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-semibold text-foreground">{bn ? "কমিশন" : "Commissions"}</h3>
        </div>
        {filteredCommissions.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">{bn ? "কোনো কমিশন নেই" : "No commissions"}</p>
        ) : (
          <div className="divide-y divide-border/20">
            {filteredCommissions.map(c => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{fmtBDT(c.amount_bdt, bn)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {c.user?.full_name || "—"} · {c.description || "—"} · {new Date(c.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {badge(c.status)}
                  {c.status === "pending" && (
                    <>
                      <button disabled={acting === c.id} onClick={() => setCommissionStatus(c.id, "approved")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" /> {bn ? "অনুমোদন" : "Approve"}
                      </button>
                      <button disabled={acting === c.id} onClick={() => setCommissionStatus(c.id, "rejected")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50">
                        <X className="w-3.5 h-3.5" /> {bn ? "বাতিল" : "Reject"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAffiliates;
