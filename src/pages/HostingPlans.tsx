import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/lib/router-compat";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Globe, HardDrive, Shield, Mail, Layers, ArrowRight, Check, Star, Zap, Clock, Headphones, ChevronDown, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { formatPrice } from "@/lib/formatPrice";
import { BILLING_DURATIONS, calcDurationPrice, toBengaliNum, type BillingDuration } from "@/lib/billingDurations";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

interface PlanRow {
  id: string;
  name: string;
  category: string;
  slug: string;
  price_bdt: string;
  annual_price_bdt: string | null;
  subtitle: string | null;
  is_highlighted: boolean | null;
  features: any;
}

const categories = [
  { key: "web", icon: Server, colorClass: "text-blue-600", bgClass: "bg-blue-500/10" },
  { key: "vps", icon: HardDrive, colorClass: "text-violet-600", bgClass: "bg-violet-500/10" },
  { key: "reseller", icon: Layers, colorClass: "text-emerald-600", bgClass: "bg-emerald-500/10" },
  { key: "dedicated", icon: Shield, colorClass: "text-amber-600", bgClass: "bg-amber-500/10" },
  { key: "email", icon: Mail, colorClass: "text-pink-600", bgClass: "bg-pink-500/10" },
  { key: "ssl", icon: Globe, colorClass: "text-cyan-600", bgClass: "bg-cyan-500/10" },
];

const categoryLabels: Record<string, { bn: string; en: string; descBn: string; descEn: string }> = {
  web: { bn: "ওয়েব হোস্টিং", en: "Web Hosting", descBn: "ছোট থেকে বড় সব ওয়েবসাইটের জন্য দ্রুত ও নির্ভরযোগ্য হোস্টিং", descEn: "Fast & reliable hosting for websites of all sizes" },
  vps: { bn: "VPS সার্ভার", en: "VPS Server", descBn: "শক্তিশালী ভার্চুয়াল প্রাইভেট সার্ভার পূর্ণ রুট অ্যাক্সেস সহ", descEn: "Powerful virtual private servers with full root access" },
  reseller: { bn: "রিসেলার হোস্টিং", en: "Reseller Hosting", descBn: "নিজের হোস্টিং ব্যবসা শুরু করুন", descEn: "Start your own hosting business" },
  dedicated: { bn: "ডেডিকেটেড সার্ভার", en: "Dedicated Server", descBn: "সম্পূর্ণ ডেডিকেটেড হার্ডওয়্যার রিসোর্স", descEn: "Fully dedicated hardware resources" },
  email: { bn: "ইমেইল হোস্টিং", en: "Email Hosting", descBn: "প্রফেশনাল ইমেইল সার্ভিস আপনার ডোমেইনে", descEn: "Professional email service on your domain" },
  ssl: { bn: "SSL সার্টিফিকেট", en: "SSL Certificate", descBn: "আপনার ওয়েবসাইটকে সিকিউর করুন", descEn: "Secure your website with SSL" },
};

const normalizeFeature = (f: any) => {
  if (typeof f === "string") return { label: f, included: true };
  return { label: f.label || f, label_bn: f.label_bn, included: f.included !== false };
};

