import { useState } from "react";
import { Search, ArrowRight, Globe, CheckCircle2, XCircle, Loader2, ShoppingCart, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

interface DomainResult {
  domain: string;
  ext: string;
  available: boolean;
  price_bdt: string;
  price_usd: string;
}

const domainPrices = [
  { ext: ".com", price: "৯৯০", popular: true },
  { ext: ".top", price: "১৮০", popular: false },
  { ext: ".xyz", price: "২৯৫", popular: false },
  { ext: ".shop", price: "৩৯০", popular: false },
  { ext: ".fun", price: "৩৮০", popular: false },
];

const DomainSearch = () => {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("check-domain", {
        body: { domain: query.trim() },
      });

      if (error) throw error;
      if (data?.results) {
        setResults(data.results);
      }
    } catch (err) {
      console.error("Domain check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-muted/80 to-background border-b border-border">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          {/* Label */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-foreground tracking-wide uppercase">
              {lang === "bn" ? "আপনার পারফেক্ট ডোমেইন খুঁজুন" : "Find Your Perfect Domain"}
            </span>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 rounded-2xl glass-card-elevated shadow-lg">
              <div className="flex items-center gap-3 flex-1 px-4">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={lang === "bn" ? "example.com" : "example.com"}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm sm:text-base py-3"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="shrink-0 flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
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
          </form>

          {/* Results */}
          <AnimatePresence mode="wait">
            {searched && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3 py-8 glass-card rounded-xl">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {lang === "bn" ? "ডোমেইন চেক করা হচ্ছে..." : "Checking domains..."}
                    </span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
                    {results.map((result, idx) => (
                      <motion.div
                        key={result.domain}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                          result.available
                            ? "hover:bg-primary/5"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {result.available ? (
                            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {result.domain}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {result.available
                                ? lang === "bn"
                                  ? "পাওয়া যাচ্ছে!"
                                  : "Available!"
                                : lang === "bn"
                                  ? "নেওয়া হয়ে গেছে"
                                  : "Already taken"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-foreground">
                            ৳{result.price_bdt}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              /{lang === "bn" ? "বছর" : "yr"}
                            </span>
                          </span>
                          {result.available && (
                            <button className="flex items-center gap-1.5 gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
                              <ShoppingCart className="w-3.5 h-3.5" />
                              {lang === "bn" ? "নিন" : "Add"}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 glass-card rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      {lang === "bn" ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found"}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Price tags - hide when results showing */}
          {!searched && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
              {domainPrices.map((d) => (
                <div
                  key={d.ext}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs cursor-pointer hover:scale-105 transition-transform ${
                    d.popular ? "glow-border" : ""
                  }`}
                  onClick={() => {
                    setQuery(`example${d.ext}`);
                  }}
                >
                  <span className="font-bold text-foreground">{d.ext}</span>
                  <span className="text-muted-foreground">৳{d.price}</span>
                  {d.popular && (
                    <span className="text-[9px] font-bold gradient-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {lang === "bn" ? "জনপ্রিয়" : "Popular"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainSearch;
