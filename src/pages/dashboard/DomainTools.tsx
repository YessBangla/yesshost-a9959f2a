import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "@/lib/router-compat";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
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
  AlertCircle,
  Lock,
  KeyRound,
  Send,
  CalendarClock,
  Info,
  Ticket,
  ReceiptText,
  ArrowLeft,
} from "lucide-react";
import DomainSearch from "@/components/DomainSearch";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { logApiError } from "@/lib/errorReporting";
import { formatPriceBDT } from "@/lib/formatPrice";
import {
  TERMS,
  VAT_RATE,
  buildPriceLine,
  normaliseDomain,
  sumPriceLines,
  validateDomainName,
  validateEppCode,
  validateNote,
  validationMessage,
  type PriceLine,
  type ValidationCode,
} from "@/lib/domain-pricing";
import {
  getTransferTicketStatus,
  submitDomainRenewal,
  submitDomainTransfer,
} from "@/lib/domain-tools.functions";
import type { RenewalResult } from "@/lib/domain-tools.server";
import type { Tables } from "@/integrations/supabase/types";

type TabKey = "register" | "renew" | "transfer" | "whois";

type PricingRow = {
  ext: string;
  registration_bdt: string;
  renewal_bdt: string;
  transfer_bdt: string;
};

const STAGE_LABELS: Record<string, { en: string; bn: string }> = {
  received: { en: "Request received", bn: "অনুরোধ গ্রহণ" },
  submitted: { en: "Submitted to registrar", bn: "রেজিস্ট্রারে জমা" },
  approval: { en: "Losing registrar approval", bn: "বর্তমান রেজিস্ট্রারের অনুমোদন" },
  complete: { en: "Transfer complete (+1 year)", bn: "ট্রান্সফার সম্পন্ন (+১ বছর)" },
};

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

  // renew selection + flow
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [renewStep, setRenewStep] = useState<"select" | "confirm" | "done">("select");
  const [renewError, setRenewError] = useState<string | null>(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);
  const [renewResult, setRenewResult] = useState<RenewalResult | null>(null);

  // transfer form
  const [transferDomain, setTransferDomain] = useState("");
  const [eppCode, setEppCode] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferYears, setTransferYears] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [transferTicket, setTransferTicket] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [transferFormError, setTransferFormError] = useState<string | null>(null);

  // whois
  const [whoisDomain, setWhoisDomain] = useState("");
  const [whoisLoading, setWhoisLoading] = useState(false);
  const [whoisData, setWhoisData] = useState<any>(null);
  const [whoisError, setWhoisError] = useState<string | null>(null);

  const runRenewal = useServerFn(submitDomainRenewal);
  const runTransfer = useServerFn(submitDomainTransfer);
  const fetchTransferStatus = useServerFn(getTransferTicketStatus);

  const msg = (code: ValidationCode) => validationMessage(code, bn);

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

  const renewLines: PriceLine[] = useMemo(() => {
    return Object.entries(selected).flatMap(([id, years]) => {
      const d = domains.find((x) => x.id === id);
      if (!d) return [];
      const name = d.domain || d.name;
      const unit = priceFor(name, "renewal_bdt");
      if (!unit) return [];
      return [buildPriceLine(name, unit, years)];
    });
  }, [selected, domains, pricing]);

  const renewTotals = useMemo(() => sumPriceLines(renewLines), [renewLines]);
  const selectedCount = Object.keys(selected).length;
  const unpricedSelected = selectedCount > renewLines.length;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      setRenewError(null);
      return next;
    });

  const setYears = (id: string, years: number) => {
    setSelected((prev) => ({ ...prev, [id]: years }));
    setRenewError(null);
  };

  const goToConfirm = () => {
    if (selectedCount === 0) {
      setRenewError(msg("no_selection"));
      return;
    }
    if (unpricedSelected) {
      setRenewError(msg("price_unknown"));
      return;
    }
    setRenewError(null);
    setRenewStep("confirm");
  };

  const confirmRenewal = async () => {
    setRenewSubmitting(true);
    setRenewError(null);
    try {
      const res = await runRenewal({
        data: { items: Object.entries(selected).map(([serviceId, years]) => ({ serviceId, years })) },
      });
      if (!res.ok) {
        setRenewError(res.code === "server_error" ? (bn ? "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।" : "Something went wrong on our side. Please try again.") : msg(res.code));
        return;
      }
      setRenewResult(res.data);
      setRenewStep("done");
      toast({
        title: "✅",
        description: bn
          ? `রিনিউ ইনভয়েস তৈরি হয়েছে (${res.data.invoiceNumber})`
          : `Renewal invoice created (${res.data.invoiceNumber})`,
      });
    } catch (e) {
      logApiError("submitDomainRenewal", e, { area: "domain" });
      setRenewError(bn ? "অনুরোধ পাঠানো যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।" : "Could not send the request — check your connection and try again.");
    } finally {
      setRenewSubmitting(false);
    }
  };

  const resetRenewal = () => {
    setSelected({});
    setRenewResult(null);
    setRenewError(null);
    setRenewStep("select");
  };

  /* ------------------------------- transfer ------------------------------- */

  const domainCode = validateDomainName(transferDomain);
  const eppCodeError = validateEppCode(eppCode);
  const noteCodeError = validateNote(transferNote);
  const transferPrice = domainCode ? null : priceFor(normaliseDomain(transferDomain), "transfer_bdt");
  const transferLine = transferPrice ? buildPriceLine(normaliseDomain(transferDomain), transferPrice, transferYears) : null;

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ domain: true, epp: true, note: true, ack: true });
    setTransferFormError(null);
    const firstCode = domainCode || eppCodeError || noteCodeError || (!ack ? ("ack_required" as ValidationCode) : null);
    if (firstCode) {
      setTransferFormError(msg(firstCode));
      return;
    }
    setSubmitting(true);
    try {
      const res = await runTransfer({
        data: {
          domain: transferDomain,
          eppCode,
          note: transferNote,
          years: transferYears,
          acknowledged: ack,
        },
      });
      if (!res.ok) {
        setTransferFormError(
          res.code === "server_error"
            ? bn
              ? "অনুরোধ জমা দেওয়া যায়নি, আবার চেষ্টা করুন।"
              : "We couldn't submit the request. Please try again."
            : msg(res.code)
        );
        return;
      }
      toast({
        title: "✅",
        description: bn
          ? `ট্রান্সফার অনুরোধ গ্রহণ করা হয়েছে (${res.data.ticketNumber})`
          : `Transfer request received (${res.data.ticketNumber})`,
      });
      setTransferTicket(res.data.ticketNumber);
    } catch (err) {
      logApiError("submitDomainTransfer", err, { area: "domain" });
      setTransferFormError(bn ? "সংযোগ সমস্যা — আবার চেষ্টা করুন।" : "Connection problem — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusQuery = useQuery({
    queryKey: ["domain-transfer", "status", transferTicket],
    enabled: !!transferTicket,
    refetchInterval: 20000,
    queryFn: () => fetchTransferStatus({ data: { ticketNumber: transferTicket! } }),
  });

  const resetTransfer = () => {
    setTransferDomain("");
    setEppCode("");
    setTransferNote("");
    setTransferYears(1);
    setAck(false);
    setTouched({});
    setTransferFormError(null);
    setTransferTicket(null);
  };

  const runWhois = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = validateDomainName(whoisDomain);
    if (code) {
      setWhoisError(msg(code));
      setWhoisData(null);
      return;
    }
    const d = normaliseDomain(whoisDomain);
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
  const fmtTime = (d?: string | null) =>
    d ? new Date(d).toLocaleString(bn ? "bn-BD" : "en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

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

  const Breakdown = ({ lines, compact = false }: { lines: PriceLine[]; compact?: boolean }) => {
    const totals = sumPriceLines(lines);
    if (lines.length === 0) return null;
    return (
      <div className="space-y-2 text-xs">
        {!compact &&
          lines.map((l) => (
            <div key={`${l.domain}-${l.years}`} className="flex justify-between gap-3">
              <span className="text-muted-foreground break-all">
                {l.domain} · {l.years} {bn ? "বছর" : l.years === 1 ? "year" : "years"}
              </span>
              <span className="text-foreground font-medium shrink-0">{formatPriceBDT(l.subtotal, lang)}</span>
            </div>
          ))}
        {compact && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {bn ? "মেয়াদ মূল্য" : "Term price"} ({lines[0]!.years} {bn ? "বছর" : lines[0]!.years === 1 ? "year" : "years"})
            </span>
            <span className="text-foreground font-medium">{formatPriceBDT(totals.subtotal, lang)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{bn ? "সাবটোটাল" : "Subtotal"}</span>
          <span className="text-foreground font-medium">{formatPriceBDT(totals.subtotal, lang)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-success">
            <span>{bn ? "দীর্ঘ মেয়াদের ছাড়" : "Multi-year discount"}</span>
            <span className="font-medium">− {formatPriceBDT(totals.discount, lang)}</span>
          </div>
        )}
        {totals.fees > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{bn ? "ICANN ফি" : "ICANN fee"}</span>
            <span className="text-foreground font-medium">{formatPriceBDT(totals.fees, lang)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {bn ? "ভ্যাট" : "VAT"} ({Math.round(VAT_RATE * 100)}%)
          </span>
          <span className="text-foreground font-medium">{formatPriceBDT(totals.vat, lang)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border/50">
          <span className="text-foreground font-bold">{bn ? "সর্বমোট" : "Total payable"}</span>
          <span className="text-foreground font-bold">{formatPriceBDT(totals.total, lang)}</span>
        </div>
      </div>
    );
  };

  const FieldError = ({ show, code }: { show: boolean; code: ValidationCode | null }) =>
    show && code ? (
      <p className="text-[11px] text-destructive flex items-center gap-1.5 mt-1.5">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {msg(code)}
      </p>
    ) : null;

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

      {tab === "renew" && renewStep === "done" && renewResult && (
        <div className="glass-card rounded-2xl p-6 space-y-5 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{bn ? "রিনিউ অনুরোধ নিশ্চিত হয়েছে" : "Renewal request confirmed"}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <ReceiptText className="w-3.5 h-3.5" /> {renewResult.invoiceNumber} · {bn ? "পরিশোধের শেষ তারিখ" : "Due"} {fmt(renewResult.dueDate)}
              </p>
            </div>
          </div>
          <Breakdown lines={renewResult.lines} />
          <p className="text-[11px] text-muted-foreground">
            {bn
              ? "ইনভয়েস পরিশোধ হলে ডোমেইনের মেয়াদ স্বয়ংক্রিয়ভাবে বাড়ানো হবে।"
              : "Your domains are extended automatically as soon as the invoice is paid."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/billing" className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-xs">
              {bn ? "ইনভয়েস পরিশোধ করুন" : "Pay the invoice"}
            </Link>
            <button onClick={resetRenewal} className="bg-secondary/50 text-foreground px-5 py-2.5 rounded-xl font-semibold text-xs border border-border">
              {bn ? "আরও ডোমেইন রিনিউ" : "Renew more domains"}
            </button>
          </div>
        </div>
      )}

      {tab === "renew" && renewStep === "confirm" && (
        <div className="glass-card rounded-2xl p-6 space-y-5 max-w-2xl">
          <button onClick={() => setRenewStep("select")} className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> {bn ? "নির্বাচনে ফিরুন" : "Back to selection"}
          </button>
          <div>
            <h2 className="text-base font-bold text-foreground">{bn ? "রিনিউ নিশ্চিত করুন" : "Confirm your renewal"}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {bn ? "নিচের তথ্য মিলিয়ে দেখে নিশ্চিত করুন — এরপর ইনভয়েস তৈরি হবে।" : "Review the details below — confirming creates the invoice."}
            </p>
          </div>
          <div className="space-y-3">
            {renewLines.map((l) => {
              const svc = domains.find((d) => (d.domain || d.name) === l.domain);
              const currentExpiry = svc?.expiry_date ? new Date(svc.expiry_date) : null;
              const newExpiry = currentExpiry ? new Date(currentExpiry) : null;
              if (newExpiry) newExpiry.setFullYear(newExpiry.getFullYear() + l.years);
              return (
                <div key={l.domain} className="rounded-xl border border-border/60 p-3 space-y-1">
                  <p className="text-sm font-bold text-foreground break-all">{l.domain}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {l.years} {bn ? "বছর" : l.years === 1 ? "year" : "years"} · {formatPriceBDT(l.unitPrice, lang)}/{bn ? "বছর" : "yr"}
                    {newExpiry && ` · ${bn ? "নতুন মেয়াদ" : "New expiry"}: ${fmt(newExpiry.toISOString())}`}
                  </p>
                </div>
              );
            })}
          </div>
          <Breakdown lines={renewLines} />
          {renewError && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {renewError}
            </p>
          )}
          <button
            onClick={confirmRenewal}
            disabled={renewSubmitting}
            className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {renewSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {bn ? "নিশ্চিত করে ইনভয়েস তৈরি করুন" : "Confirm and create invoice"}
          </button>
        </div>
      )}

      {tab === "renew" && renewStep === "select" && (
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
                  const line = unit && years ? buildPriceLine(name, unit, years) : null;
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
                            {unit ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                {formatPriceBDT(unit, lang)}/{bn ? "বছর" : "yr"}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-warning">
                                <AlertCircle className="w-3 h-3" /> {msg("price_unknown")}
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
                            onClick={() => setYears(d.id, t)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                              years === t
                                ? "gradient-primary text-primary-foreground border-transparent"
                                : "bg-secondary/40 text-muted-foreground border-border"
                            }`}
                          >
                            {t} {bn ? "বছর" : t === 1 ? "year" : "years"}
                          </button>
                        ))}
                      </div>

                      {line && (
                        <div className="pl-8">
                          <div className="rounded-xl bg-secondary/30 border border-border/50 p-3">
                            <Breakdown lines={[line]} compact />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold text-foreground">{bn ? "রিনিউ সারাংশ" : "Renewal summary"}</h2>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{bn ? "নির্বাচিত ডোমেইন" : "Domains selected"}</span>
                <span className="text-foreground font-semibold">{selectedCount}</span>
              </div>
              {renewLines.length > 0 ? (
                <Breakdown lines={renewLines} />
              ) : (
                <p className="text-xs text-muted-foreground">{bn ? "একটি ডোমেইন বেছে নিলে মূল্যের বিস্তারিত এখানে দেখাবে।" : "Pick a domain to see the itemised price here."}</p>
              )}
              <p className="text-[11px] text-muted-foreground flex gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {bn
                  ? "রিনিউ করলে বর্তমান মেয়াদের সাথে নতুন বছর যোগ হয় — কোনো ডাউনটাইম হয় না।"
                  : "Renewing adds years on top of the current term — no downtime."}
              </p>
              {renewError && (
                <p className="text-[11px] text-destructive flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {renewError}
                </p>
              )}
              <button
                onClick={goToConfirm}
                disabled={selectedCount === 0}
                className="w-full gradient-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                {selectedCount === 0 ? (bn ? "ডোমেইন নির্বাচন করুন" : "Select a domain") : bn ? "রিনিউ পর্যালোচনা করুন" : "Review renewal"}
              </button>
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{bn ? "ট্রান্সফার অনুরোধ গৃহীত" : "Transfer request received"}</h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Ticket className="w-3.5 h-3.5" /> {transferTicket}
                        {statusQuery.data?.status && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary/60 text-[10px] font-semibold uppercase">
                            {statusQuery.data.status.replace("_", " ")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => statusQuery.refetch()}
                    disabled={statusQuery.isFetching}
                    className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary/40 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${statusQuery.isFetching ? "animate-spin" : ""}`} />
                    {bn ? "স্ট্যাটাস আপডেট" : "Refresh status"}
                  </button>
                </div>

                <div className="space-y-3">
                  {(statusQuery.data?.stages ?? [{ key: "received", done: true, current: true, at: null }]).map((s) => (
                    <div key={s.key} className="flex items-start gap-3">
                      <span
                        className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                          s.done ? (s.current ? "bg-primary" : "bg-success") : "bg-border"
                        }`}
                      />
                      <div>
                        <p className={`text-xs ${s.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                          {bn ? STAGE_LABELS[s.key]!.bn : STAGE_LABELS[s.key]!.en}
                        </p>
                        {s.at && <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(s.at)}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {statusQuery.data && statusQuery.data.updates.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <h3 className="text-xs font-bold text-foreground">{bn ? "সর্বশেষ আপডেট" : "Latest updates"}</h3>
                    {statusQuery.data.updates.slice(-3).map((u) => (
                      <div key={u.id} className="rounded-xl bg-secondary/30 border border-border/50 p-3">
                        <p className="text-[11px] text-foreground whitespace-pre-wrap break-words">{u.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {u.isStaff ? (bn ? "সাপোর্ট টিম" : "Support team") : bn ? "আপনি" : "You"} · {fmtTime(u.at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  {bn
                    ? "ট্রান্সফার সাধারণত ৫-৭ দিনে সম্পন্ন হয়। এই পাতা প্রতি ২০ সেকেন্ডে স্ট্যাটাস আপডেট করে।"
                    : "Transfers usually complete within 5-7 days. This tracker refreshes every 20 seconds."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/dashboard/support" className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-xs">
                    {bn ? "টিকেট দেখুন" : "View ticket"}
                  </Link>
                  <button onClick={resetTransfer} className="bg-secondary/50 text-foreground px-5 py-2.5 rounded-xl font-semibold text-xs border border-border">
                    {bn ? "আরেকটি ডোমেইন ট্রান্সফার" : "Transfer another domain"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitTransfer} noValidate className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{bn ? "ডোমেইন নাম" : "Domain name"}</label>
                  <input
                    value={transferDomain}
                    onChange={(e) => setTransferDomain(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, domain: true }))}
                    placeholder="example.com"
                    aria-invalid={!!(touched.domain && domainCode)}
                    className={`w-full px-4 py-3 rounded-xl bg-secondary/50 border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm ${
                      touched.domain && domainCode ? "border-destructive" : "border-border"
                    }`}
                  />
                  <FieldError show={!!touched.domain} code={domainCode} />
                  {!domainCode && transferDomain && !transferPrice && (
                    <p className="text-[11px] text-warning flex items-center gap-1.5 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {msg("price_unknown")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{bn ? "ট্রান্সফার মেয়াদ" : "Transfer term"}</label>
                  <div className="flex flex-wrap gap-2">
                    {TERMS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTransferYears(t)}
                        className={`px-3 py-2 rounded-lg text-[11px] font-semibold border ${
                          transferYears === t
                            ? "gradient-primary text-primary-foreground border-transparent"
                            : "bg-secondary/40 text-muted-foreground border-border"
                        }`}
                      >
                        {t} {bn ? "বছর" : t === 1 ? "year" : "years"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{bn ? "EPP / Auth কোড" : "EPP / Auth code"}</label>
                  <input
                    value={eppCode}
                    onChange={(e) => setEppCode(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, epp: true }))}
                    placeholder="XXXX-XXXX-XXXX"
                    aria-invalid={!!(touched.epp && eppCodeError)}
                    className={`w-full px-4 py-3 rounded-xl bg-secondary/50 border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm font-mono ${
                      touched.epp && eppCodeError ? "border-destructive" : "border-border"
                    }`}
                  />
                  <FieldError show={!!touched.epp} code={eppCodeError} />
                  {!eppCodeError && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {bn
                        ? "কোডটি বর্তমান রেজিস্ট্রার আপনার রেজিস্ট্র্যান্ট ইমেইলে পাঠায়।"
                        : "Your current registrar sends this code to the registrant email."}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{bn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}</label>
                  <textarea
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, note: true }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm resize-none"
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <FieldError show={!!touched.note} code={noteCodeError} />
                    <span className="text-[10px] text-muted-foreground ml-auto">{transferNote.length}/1000</span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-[11px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => {
                      setAck(e.target.checked);
                      setTouched((t) => ({ ...t, ack: true }));
                    }}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span>
                    {bn
                      ? "আমি নিশ্চিত করছি ডোমেইনটি আনলক করা, ৬০ দিনের মধ্যে রেজিস্টার/ট্রান্সফার করা হয়নি এবং WHOIS প্রাইভেসি বন্ধ আছে।"
                      : "I confirm the domain is unlocked, was not registered or transferred in the last 60 days, and WHOIS privacy is off."}
                  </span>
                </label>
                <FieldError show={!!touched.ack && !ack} code={"ack_required"} />

                {transferFormError && (
                  <p className="text-xs text-destructive flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {transferFormError}
                  </p>
                )}

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
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-foreground">{bn ? "ট্রান্সফার মূল্য" : "Transfer pricing"}</h2>
              {transferLine ? (
                <>
                  <p className="text-2xl font-bold text-foreground">{formatPriceBDT(transferLine.total, lang)}</p>
                  <Breakdown lines={[transferLine]} compact />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{bn ? "মূল্য দেখতে সঠিক ডোমেইন লিখুন" : "Enter a valid domain to see the price"}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {bn
                  ? "ট্রান্সফারের সাথে নির্বাচিত মেয়াদ যোগ হয় (কিছু TLD ব্যতিক্রম)।"
                  : "Transfers add the selected term to your domain (some TLDs excluded)."}
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
          <form onSubmit={runWhois} noValidate className="flex flex-col sm:flex-row gap-2">
            <input
              value={whoisDomain}
              onChange={(e) => setWhoisDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <button
              type="submit"
              disabled={whoisLoading}
              className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {whoisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {bn ? "লুকআপ" : "Lookup"}
            </button>
          </form>

          {whoisError && <div className="glass-card rounded-xl p-4 text-sm text-destructive">{whoisError}</div>}

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
