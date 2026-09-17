import { useState, useEffect, useCallback } from "react";
import {
  Search, ArrowRight, Globe, CheckCircle2, XCircle, Loader2,
  ShoppingCart, Check, Info, Calendar, Server, Shield,
  ChevronDown, ChevronUp, Sparkles, TrendingUp, Lightbulb, RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/formatPrice";

interface WhoisInfo {
  registrar?: string;
  creation_date?: string;
  expiry_date?: string;
  updated_date?: string;
  status?: string[];
  nameservers?: string[];
}

interface DomainResult {
  domain: string;
  ext: string;
  available: boolean;
  price_bdt: string;
  price_usd: string;
  renewal_bdt?: string;
}

interface DomainPrice {
  ext: string;
  price: string;
  popular: boolean;
}

const staticDomainPrices: DomainPrice[] = [
  { ext: ".com", price: "৯৯০", popular: true },
  { ext: ".com.bd", price: "১,৫০০", popular: false },
  { ext: ".net", price: "১,১৫০", popular: false },
  { ext: ".net.bd", price: "১,২০০", popular: false },
  { ext: ".বাংলা", price: "১,৫০০", popular: false },
  { ext: ".xyz", price: "২৯৫", popular: false },
  { ext: ".top", price: "১৮০", popular: false },
];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

/* ─── Sub-components ─── */

const TldPill = ({ d, onClick, lang }: { d: DomainPrice; onClick: () => void; lang: string }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border transition-all duration-200 hover:scale-[1.04] hover:shadow-md ${
      d.popular
        ? "border-primary/40 bg-primary/8 text-primary shadow-xs shadow-primary/10"
        : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/20"
    }`}
  >
    {d.popular && (
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
        Popular
      </span>
    )}
    <span className="text-sm font-bold">{d.ext}</span>
    <span className="text-xs font-semibold opacity-80">৳{formatPrice(d.price, lang)}</span>
  </button>
);

const WhoisPanel = ({ domain, whoisData, whoisLoading, lang }: {
  domain: string;
  whoisData: Record<string, WhoisInfo | null>;
  whoisLoading: Record<string, boolean>;
  lang: string;
}) => {
  const info = whoisData[domain];

  if (whoisLoading[domain]) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground">{lang === "bn" ? "WHOIS তথ্য লোড হচ্ছে..." : "Loading WHOIS data..."}</span>
      </div>
    );
  }

  if (!info) {
    return <p className="text-xs text-muted-foreground text-center py-4">{lang === "bn" ? "WHOIS তথ্য পাওয়া যায়নি" : "WHOIS data not available"}</p>;
  }

  const items = [
    { icon: Shield, color: "text-primary", label: lang === "bn" ? "রেজিস্ট্রার" : "Registrar", value: info.registrar || "—" },
    { icon: Calendar, color: "text-primary", label: lang === "bn" ? "রেজিস্ট্রেশন তারিখ" : "Created", value: formatDate(info.creation_date) },
    { icon: Calendar, color: "text-destructive", label: lang === "bn" ? "মেয়াদ শেষ" : "Expires", value: formatDate(info.expiry_date) },
    { icon: Calendar, color: "text-muted-foreground", label: lang === "bn" ? "সর্বশেষ আপডেট" : "Updated", value: formatDate(info.updated_date) },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
          <item.icon className={`w-4 h-4 ${item.color} mt-0.5 shrink-0`} />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">{item.value}</p>
          </div>
        </div>
      ))}
      {info.nameservers && info.nameservers.length > 0 && (
        <div className="sm:col-span-2 flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
          <Server className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "নেমসার্ভার" : "Nameservers"}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {info.nameservers.map((ns) => (
                <span key={ns} className="text-[10px] font-mono text-foreground bg-background px-2 py-0.5 rounded-sm border border-border">{ns.toLowerCase()}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      {info.status && info.status.length > 0 && (
        <div className="sm:col-span-2 flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "স্ট্যাটাস" : "Status"}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {info.status.map((s) => (
                <span key={s} className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-sm border border-border">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DomainResultRow = ({ result, idx, lang, isInCart, addDomainToCart, expandedDomain, fetchWhois, whoisData, whoisLoading }: {
  result: DomainResult;
  idx: number;
  lang: string;
  isInCart: (id: string) => boolean;
  addDomainToCart: (r: DomainResult) => void;
  expandedDomain: string | null;
  fetchWhois: (domain: string) => void;
  whoisData: Record<string, WhoisInfo | null>;
  whoisLoading: Record<string, boolean>;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.04, duration: 0.3 }}
    className="border-b border-border/60 last:border-b-0"
  >
    <div className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 transition-colors ${
      result.available ? "hover:bg-primary/[0.03]" : "hover:bg-muted/30"
    }`}>
      {/* Left: status + domain */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          result.available ? "bg-success/10" : "bg-destructive/10"
        }`}>
          {result.available
            ? <CheckCircle2 className="w-4 h-4 text-success" />
            : <XCircle className="w-4 h-4 text-destructive" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate tracking-tight">{result.domain}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-muted-foreground">
              {result.available
                ? (lang === "bn" ? "✓ পাওয়া যাচ্ছে!" : "✓ Available!")
                : (lang === "bn" ? "✗ নেওয়া হয়ে গেছে" : "✗ Already taken")}
            </p>
            {/* Inline WHOIS toggle for taken domains */}
            {!result.available && (
              <button
                onClick={() => fetchWhois(result.domain)}
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-all ${
                  expandedDomain === result.domain
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "bg-muted/60 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent"
                }`}
              >
                <Info className="w-3 h-3" />
                WHOIS
                {expandedDomain === result.domain ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: price + action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-sm font-extrabold text-foreground tabular-nums">
            ৳{formatPrice(result.price_bdt, lang)}
            <span className="text-[10px] text-muted-foreground font-normal ml-0.5">/{lang === "bn" ? "বছর" : "yr"}</span>
          </span>
          {result.renewal_bdt && (
            <p className="text-[10px] text-muted-foreground">
              {lang === "bn" ? "রিনিউ:" : "Renew:"} ৳{formatPrice(result.renewal_bdt, lang)}/{lang === "bn" ? "বছর" : "yr"}
            </p>
          )}
        </div>

        {result.available && (
          isInCart(result.domain) ? (
            <span className="flex items-center gap-1.5 bg-success/10 text-success px-3.5 py-2 rounded-lg text-xs font-bold border border-success/20">
              <Check className="w-3.5 h-3.5" />{lang === "bn" ? "যোগ হয়েছে" : "Added"}
            </span>
          ) : (
            <button
              onClick={() => addDomainToCart(result)}
              className="flex items-center gap-1.5 gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />{lang === "bn" ? "নিন" : "Add"}
            </button>
          )
        )}
      </div>
    </div>


    {/* WHOIS panel */}
    <AnimatePresence>
      {!result.available && expandedDomain === result.domain && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 pt-1">
            <WhoisPanel domain={result.domain} whoisData={whoisData} whoisLoading={whoisLoading} lang={lang} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

/* ─── Main Component ─── */

const DomainSearch = () => {
  const { lang } = useLanguage();
  const { addItem, isInCart } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [whoisData, setWhoisData] = useState<Record<string, WhoisInfo | null>>({});
  const [whoisLoading, setWhoisLoading] = useState<Record<string, boolean>>({});
  const [domainPrices, setDomainPrices] = useState<DomainPrice[]>(staticDomainPrices);
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchedName, setSearchedName] = useState("");

  useEffect(() => {
    (supabase.from("domain_pricing" as any) as any)
      .select("ext, registration_bdt, is_popular")
      .eq("is_active", true)
      .order("sort_order")
      .limit(8)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setDomainPrices(data.map((d: any) => ({ ext: d.ext, price: d.registration_bdt, popular: d.is_popular })));
        }
      });
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setExpandedDomain(null);
    setWhoisData({});
    setSuggestions([]);
    const name = searchTerm.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\.\w+(\.\w+)?$/, "").replace(/\/.*$/, "");
    setSearchedName(name);
    try {
      const { data, error } = await supabase.functions.invoke("check-domain", { body: { domain: searchTerm } });
      if (error) throw error;
      if (data?.results) setResults(data.results);
    } catch (err) {
      console.error("Domain check failed:", err);
    } finally {
      setLoading(false);
    }
    // Fetch suggestions in background
    fetchSuggestions(name);
  }, [query]);

  const fetchSuggestions = useCallback(async (name: string) => {
    setSuggestionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("domain-suggest", { body: { domain: name, lang } });
      if (error) throw error;
      if (data?.suggestions) setSuggestions(data.suggestions);
    } catch (err) {
      console.error("Suggestions failed:", err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [lang]);

  const searchSuggestion = useCallback((name: string) => {
    setQuery(name + ".com");
    setSearched(true);
    setLoading(true);
    setResults([]);
    setExpandedDomain(null);
    setWhoisData({});
    setSuggestions([]);
    setSearchedName(name);
    supabase.functions.invoke("check-domain", { body: { domain: name + ".com" } })
      .then(({ data, error }) => {
        if (!error && data?.results) setResults(data.results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetchSuggestions(name);
  }, [fetchSuggestions]);

  const fetchWhois = useCallback(async (domain: string) => {
    if (expandedDomain === domain) { setExpandedDomain(null); return; }
    setExpandedDomain(domain);
    if (whoisData[domain] !== undefined) return;
    setWhoisLoading((prev) => ({ ...prev, [domain]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("check-domain", { body: { domain, whois: true } });
      if (error) throw error;
      setWhoisData((prev) => ({ ...prev, [domain]: data?.whois || null }));
    } catch (err) {
      console.error("WHOIS fetch failed:", err);
      setWhoisData((prev) => ({ ...prev, [domain]: null }));
    } finally {
      setWhoisLoading((prev) => ({ ...prev, [domain]: false }));
    }
  }, [expandedDomain, whoisData]);

  const addDomainToCart = useCallback((result: DomainResult) => {
    addItem({
      id: result.domain,
      type: "domain",
      name: result.domain,
      domain: result.domain,
      ext: result.ext,
      price_bdt: result.price_bdt,
      price_usd: result.price_usd,
    });
  }, [addItem]);

  return (
    <section className="relative bg-gradient-to-b from-muted/60 via-background to-background border-b border-border/50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-accent/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
                {lang === "bn" ? "ডোমেইন রেজিস্ট্রেশন" : "Domain Registration"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {lang === "bn" ? "আপনার পারফেক্ট ডোমেইন খুঁজুন" : "Find Your Perfect Domain"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {lang === "bn"
                ? ".com, .net, .com.bd সহ সকল জনপ্রিয় ডোমেইন এক্সটেনশন পাওয়া যাচ্ছে"
                : "Search across all popular extensions including .com, .net, .com.bd & more"}
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-card border-2 shadow-xl transition-all duration-300 ${
              inputFocused
                ? "border-primary/40 shadow-primary/10 ring-4 ring-primary/5"
                : "border-border/60 shadow-muted/10"
            }`}>
              <div className="flex items-center gap-3 flex-1 px-4">
                <Search className={`w-5 h-5 shrink-0 transition-colors duration-200 ${inputFocused ? "text-primary" : "text-muted-foreground"}`} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={lang === "bn" ? "আপনার ডোমেইন নাম লিখুন, যেমন: example.com" : "Enter your domain name, e.g. example.com"}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-hidden text-sm sm:text-base py-3 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="shrink-0 flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {lang === "bn" ? "ডোমেইন খুঁজুন" : "Search Domain"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Results */}
          <AnimatePresence mode="wait">
            {searched && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 bg-card rounded-2xl border border-border/60 shadow-xs">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <Globe className="w-5 h-5 text-primary absolute inset-0 m-auto" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{lang === "bn" ? "ডোমেইন চেক করা হচ্ছে..." : "Checking domain availability..."}</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                    {/* Results header */}
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-muted/30 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          {lang === "bn" ? `${results.length}টি ফলাফল` : `${results.length} Results`}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {lang === "bn" ? "সেরা মূল্যে" : "Best prices guaranteed"}
                      </span>
                    </div>
                    {results.map((result, idx) => (
                      <DomainResultRow
                        key={result.domain}
                        result={result}
                        idx={idx}
                        lang={lang}
                        isInCart={isInCart}
                        addDomainToCart={addDomainToCart}
                        expandedDomain={expandedDomain}
                        fetchWhois={fetchWhois}
                        whoisData={whoisData}
                        whoisLoading={whoisLoading}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-card rounded-2xl border border-border/60 shadow-xs">
                    <Globe className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">{lang === "bn" ? "কোনো ডোমেইন পাওয়া যায়নি" : "No domains found"}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{lang === "bn" ? "অন্য একটি নাম দিয়ে চেষ্টা করুন" : "Try searching with a different name"}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Suggestions */}
          {searched && !loading && (suggestions.length > 0 || suggestionsLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <div className="bg-card rounded-2xl border border-border/60 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {lang === "bn" ? "সমসাময়িক নাম সাজেশন" : "Name Suggestions"}
                    </span>
                  </div>
                  {!suggestionsLoading && (
                    <button
                      onClick={() => fetchSuggestions(searchedName)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {lang === "bn" ? "আরও দেখুন" : "More"}
                    </button>
                  )}
                </div>

                {suggestionsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">{lang === "bn" ? "সাজেশন তৈরি হচ্ছে..." : "Generating suggestions..."}</span>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {suggestions.map((name) => (
                        <button
                          key={name}
                          onClick={() => searchSuggestion(name)}
                          className="group flex items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{name}</p>
                            <p className="text-[10px] text-muted-foreground">.com</p>
                          </div>
                          <Search className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      {lang === "bn" ? "ক্লিক করে এই নামে ডোমেইন খুঁজুন" : "Click any name to search for available domains"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Popular TLDs */}
          {!searched && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {lang === "bn" ? "জনপ্রিয় এক্সটেনশন" : "Popular Extensions"}
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {domainPrices.map((d) => (
                  <TldPill
                    key={d.ext}
                    d={d}
                    lang={lang}
                    onClick={() => setQuery((q) => {
                      const base = q.replace(/\.\w+(\.\w+)?$/, "");
                      return (base || "example") + d.ext;
                    })}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DomainSearch;
