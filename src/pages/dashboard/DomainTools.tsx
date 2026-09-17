import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "@/lib/router-compat";
import {
  Globe,
  RefreshCw,
  ArrowRightLeft,
  Search,
  Clock,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
  Send,
  CalendarClock,
  Info,
  Ticket,
} from "lucide-react";
import DomainSearch from "@/components/DomainSearch";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { logApiError } from "@/lib/errorReporting";
import { formatPriceBDT } from "@/lib/formatPrice";
import type { Tables } from "@/integrations/supabase/types";

type TabKey = "register" | "renew" | "transfer" | "whois";

type PricingRow = {
  ext: string;
  registration_bdt: string;
  renewal_bdt: string;
  transfer_bdt: string;
};

const TERMS = [1, 2, 3, 5];

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
  const [pricing, setPricing] = useState<PricingRow[]>([]);

  // renew selection
  const [selected, setSelected] = useState<Record<string, number>>({});

  // transfer form
  const [transferDomain, setTransferDomain] = useState("");
  const [eppCode, setEppCode] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transferTicket, setTransferTicket] = useState<string | null>(null);
  const [ack, setAck] = useState(false);

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

  useEffect(() => {
    supabase
      .from("domain_pricing" as any)
      .select("ext, registration_bdt, renewal_bdt, transfer_bdt")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (error) {
          logApiError("domain_pricing.select", error, { area: "domain" });
          return;
        }
        setPricing((data as unknown as PricingRow[]) || []);
      });
  }, []);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "register", label: bn ? "নতুন রেজিস্টার" : "Register", icon: Globe },
    { key: "renew", label: bn ? "রিনিউ" : "Renew", icon: RefreshCw },
    { key: "transfer", label: bn ? "ট্রান্সফার" : "Transfer", icon: ArrowRightLeft },
    { key: "whois", label: "WHOIS", icon: Search },
  ];

  const daysLeft = (date: string | null) =>
    date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;

  const priceFor = (domainName: string, kind: "renewal_bdt" | "transfer_bdt"): number | null => {
    const name = (domainName || "").toLowerCase().trim();
    const match = pricing
      .filter((p) => name.endsWith(p.ext.startsWith(".") ? p.ext : `.${p.ext}`))
      .sort((a, b) => b.ext.length - a.ext.length)[0];
    if (!match) return null;
    const n = Number(String(match[kind]).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const sortedDomains = useMemo(
    () =>
      [...domains].sort((a, b) => {
        const da = daysLeft(a.expiry_date) ?? 99999;
        const db = daysLeft(b.expiry_date) ?? 99999;
        return da - db;
      }),
    [domains]
  );

  const stats = useMemo(() => {
    let expiring = 0;
    let expired = 0;
    for (const d of domains) {
      const days = daysLeft(d.expiry_date);
      if (days === null) continue;
      if (days < 0) expired += 1;
      else if (days <= 30) expiring += 1;
    }
    return { total: domains.length, expiring, expired };
  }, [domains]);

  const cartTotal = useMemo(() => {
    return Object.entries(selected).reduce((sum, [id, years]) => {
      const d = domains.find((x) => x.id === id);
      if (!d) return sum;
      const unit = priceFor(d.domain || d.name, "renewal_bdt");
      return sum + (unit ? unit * years : 0);
    }, 0);
  }, [selected, domains, pricing]);

  const selectedCount = Object.keys(selected).length;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });

  const setYears = (id: string, years: number) =>
    setSelected((prev) => ({ ...prev, [id]: years }));

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transferDomain.trim() || !eppCode.trim() || !ack) return;
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
    setTransferTicket(ticketNumber);
    setSubmitting(false);
  };

  const resetTransfer = () => {
    setTransferDomain("");
    setEppCode("");
    setTransferNote("");
    setAck(false);
    setTransferTicket(null);
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

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(bn ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—");

  const transferPrice = priceFor(transferDomain, "transfer_bdt");

  const transferSteps = [
    {
      icon: Lock,
      title: bn ? "ডোমেইন আনলক করুন" : "Unlock the domain",
      desc: bn ? "বর্তমান রেজিস্ট্রারে রেজিস্ট্রার-লক বন্ধ করুন" : "Disable registrar lock at your current registrar",
    },
    {
      icon: KeyRound,
      title: bn ? "EPP / Auth কোড নিন" : "Get the EPP / Auth code",
      desc: bn ? "রেজিস্ট্রার কোডটি আপনার ইমেইলে পাঠাবে" : "Your registrar emails the authorisation code",
    },
    {
      icon: Send,
      title: bn ? "অনুরোধ জমা দিন" : "Submit the request",
      desc: bn ? "আমরা ট্রান্সফার শুরু করে আপডেট জানাব" : "We start the transfer and keep you posted",
    },
  ];

  const transferTimeline = [
    { label: bn ? "অনুরোধ গ্রহণ" : "Request received", done: true },
    { label: bn ? "রেজিস্ট্রারে জমা" : "Submitted to registrar", done: false },
    { label: bn ? "বর্তমান রেজিস্ট্রারের অনুমোদন" : "Losing registrar approval", done: false },
    { label: bn ? "ট্রান্সফার সম্পন্ন (+১ বছর)" : "Transfer complete (+1 year)", done: false },
  ];

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
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: bn ? "মোট ডোমেইন" : "Total domains", value: stats.total, tone: "text-foreground" },
              { label: bn ? "৩০ দিনে মেয়াদ শেষ" : "Expiring in 30 days", value: stats.expiring, tone: "text-warning" },
              { label: bn ? "মেয়াদোত্তীর্ণ" : "Expired", value: stats.expired, tone: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-3 sm:p-4">
                <p className={`text-xl sm:text-2xl font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 space-y-3">
              {loadingDomains ? (
                [0, 1, 2].map((i) => <div key={i} className="glass-card rounded-xl h-24 animate-pulse bg-secondary/30" />)
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
                  const name = d.domain || d.name;
                  const days = daysLeft(d.expiry_date);
                  const expired = days !== null && days < 0;
                  const soon = days !== null && days >= 0 && days <= 30;
                  const unit = priceFor(name, "renewal_bdt");
                  const years = selected[d.id];
                  const checked = !!years;
                  const badge = expired
                    ? { text: bn ? "মেয়াদোত্তীর্ণ" : "Expired", cls: "bg-destructive/10 text-destructive" }
                    : soon
                    ? { text: bn ? "শীঘ্রই শেষ" : "Expiring soon", cls: "bg-warning/10 text-warning" }
                    : { text: bn ? "সক্রিয়" : "Active", cls: "bg-success/10 text-success" };
                  return (
                    <div
                      key={d.id}
                      className={`glass-card rounded-xl p-4 space-y-3 border ${
                        checked ? "border-primary/40" : expired ? "border-destructive/30" : soon ? "border-warning/30" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(d.id)}
                          aria-label={bn ? "রিনিউয়ের জন্য নির্বাচন" : "Select for renewal"}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            checked ? "gradient-primary border-transparent text-primary-foreground" : "border-border bg-secondary/40"
                          }`}
                        >
                          {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground break-all">{name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>{badge.text}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="w-3 h-3" />
                              {bn ? "মেয়াদ শেষ" : "Expires"}: {fmt(d.expiry_date)}
                            </span>
                            <span className={`flex items-center gap-1 ${expired ? "text-destructive" : soon ? "text-warning" : ""}`}>
                              <Clock className="w-3 h-3" />
                              {days === null
                                ? bn
                                  ? "মেয়াদের তথ্য নেই"
                                  : "No expiry on record"
                                : expired
                                ? bn
                                  ? `${Math.abs(days)} দিন আগে শেষ`
                                  : `${Math.abs(days)} days ago`
                                : bn
                                ? `${days} দিন বাকি`
                                : `${days} days left`}
                            </span>
                            {unit && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                {formatPriceBDT(unit, lang)}/{bn ? "বছর" : "yr"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-8">
                        {TERMS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setYears(d.id, t);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                              years === t
                                ? "gradient-primary text-primary-foreground border-transparent"
                                : "bg-secondary/40 text-muted-foreground border-border"
                            }`}
                          >
                            {t} {bn ? "বছর" : t === 1 ? "year" : "years"}
                          </button>
                        ))}
                        {unit && checked && (
                          <span className="text-xs font-bold text-foreground ml-auto">
                            {formatPriceBDT(unit * (years || 1), lang)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold text-foreground">{bn ? "রিনিউ সারাংশ" : "Renewal summary"}</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{bn ? "নির্বাচিত ডোমেইন" : "Domains selected"}</span>
                  <span className="text-foreground font-semibold">{selectedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{bn ? "মোট" : "Total"}</span>
                  <span className="text-foreground font-bold">{formatPriceBDT(cartTotal, lang)}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground flex gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {bn
                  ? "রিনিউ করলে বর্তমান মেয়াদের সাথে নতুন বছর যোগ হয় — কোনো ডাউনটাইম হয় না।"
                  : "Renewing adds years on top of the current term — no downtime."}
              </p>
              {selectedCount > 0 ? (
                <Link
                  to="/dashboard/billing"
                  className="w-full gradient-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {bn ? "রিনিউ ইনভয়েসে যান" : "Continue to renewal invoice"}
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-secondary/50 text-muted-foreground px-4 py-3 rounded-xl font-semibold text-xs cursor-not-allowed"
                >
                  {bn ? "ডোমেইন নির্বাচন করুন" : "Select a domain"}
                </button>
              )}
              <div className="pt-3 border-t border-border/50 space-y-2 text-[11px] text-muted-foreground">
                {[
                  bn ? "বিনামূল্যে DNS ম্যানেজমেন্ট" : "Free DNS management",
                  bn ? "ফ্রি WHOIS প্রাইভেসি (সমর্থিত TLD)" : "Free WHOIS privacy (supported TLDs)",
                  bn ? "২৪/৭ সাপোর্ট" : "24/7 support",
                ].map((f) => (
                  <p key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> {f}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "transfer" && (
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">{bn ? "ট্রান্সফার কীভাবে কাজ করে" : "How the transfer works"}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {transferSteps.map((s, i) => (
                  <div key={s.title} className="flex sm:block gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shrink-0 sm:mb-2">
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {i + 1}. {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {transferTicket ? (
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {bn ? "ট্রান্সফার অনুরোধ গৃহীত" : "Transfer request received"}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Ticket className="w-3.5 h-3.5" /> {transferTicket}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {transferTimeline.map((t) => (
                    <div key={t.label} className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.done ? "bg-success" : "bg-border"}`}
                      />
                      <span className={`text-xs ${t.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{t.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {bn
                    ? "ট্রান্সফার সাধারণত ৫-৭ দিনে সম্পন্ন হয়। প্রতিটি ধাপের আপডেট আপনার টিকেটে পাবেন।"
                    : "Transfers usually complete within 5-7 days. Every update appears on your ticket."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/dashboard/support"
                    className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-xs"
                  >
                    {bn ? "টিকেট দেখুন" : "View ticket"}
                  </Link>
                  <button
                    onClick={resetTransfer}
                    className="bg-secondary/50 text-foreground px-5 py-2.5 rounded-xl font-semibold text-xs border border-border"
                  >
                    {bn ? "আরেকটি ডোমেইন ট্রান্সফার" : "Transfer another domain"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitTransfer} className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
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
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {bn
                      ? "কোডটি বর্তমান রেজিস্ট্রার আপনার রেজিস্ট্র্যান্ট ইমেইলে পাঠায়।"
                      : "Your current registrar sends this code to the registrant email."}
                  </p>
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
                <label className="flex items-start gap-2.5 text-[11px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span>
                    {bn
                      ? "আমি নিশ্চিত করছি ডোমেইনটি আনলক করা, ৬০ দিনের মধ্যে রেজিস্টার/ট্রান্সফার করা হয়নি এবং WHOIS প্রাইভেসি বন্ধ আছে।"
                      : "I confirm the domain is unlocked, was not registered or transferred in the last 60 days, and WHOIS privacy is off."}
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={submitting || !ack}
                  className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {bn ? "ট্রান্সফার অনুরোধ পাঠান" : "Submit transfer request"}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-foreground">{bn ? "ট্রান্সফার মূল্য" : "Transfer pricing"}</h2>
              <p className="text-2xl font-bold text-foreground">
                {transferPrice ? formatPriceBDT(transferPrice, lang) : bn ? "ডোমেইন লিখুন" : "Enter a domain"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {bn
                  ? "ট্রান্সফারের সাথে ১ বছর মেয়াদ যোগ হয় (কিছু TLD ব্যতিক্রম)।"
                  : "Transfers include a 1-year extension (some TLDs excluded)."}
              </p>
              <div className="pt-3 border-t border-border/50 space-y-2 text-[11px] text-muted-foreground">
                {[
                  bn ? "ফ্রি DNS ও ইমেইল ফরওয়ার্ডিং" : "Free DNS & email forwarding",
                  bn ? "বিদ্যমান DNS রেকর্ড অক্ষত থাকে" : "Existing DNS records stay intact",
                  bn ? "কোনো ডাউনটাইম নেই" : "Zero downtime",
                ].map((f) => (
                  <p key={f} className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" /> {f}
                  </p>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-2">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                {bn ? "ট্রান্সফার হবে না যদি" : "Transfer will fail if"}
              </h2>
              {[
                bn ? "ডোমেইন ৬০ দিনের মধ্যে রেজিস্টার/ট্রান্সফার হয়েছে" : "Registered or transferred within 60 days",
                bn ? "রেজিস্ট্রার লক চালু আছে" : "Registrar lock is still on",
                bn ? "EPP কোড ভুল বা মেয়াদোত্তীর্ণ" : "EPP code is wrong or expired",
                bn ? "ডোমেইন redemption পিরিয়ডে আছে" : "Domain is in redemption period",
              ].map((f) => (
                <p key={f} className="text-[11px] text-muted-foreground flex gap-2">
                  <span className="text-warning">•</span> {f}
                </p>
              ))}
            </div>
          </div>
        </div>
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
