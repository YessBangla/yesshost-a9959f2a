import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Search, ShoppingCart, Check, Star, ArrowRight, Shield, RefreshCw, ArrowRightLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import { formatPrice } from "@/lib/formatPrice";
import SEOHead from "@/components/SEOHead";

interface TLDPrice {
  id: string;
  ext: string;
  registration_bdt: string;
  renewal_bdt: string;
  transfer_bdt: string;
  is_popular: boolean;
}

// Static fallback
const fallbackPrices: Omit<TLDPrice, "id">[] = [
  { ext: ".com", registration_bdt: "৯৯০", renewal_bdt: "১,১৯০", transfer_bdt: "১,১৯০", is_popular: true },
  { ext: ".net", registration_bdt: "১,০৯০", renewal_bdt: "১,২৯০", transfer_bdt: "১,২৯০", is_popular: false },
  { ext: ".org", registration_bdt: "১,১৯০", renewal_bdt: "১,৩৯০", transfer_bdt: "১,৩৯০", is_popular: false },
  { ext: ".com.bd", registration_bdt: "১,৫০০", renewal_bdt: "১,৫০০", transfer_bdt: "১,৫০০", is_popular: false },
  { ext: ".net.bd", registration_bdt: "১,২০০", renewal_bdt: "১,২০০", transfer_bdt: "১,২০০", is_popular: false },
  { ext: ".org.bd", registration_bdt: "১,০০০", renewal_bdt: "১,০০০", transfer_bdt: "১,০০০", is_popular: false },
  { ext: ".top", registration_bdt: "১৮০", renewal_bdt: "৯৯০", transfer_bdt: "৯৯০", is_popular: true },
  { ext: ".xyz", registration_bdt: "২৯৫", renewal_bdt: "১,১৯০", transfer_bdt: "১,১৯০", is_popular: false },
  { ext: ".বাংলা", registration_bdt: "১,৫০০", renewal_bdt: "১,৫০০", transfer_bdt: "১,৫০০", is_popular: false },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const DomainPricing = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tldPrices, setTldPrices] = useState<TLDPrice[]>([]);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    supabase
      .from("domain_pricing" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setTldPrices(data);
        } else {
          setTldPrices(fallbackPrices.map((p, i) => ({ ...p, id: `fallback-${i}` })));
        }
        setLoading(false);
      });
  }, []);

  const filtered = tldPrices.filter((t) =>
    t.ext.toLowerCase().includes(search.toLowerCase())
  );

  const addDomain = (tld: TLDPrice) => {
    const id = `domain-reg-${tld.ext}`;
    if (isInCart(id)) return;
    addItem({
      id,
      type: "domain",
      name: `Domain Registration ${tld.ext}`,
      description: bn ? `${tld.ext} ডোমেইন রেজিস্ট্রেশন` : `${tld.ext} Domain Registration`,
      price_bdt: tld.registration_bdt,
      ext: tld.ext,
    });
  };

  return (
    <PublicLayout>
      <SEOHead
        title={bn ? "ডোমেইন মূল্য তালিকা — Yess Host" : "Domain Pricing — Yess Host"}
        description={bn ? "সকল TLD এর রেজিস্ট্রেশন, রিনিউয়াল ও ট্রান্সফার মূল্য দেখুন" : "View registration, renewal and transfer prices for all TLDs"}
      />

      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: brandCurve }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
              {bn ? "ডোমেইন প্রাইসিং" : "Domain Pricing"}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "ডোমেইন মূল্য তালিকা" : "Domain Price List"}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8">
              {bn
                ? "সকল জনপ্রিয় TLD এর রেজিস্ট্রেশন, বাৎসরিক রিনিউয়াল ও ট্রান্সফার চার্জ একনজরে দেখুন"
                : "View registration, annual renewal & transfer charges for all popular TLDs at a glance"}
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-card-elevated">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={bn ? ".com, .net, .xyz..." : "Search TLD e.g. .com, .net..."}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-hidden text-sm"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legend */}
      <section className="container mx-auto px-4 -mt-4 mb-6">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {[
            { icon: Globe, label: bn ? "রেজিস্ট্রেশন" : "Registration", color: "text-primary" },
            { icon: RefreshCw, label: bn ? "রিনিউয়াল" : "Renewal", color: "text-accent" },
            { icon: ArrowRightLeft, label: bn ? "ট্রান্সফার" : "Transfer", color: "text-muted-foreground" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="text-muted-foreground text-xs">/{bn ? "বছর" : "yr"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Table */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 glass-card rounded-2xl">
              <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" />
              <span className="text-sm text-muted-foreground">{bn ? "লোড হচ্ছে..." : "Loading..."}</span>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{bn ? "এক্সটেনশন" : "Extension"}</th>
                      <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5"><Globe className="w-3.5 h-3.5 text-primary" />{bn ? "রেজিস্ট্রেশন" : "Registration"}</div>
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-accent" />{bn ? "রিনিউয়াল" : "Renewal"}</div>
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5" />{bn ? "ট্রান্সফার" : "Transfer"}</div>
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{bn ? "অ্যাকশন" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tld, i) => {
                      const cartId = `domain-reg-${tld.ext}`;
                      const inCart = isInCart(cartId);
                      return (
                        <motion.tr
                          key={tld.ext}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className={`border-b border-border last:border-b-0 transition-colors hover:bg-primary/5 ${tld.is_popular ? "bg-primary/[0.03]" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{tld.ext}</span>
                              {tld.is_popular && (
                                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold gradient-primary text-primary-foreground">
                                  <Star className="w-2.5 h-2.5 fill-current" />{bn ? "জনপ্রিয়" : "Popular"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-extrabold text-primary tabular-nums">৳{formatPrice(tld.registration_bdt, lang)}</span>
                            <span className="text-[10px] text-muted-foreground">/{bn ? "বছর" : "yr"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-foreground tabular-nums">৳{formatPrice(tld.renewal_bdt, lang)}</span>
                            <span className="text-[10px] text-muted-foreground">/{bn ? "বছর" : "yr"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-muted-foreground tabular-nums">৳{formatPrice(tld.transfer_bdt, lang)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {inCart ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border">
                                <Check className="w-3.5 h-3.5 text-primary" />{bn ? "কার্টে আছে" : "In Cart"}
                              </span>
                            ) : (
                              <button onClick={() => addDomain(tld)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-xs">
                                <ShoppingCart className="w-3.5 h-3.5" />{bn ? "নিন" : "Register"}
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {filtered.map((tld, i) => {
                  const cartId = `domain-reg-${tld.ext}`;
                  const inCart = isInCart(cartId);
                  return (
                    <motion.div
                      key={tld.ext}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      className={`glass-card rounded-xl p-4 ${tld.is_popular ? "glow-border" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-foreground">{tld.ext}</span>
                          {tld.is_popular && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold gradient-primary text-primary-foreground">
                              <Star className="w-2.5 h-2.5 fill-current" /> {bn ? "জনপ্রিয়" : "Popular"}
                            </span>
                          )}
                        </div>
                        {inCart ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-secondary text-foreground border border-border">
                            <Check className="w-3 h-3 text-primary" /> {bn ? "কার্টে" : "Added"}
                          </span>
                        ) : (
                          <button onClick={() => addDomain(tld)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all">
                            <ShoppingCart className="w-3 h-3" /> {bn ? "নিন" : "Register"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{bn ? "রেজিস্ট্রেশন" : "Register"}</p>
                          <p className="text-sm font-bold text-primary tabular-nums">৳{formatPrice(tld.registration_bdt, lang)}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50 border border-border">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{bn ? "রিনিউয়াল" : "Renewal"}</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">৳{formatPrice(tld.renewal_bdt, lang)}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50 border border-border">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{bn ? "ট্রান্সফার" : "Transfer"}</p>
                          <p className="text-sm font-bold text-muted-foreground tabular-nums">৳{formatPrice(tld.transfer_bdt, lang)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12 glass-card rounded-xl">
                  <p className="text-muted-foreground">{bn ? "কোনো TLD পাওয়া যায়নি" : "No TLDs found"}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info section */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: bn ? "ফ্রি WHOIS প্রাইভেসি" : "Free WHOIS Privacy", desc: bn ? "সকল ডোমেইনের সাথে বিনামূল্যে WHOIS প্রটেকশন" : "Free WHOIS protection with every domain" },
            { icon: RefreshCw, title: bn ? "অটো রিনিউয়াল" : "Auto Renewal", desc: bn ? "ডোমেইন এক্সপায়ার হওয়ার আগেই অটো রিনিউ" : "Auto-renew before your domain expires" },
            { icon: ArrowRight, title: bn ? "সহজ ট্রান্সফার" : "Easy Transfer", desc: bn ? "যেকোনো রেজিস্ট্রার থেকে সহজেই ট্রান্সফার করুন" : "Transfer from any registrar with ease" },
          ].map((item) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};

export default DomainPricing;