/* ─── Duration Selector ─── */
const DurationSelector = ({
  selected,
  onChange,
  bn,
}: {
  selected: BillingDuration;
  onChange: (d: BillingDuration) => void;
  bn: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-xs font-semibold text-foreground hover:border-primary/40 transition-all w-full justify-between"
      >
        <span>{bn ? selected.labelBn : selected.labelEn}</span>
        {selected.discount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            -{selected.discount}%
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-64 overflow-y-auto"
          >
            {BILLING_DURATIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => { onChange(d); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-all ${
                  selected.key === d.key
                    ? "bg-primary/5 text-primary font-bold"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <span>{bn ? d.labelBn : d.labelEn}</span>
                <div className="flex items-center gap-2">
                  {d.discount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {bn ? `${toBengaliNum(d.discount)}% ছাড়` : `${d.discount}% off`}
                    </span>
                  )}
                  {selected.key === d.key && <Check className="w-3 h-3 text-primary" />}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Plan Card ─── */
const PlanCard = ({
  plan,
  duration,
  onDurationChange,
  bn,
  lang,
}: {
  plan: PlanRow;
  duration: BillingDuration;
  onDurationChange: (d: BillingDuration) => void;
  bn: boolean;
  lang: string;
}) => {
  const { addItem, isInCart } = useCart();
  const rawFeatures = Array.isArray(plan.features) ? plan.features : [];
  const allFeatures = rawFeatures.map(normalizeFeature);
  const includedFeatures = allFeatures.filter((f) => f.included);
  const excludedFeatures = allFeatures.filter((f) => !f.included);
  
  const totalPrice = calcDurationPrice(plan.price_bdt, plan.annual_price_bdt, duration);
  const cartId = `hosting-${plan.id}-${duration.key}`;
  const inCart = isInCart(cartId);

  const durationLabel = bn ? duration.labelBn : duration.labelEn;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border p-5 transition-all hover:shadow-md flex flex-col ${
        plan.is_highlighted ? "border-primary bg-primary/[0.02] shadow-xs" : "border-border/70 hover:border-primary/20"
      }`}
    >
      {plan.is_highlighted && (
        <div className="absolute -top-0 right-3 flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-b-lg">
          <Star className="w-2.5 h-2.5 fill-current" /> {bn ? "জনপ্রিয়" : "Popular"}
        </div>
      )}

      <h3 className="text-sm font-bold text-foreground mb-1">{plan.name}</h3>
      {plan.subtitle && <p className="text-[11px] text-muted-foreground mb-3">{plan.subtitle}</p>}

      {/* Duration Selector */}
      <div className="mb-3">
        <DurationSelector selected={duration} onChange={onDurationChange} bn={bn} />
      </div>

      {/* Price */}
      <div className="mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${plan.id}-${duration.key}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-2xl font-extrabold text-foreground">
              ৳{bn ? toBengaliNum(totalPrice) : totalPrice.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/{durationLabel}</span>
            {duration.discount > 0 && (
              <p className="text-[11px] text-primary font-medium mt-1">
                🎉 {bn ? `${toBengaliNum(duration.discount)}% ছাড় পাচ্ছেন!` : `${duration.discount}% discount applied!`}
              </p>
            )}
            {duration.months > 1 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                ≈ ৳{bn ? toBengaliNum(Math.round(totalPrice / duration.months)) : Math.round(totalPrice / duration.months).toLocaleString()}/{bn ? "মাস" : "mo"}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Features */}
      {includedFeatures.length > 0 && (
        <ul className="space-y-1.5 mb-3 flex-1">
          {includedFeatures.map((f, j) => (
            <li key={j} className="flex items-center gap-2 text-xs text-foreground/80">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-primary" />
              </div>
              <span>{bn ? (f.label_bn || f.label) : f.label}</span>
            </li>
          ))}
        </ul>
      )}

      {excludedFeatures.length > 0 && (
        <ul className="space-y-1.5 mb-4 border-t border-border/50 pt-2">
          {excludedFeatures.map((f, j) => (
            <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground/60 line-through">
              <div className="w-4 h-4 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                <span className="text-[9px]">✕</span>
              </div>
              <span>{bn ? (f.label_bn || f.label) : f.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      {inCart ? (
        <div className="w-full py-2.5 font-semibold rounded-lg flex items-center justify-center gap-2 bg-secondary text-foreground border border-border text-xs mt-auto">
          <Check className="w-3.5 h-3.5 text-primary" />
          {bn ? "কার্টে আছে" : "In Cart"}
        </div>
      ) : (
        <button
          onClick={() => {
            addItem({
              id: cartId,
              type: "hosting",
              name: plan.name,
              description: `${plan.subtitle || plan.name} • ${durationLabel}`,
              price_bdt: totalPrice.toString(),
              plan_id: plan.id,
              billing_cycle: duration.key,
              category: plan.category,
            });
          }}
          className={`w-full py-2.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-xs mt-auto ${
            plan.is_highlighted
              ? "gradient-primary text-primary-foreground shadow-xs hover:opacity-90"
              : "border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {bn ? "কার্টে যোগ করুন" : "Add to Cart"}
        </button>
      )}
    </motion.div>
  );
};

/* ─── Main Page ─── */
const HostingPlans = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  // Per-plan duration state
  const [planDurations, setPlanDurations] = useState<Record<string, BillingDuration>>({});

  useEffect(() => {
    supabase
      .from("pricing_plans")
      .select("id, name, category, slug, price_bdt, annual_price_bdt, subtitle, is_highlighted, features")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setPlans((data as PlanRow[]) || []);
        setLoading(false);
      });
  }, []);

  const getPlanDuration = useCallback((planId: string) => planDurations[planId] || BILLING_DURATIONS[0], [planDurations]);
  const setPlanDuration = useCallback((planId: string, d: BillingDuration) => {
    setPlanDurations((prev) => ({ ...prev, [planId]: d }));
  }, []);

  const grouped = categories.map((cat) => {
    const catPlans = plans.filter((p) => p.category === cat.key);
    const startingPrice = catPlans.length > 0
      ? catPlans.reduce((min, p) => (p.price_bdt < min ? p.price_bdt : min), catPlans[0].price_bdt)
      : null;
    return { ...cat, plans: catPlans, startingPrice };
  }).filter((cat) => cat.plans.length > 0);

  const handleFilterClick = useCallback((key: string) => {
    setActiveFilter(key);
    document.getElementById(`cat-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Track active section
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  useEffect(() => {
    if (grouped.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveFilter(entry.target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [grouped.length]);

  // Set all plans in a category to same duration
  const setCategoryDuration = useCallback((catKey: string, d: BillingDuration) => {
    const catPlans = plans.filter((p) => p.category === catKey);
    setPlanDurations((prev) => {
      const updated = { ...prev };
      catPlans.forEach((p) => { updated[p.id] = d; });
      return updated;
    });
  }, [plans]);

  const globalFeatures = [
    { icon: Zap, label: bn ? "LiteSpeed ওয়েব সার্ভার" : "LiteSpeed Web Server" },
    { icon: Shield, label: bn ? "ফ্রি SSL সার্টিফিকেট" : "Free SSL Certificate" },
    { icon: Clock, label: bn ? "৯৯.৯% আপটাইম গ্যারান্টি" : "99.9% Uptime Guarantee" },
    { icon: Headphones, label: bn ? "২৪/৭ সাপোর্ট" : "24/7 Expert Support" },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title={bn ? "হোস্টিং প্ল্যান - Yess Host" : "Hosting Plans - Yess Host"}
        description="Compare all hosting plans from Yess Host. Web hosting, VPS, reseller, dedicated servers, email hosting & SSL certificates starting from ৳99/mo."
        canonical="/hosting-plans"
      />

      <div className="pt-20 lg:pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              {bn ? "সকল প্ল্যান" : "All Plans"}
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "আপনার জন্য সেরা হোস্টিং প্ল্যান" : "The Perfect Hosting Plan for You"}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              {bn
                ? "১ মাস থেকে ১০ বছর পর্যন্ত — আপনার প্রয়োজন অনুযায়ী মেয়াদ ও প্ল্যান বেছে নিন।"
                : "From 1 month to 10 years — choose the perfect duration and plan for your needs."}
            </p>
          </motion.div>
        </section>

        {/* Global Features Bar */}
        <section className="container mx-auto px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto"
          >
            {globalFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-card border border-border rounded-xl p-3.5 text-center justify-center">
                <f.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Sticky Category Filter */}
        {!loading && grouped.length > 0 && (
          <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-xs">
            <div className="container mx-auto px-4">
              <div className="flex overflow-x-auto gap-1.5 py-2.5 max-w-5xl mx-auto no-scrollbar justify-start md:justify-center">
                {grouped.map((cat) => {
                  const label = categoryLabels[cat.key];
                  const Icon = cat.icon;
                  const isActive = activeFilter === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleFilterClick(cat.key)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                        isActive
                          ? "gradient-primary text-primary-foreground shadow-xs shadow-primary/20"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "" : cat.colorClass}`} />
                      {bn ? label.bn : label.en}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        {cat.plans.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Category Sections */}
        <section className="container mx-auto px-4 space-y-10 max-w-6xl mt-8">
          {grouped.map((cat, idx) => {
            const label = categoryLabels[cat.key];
            const Icon = cat.icon;

            return (
              <motion.div
                id={`cat-${cat.key}`}
                key={cat.key}
                ref={(el) => { if (el) sectionRefs.current.set(cat.key, el); }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease }}
                className="bg-card border border-border rounded-2xl overflow-hidden scroll-mt-32"
              >
                {/* Category Header */}
                <div className="p-5 md:p-6 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${cat.bgClass} ${cat.colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{bn ? label.bn : label.en}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{bn ? label.descBn : label.descEn}</p>
                      </div>
                    </div>
                    {cat.startingPrice && (
                      <span className="text-sm text-muted-foreground">
                        {bn ? "শুরু" : "From"}{" "}
                        <span className="font-bold text-foreground">{formatPrice(cat.startingPrice, lang)}</span>
                        <span className="text-xs">/{bn ? "মাস" : "mo"}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Duration Shortcuts for whole category */}
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {bn ? "সবগুলোর মেয়াদ:" : "Set all to:"}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {[
                          BILLING_DURATIONS[0],  // 1m
                          BILLING_DURATIONS[3],  // 6m
                          BILLING_DURATIONS[4],  // 1y
                          BILLING_DURATIONS[6],  // 3y
                          BILLING_DURATIONS[8],  // 5y
                        ].map((d) => (
                          <button
                            key={d.key}
                            onClick={() => setCategoryDuration(cat.key, d)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-border bg-secondary/40 text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                          >
                            {bn ? d.shortBn : d.shortEn}
                            {d.discount > 0 && (
                              <span className="ml-1 text-primary">-{d.discount}%</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        duration={getPlanDuration(plan.id)}
                        onDurationChange={(d) => setPlanDuration(plan.id, d)}
                        bn={bn}
                        lang={lang}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease }}
            className="max-w-3xl mx-auto text-center bg-card border border-border rounded-2xl p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              {bn ? "কোন প্ল্যান আপনার জন্য সেরা?" : "Not Sure Which Plan to Choose?"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {bn
                ? "আমাদের এক্সপার্ট টিম আপনাকে সঠিক প্ল্যান বেছে নিতে সাহায্য করবে।"
                : "Our expert team will help you choose the right plan for your needs."}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              {bn ? "আমাদের সাথে কথা বলুন" : "Talk to Our Team"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default HostingPlans;
