import { useState, useEffect } from "react";
import { Search, ArrowRight, Globe, CheckCircle2, XCircle, Loader2, ShoppingCart, Check, Info, Calendar, Server, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

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
}

const staticDomainPrices = [
  { ext: ".com", price: "৯৯০", popular: true },
  { ext: ".top", price: "১৮০", popular: false },
  { ext: ".xyz", price: "২৯৫", popular: false },
  { ext: ".shop", price: "৩৯০", popular: false },
  { ext: ".fun", price: "৩৮০", popular: false },
];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

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

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setExpandedDomain(null);
    setWhoisData({});
    try {
      const { data, error } = await supabase.functions.invoke("check-domain", { body: { domain: query.trim() } });
      if (error) throw error;
      if (data?.results) setResults(data.results);
    } catch (err) {
      console.error("Domain check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhois = async (domain: string) => {
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
  };

  const addDomainToCart = (result: DomainResult) => {
    addItem({
      id: result.domain,
      type: "domain",
      name: result.domain,
      domain: result.domain,
      ext: result.ext,
      price_bdt: result.price_bdt,
      price_usd: result.price_usd,
    });
  };

  return (
    <div className="relative bg-gradient-to-b from-muted/80 to-background border-b border-border">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-foreground tracking-wide uppercase">
              {lang === "bn" ? "আপনার পারফেক্ট ডোমেইন খুঁজুন" : "Find Your Perfect Domain"}
            </span>
          </div>

          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 rounded-2xl glass-card-elevated shadow-lg">
              <div className="flex items-center gap-3 flex-1 px-4">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="example.com"
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm sm:text-base py-3"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="shrink-0 flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>{lang === "bn" ? "ডোমেইন খুঁজুন" : "Search Domain"}<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {searched && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 py-8 glass-card rounded-xl">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">{lang === "bn" ? "ডোমেইন চেক করা হচ্ছে..." : "Checking domains..."}</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="glass-card rounded-xl overflow-hidden">
                    {results.map((result, idx) => (
                      <motion.div key={result.domain} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="border-b border-border last:border-b-0">
                        <div className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${result.available ? "hover:bg-primary/5" : "opacity-60"}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            {result.available ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{result.domain}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {result.available ? (lang === "bn" ? "পাওয়া যাচ্ছে!" : "Available!") : (lang === "bn" ? "নেওয়া হয়ে গেছে" : "Already taken")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-foreground">
                              ৳{result.price_bdt}<span className="text-[10px] text-muted-foreground font-normal">/{lang === "bn" ? "বছর" : "yr"}</span>
                            </span>
                            {result.available ? (
                              isInCart(result.domain) ? (
                                <span className="flex items-center gap-1.5 bg-secondary text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold border border-border">
                                  <Check className="w-3.5 h-3.5 text-primary" />{lang === "bn" ? "যোগ হয়েছে" : "Added"}
                                </span>
                              ) : (
                                <button onClick={() => addDomainToCart(result)} className="flex items-center gap-1.5 gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
                                  <ShoppingCart className="w-3.5 h-3.5" />{lang === "bn" ? "নিন" : "Add"}
                                </button>
                              )
                            ) : (
                              <button onClick={() => fetchWhois(result.domain)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-primary/5">
                                <Info className="w-3.5 h-3.5" />
                                {expandedDomain === result.domain ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* WHOIS panel */}
                        <AnimatePresence>
                          {!result.available && expandedDomain === result.domain && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 pt-1">
                                {whoisLoading[result.domain] ? (
                                  <div className="flex items-center gap-2 py-4 justify-center">
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    <span className="text-xs text-muted-foreground">{lang === "bn" ? "WHOIS তথ্য লোড হচ্ছে..." : "Loading WHOIS data..."}</span>
                                  </div>
                                ) : whoisData[result.domain] ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                                      <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "রেজিস্ট্রার" : "Registrar"}</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5">{whoisData[result.domain]?.registrar || "—"}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                                      <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "রেজিস্ট্রেশন তারিখ" : "Created"}</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5">{formatDate(whoisData[result.domain]?.creation_date)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                                      <Calendar className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "মেয়াদ শেষ" : "Expires"}</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5">{formatDate(whoisData[result.domain]?.expiry_date)}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                      <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "সর্বশেষ আপডেট" : "Updated"}</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5">{formatDate(whoisData[result.domain]?.updated_date)}</p>
                                      </div>
                                    </div>
                                    {whoisData[result.domain]?.nameservers && whoisData[result.domain]!.nameservers!.length > 0 && (
                                      <div className="sm:col-span-2 flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                                        <Server className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "নেমসার্ভার" : "Nameservers"}</p>
                                          <div className="flex flex-wrap gap-1.5 mt-1">
                                            {whoisData[result.domain]!.nameservers!.map((ns) => (
                                              <span key={ns} className="text-[10px] font-mono text-foreground bg-background px-2 py-0.5 rounded border border-border">{ns.toLowerCase()}</span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {whoisData[result.domain]?.status && whoisData[result.domain]!.status!.length > 0 && (
                                      <div className="sm:col-span-2 flex items-start gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border">
                                        <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{lang === "bn" ? "স্ট্যাটাস" : "Status"}</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {whoisData[result.domain]!.status!.map((s) => (
                                              <span key={s} className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">{s}</span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground text-center py-4">{lang === "bn" ? "WHOIS তথ্য পাওয়া যায়নি" : "WHOIS data not available"}</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 glass-card rounded-xl">
                    <p className="text-sm text-muted-foreground">{lang === "bn" ? "কোনো ডোমেইন পাওয়া যায়নি" : "No domains found"}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular TLDs */}
          {!searched && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {domainPrices.map((d) => (
                <button
                  key={d.ext}
                  onClick={() => { setQuery((q) => { const base = q.replace(/\.\w+$/, ""); return (base || "example") + d.ext; }); }}
                  className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all ${d.popular ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"}`}
                >
                  {d.ext} <span className="font-bold">৳{d.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainSearch;
