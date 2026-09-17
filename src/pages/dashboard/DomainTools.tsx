import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Globe, RefreshCw, ArrowRightLeft, Search, Clock, Loader2, ShieldCheck } from "lucide-react";
import DomainSearch from "@/components/DomainSearch";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { logApiError } from "@/lib/errorReporting";
import type { Tables } from "@/integrations/supabase/types";

type TabKey = "register" | "renew" | "transfer" | "whois";

const DashboardDomainTools = () => {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();

  const tabParam = (params.get("tab") as TabKey) || "register";
  const tab: TabKey = ["register", "renew", "transfer", "whois"].includes(tabParam) ? tabParam : "register";
  const setTab = (t: TabKey) => setParams({ tab: t });

  const [domains, setDomains] = useState<Tables<"services">[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);

  // transfer form
  const [transferDomain, setTransferDomain] = useState("");
  const [eppCode, setEppCode] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // whois
  const [whoisDomain, setWhoisDomain] = useState("");
  const [whoisLoading, setWhoisLoading] = useState(false);
  const [whoisData, setWhoisData] = useState<any>(null);
  const [whoisError, setWhoisError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .eq("service_type", "domain")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) logApiError("services.select(domain)", error, { area: "domain" });
        setDomains(data || []);
        setLoadingDomains(false);
      });
  }, [user]);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "register", label: bn ? "নতুন রেজিস্টার" : "Register", icon: Globe },
    { key: "renew", label: bn ? "রিনিউ" : "Renew", icon: RefreshCw },
    { key: "transfer", label: bn ? "ট্রান্সফার" : "Transfer", icon: ArrowRightLeft },
    { key: "whois", label: "WHOIS", icon: Search },
  ];

  const daysLeft = (date: string | null) =>
    date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;

  const sortedDomains = useMemo(
    () =>
      [...domains].sort((a, b) => {
        const da = daysLeft(a.expiry_date) ?? 99999;
        const db = daysLeft(b.expiry_date) ?? 99999;
        return da - db;
      }),
    [domains]
  );

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transferDomain.trim() || !eppCode.trim()) return;
    setSubmitting(true);
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        ticket_number: ticketNumber,
        subject: `Domain transfer request: ${transferDomain.trim()}`,
        department: "technical",
        priority: "medium",
      })
      .select()
      .single();

    if (error || !data) {
      logApiError("support_tickets.insert(transfer)", error, { area: "domain" });
      toast({
        title: "❌",
        description: bn ? "অনুরোধ পাঠাতে সমস্যা হয়েছে" : "Could not submit the request",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    await supabase.from("ticket_replies").insert({
      ticket_id: data.id,
      user_id: user.id,
      message: `Domain: ${transferDomain.trim()}\nEPP/Auth code: ${eppCode.trim()}\nNote: ${transferNote || "-"}`,
    });

    toast({
      title: "✅",
      description: bn
        ? `ট্রান্সফার অনুরোধ গ্রহণ করা হয়েছে (${ticketNumber})`
        : `Transfer request received (${ticketNumber})`,
    });
    setTransferDomain("");
    setEppCode("");
    setTransferNote("");
    setSubmitting(false);
  };

  const runWhois = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = whoisDomain.trim().toLowerCase();
    if (!d) return;
    setWhoisLoading(true);
    setWhoisError(null);
    setWhoisData(null);
    const { data, error } = await supabase.functions.invoke("check-domain", {
      body: { domain: d, whois: true },
    });
    if (error) {
      logApiError("check-domain.whois", error, { area: "domain" });
      setWhoisError(bn ? "WHOIS তথ্য আনতে সমস্যা হয়েছে" : "Could not fetch WHOIS information");
    } else if (!data?.whois) {
      setWhoisError(
        bn ? "এই ডোমেইনের WHOIS তথ্য পাওয়া যায়নি (হয়তো রেজিস্টার করা নেই)" : "No WHOIS record found (it may be unregistered)"
      );
    } else {
      setWhoisData({ ...data.whois, domain: data.domain });
    }
    setWhoisLoading(false);
  };

  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString(bn ? "bn-BD" : "en-US") : "—");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "ডোমেইন টুলস" : "Domain Tools"}</h1>
        <p className="text-sm text-muted-foreground">
          {bn ? "ডোমেইন রেজিস্টার, রিনিউ, ট্রান্সফার ও WHOIS — সব এক জায়গায়" : "Register, renew, transfer and look up domains in one place"}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border ${
              tab === t.key
                ? "gradient-primary text-primary-foreground border-transparent"
                : "bg-secondary/40 text-muted-foreground border-border"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "register" && (
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <DomainSearch />
        </div>
      )}

      {tab === "renew" && (
        <div className="space-y-3">
          {loadingDomains ? (
            [0, 1, 2].map((i) => <div key={i} className="glass-card rounded-xl h-20 animate-pulse bg-secondary/30" />)
          ) : sortedDomains.length === 0 ? (
            <EmptyState
              icon={Globe}
              title={bn ? "রিনিউ করার মতো ডোমেইন নেই" : "No domains to renew"}
              description={bn ? "প্রথমে একটি ডোমেইন রেজিস্টার করুন" : "Register a domain first"}
              actionLabel={bn ? "ডোমেইন খুঁজুন" : "Search domains"}
              onAction={() => setTab("register")}
            />
          ) : (
            sortedDomains.map((d) => {
              const days = daysLeft(d.expiry_date);
              const soon = days !== null && days <= 30;
              return (
                <div key={d.id} className={`glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${soon ? "border-warning/30" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{d.domain || d.name}</h3>
                      <p className={`text-[11px] flex items-center gap-1 ${soon ? "text-warning" : "text-muted-foreground"}`}>
                        <Clock className="w-3 h-3" />
                        {days === null
                          ? bn
                            ? "মেয়াদের তথ্য নেই"
                            : "No expiry on record"
                          : bn
                          ? `${days} দিন বাকি`
                          : `${days} days left`}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard/billing"
                    className="text-xs gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-center"
                  >
                    {bn ? "রিনিউ ইনভয়েস দেখুন" : "Renew via invoice"}
                  </Link>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "transfer" && (
        <form onSubmit={submitTransfer} className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 max-w-2xl">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <p>
              {bn
                ? "ট্রান্সফারের আগে ডোমেইনটি আনলক করুন এবং বর্তমান রেজিস্ট্রার থেকে EPP/Auth কোড সংগ্রহ করুন। ট্রান্সফারে সাধারণত ৫-৭ দিন লাগে।"
                : "Unlock the domain at your current registrar and get the EPP/Auth code first. Transfers usually take 5-7 days."}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{bn ? "ডোমেইন নাম" : "Domain name"}</label>
            <input
              value={transferDomain}
              onChange={(e) => setTransferDomain(e.target.value)}
              required
              placeholder="example.com"
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{bn ? "EPP / Auth কোড" : "EPP / Auth code"}</label>
            <input
              value={eppCode}
              onChange={(e) => setEppCode(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{bn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}</label>
            <textarea
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {bn ? "ট্রান্সফার অনুরোধ পাঠান" : "Submit transfer request"}
          </button>
        </form>
      )}

      {tab === "whois" && (
        <div className="space-y-4 max-w-2xl">
          <form onSubmit={runWhois} className="flex flex-col sm:flex-row gap-2">
            <input
              value={whoisDomain}
              onChange={(e) => setWhoisDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <button
              type="submit"
              disabled={whoisLoading || !whoisDomain.trim()}
              className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {whoisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {bn ? "লুকআপ" : "Lookup"}
            </button>
          </form>

          {whoisError && (
            <div className="glass-card rounded-xl p-4 text-sm text-destructive">{whoisError}</div>
          )}

          {whoisData && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-foreground">{whoisData.domain}</h2>
              {[
                { label: bn ? "রেজিস্ট্রার" : "Registrar", value: whoisData.registrar || "—" },
                { label: bn ? "রেজিস্ট্রেশন" : "Registered", value: fmt(whoisData.creation_date) },
                { label: bn ? "মেয়াদ শেষ" : "Expires", value: fmt(whoisData.expiry_date) },
                { label: bn ? "সর্বশেষ আপডেট" : "Last updated", value: fmt(whoisData.updated_date) },
                { label: bn ? "স্ট্যাটাস" : "Status", value: (whoisData.status || []).join(", ") || "—" },
                { label: bn ? "নেমসার্ভার" : "Nameservers", value: (whoisData.nameservers || []).join(", ") || "—" },
              ].map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-b border-border/40 pb-2 last:border-0">
                  <span className="text-xs text-muted-foreground w-40 shrink-0">{row.label}</span>
                  <span className="text-xs text-foreground break-all">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardDomainTools;
