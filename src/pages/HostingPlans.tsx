import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Server, Globe, HardDrive, Shield, Mail, Layers, ArrowRight, Check, Star, Zap, Clock, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { formatPrice } from "@/lib/formatPrice";

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

// Category definitions with icons and routes
const categories = [
  { key: "web", icon: Server, colorClass: "bg-blue-500/10 text-blue-600", slugs: ["basic-hosting", "pro-hosting", "premium-hosting", "bdix-hosting"] },
  { key: "vps", icon: HardDrive, colorClass: "bg-violet-500/10 text-violet-600", slugs: ["usa-vps", "bdix-vps"] },
  { key: "reseller", icon: Layers, colorClass: "bg-emerald-500/10 text-emerald-600", slugs: ["linux-reseller", "bdix-reseller"] },
  { key: "dedicated", icon: Shield, colorClass: "bg-amber-500/10 text-amber-600", slugs: ["usa-dedicated", "bd-dedicated", "singapore-dedicated"] },
  { key: "email", icon: Mail, colorClass: "bg-pink-500/10 text-pink-600", slugs: ["email-hosting"] },
  { key: "ssl", icon: Globe, colorClass: "bg-cyan-500/10 text-cyan-600", slugs: ["ssl"] },
];

const categoryLabels: Record<string, { bn: string; en: string; descBn: string; descEn: string }> = {
  web: { bn: "ওয়েব হোস্টিং", en: "Web Hosting", descBn: "ছোট থেকে বড় সব ওয়েবসাইটের জন্য দ্রুত ও নির্ভরযোগ্য হোস্টিং", descEn: "Fast & reliable hosting for websites of all sizes" },
  vps: { bn: "VPS সার্ভার", en: "VPS Server", descBn: "শক্তিশালী ভার্চুয়াল প্রাইভেট সার্ভার পূর্ণ রুট অ্যাক্সেস সহ", descEn: "Powerful virtual private servers with full root access" },
  reseller: { bn: "রিসেলার হোস্টিং", en: "Reseller Hosting", descBn: "নিজের হোস্টিং ব্যবসা শুরু করুন", descEn: "Start your own hosting business" },
  dedicated: { bn: "ডেডিকেটেড সার্ভার", en: "Dedicated Server", descBn: "সম্পূর্ণ ডেডিকেটেড হার্ডওয়্যার রিসোর্স", descEn: "Fully dedicated hardware resources" },
  email: { bn: "ইমেইল হোস্টিং", en: "Email Hosting", descBn: "প্রফেশনাল ইমেইল সার্ভিস আপনার ডোমেইনে", descEn: "Professional email service on your domain" },
  ssl: { bn: "SSL সার্টিফিকেট", en: "SSL Certificate", descBn: "আপনার ওয়েবসাইটকে সিকিউর করুন", descEn: "Secure your website with SSL" },
};

const HostingPlans = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Group plans by category
  const grouped = categories.map((cat) => {
    const catPlans = plans.filter((p) => p.category === cat.key);
    // Pick up to 3 highlighted or first plans to show as summary
    const highlighted = catPlans.filter((p) => p.is_highlighted);
    const display = highlighted.length > 0 ? highlighted.slice(0, 3) : catPlans.slice(0, 3);
    const startingPrice = catPlans.length > 0
      ? catPlans.reduce((min, p) => {
          const price = p.price_bdt;
          return price < min ? price : min;
        }, catPlans[0].price_bdt)
      : null;
    return { ...cat, plans: display, allPlans: catPlans, startingPrice };
  }).filter((cat) => cat.allPlans.length > 0);

  const features = [
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
                ? "ওয়েব হোস্টিং থেকে ডেডিকেটেড সার্ভার — আপনার প্রয়োজন অনুযায়ী সেরা প্ল্যানটি বেছে নিন।"
                : "From web hosting to dedicated servers — choose the best plan for your needs."}
            </p>
          </motion.div>
        </section>

        {/* Global Features Bar */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto"
          >
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-card border border-border rounded-xl p-3.5 text-center justify-center">
                <f.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Category Sections */}
        <section className="container mx-auto px-4 space-y-10 max-w-6xl">
          {grouped.map((cat, idx) => {
            const label = categoryLabels[cat.key];
            const Icon = cat.icon;
            // Determine the primary link for "View All"
            const primarySlug = cat.slugs[0];

            return (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                {/* Category Header */}
                <div className="p-5 md:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${cat.colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{bn ? label.bn : label.en}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{bn ? label.descBn : label.descEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cat.startingPrice && (
                      <span className="text-sm text-muted-foreground">
                        {bn ? "শুরু" : "From"}{" "}
                        <span className="font-bold text-foreground">{formatPrice(cat.startingPrice, lang)}</span>
                        <span className="text-xs">/{bn ? "মাস" : "mo"}</span>
                      </span>
                    )}
                    <Link
                      to={`/services/${primarySlug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                    >
                      {bn ? "সব প্ল্যান দেখুন" : "View All Plans"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.plans.map((plan, i) => {
                      const allFeatures = Array.isArray(plan.features) ? plan.features : [];
                      const includedFeatures = allFeatures.filter((f: any) => f.included !== false);
                      const excludedFeatures = allFeatures.filter((f: any) => f.included === false);

                      return (
                        <div
                          key={plan.id}
                          className={`relative rounded-xl border p-5 transition-all hover:shadow-md flex flex-col ${
                            plan.is_highlighted
                              ? "border-primary bg-primary/[0.02] shadow-sm"
                              : "border-border/70 hover:border-primary/20"
                          }`}
                        >
                          {plan.is_highlighted && (
                            <div className="absolute -top-0 right-3 flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-b-lg">
                              <Star className="w-2.5 h-2.5 fill-current" /> {bn ? "জনপ্রিয়" : "Popular"}
                            </div>
                          )}

                          <h3 className="text-sm font-bold text-foreground mb-1">{plan.name}</h3>
                          {plan.subtitle && (
                            <p className="text-[11px] text-muted-foreground mb-3">{plan.subtitle}</p>
                          )}

                          <div className="mb-4">
                            <span className="text-2xl font-extrabold text-foreground">{formatPrice(plan.price_bdt, lang)}</span>
                            <span className="text-xs text-muted-foreground">/{bn ? "মাস" : "mo"}</span>
                            {plan.annual_price_bdt && (
                              <p className="text-[11px] text-primary font-medium mt-1">
                                💰 {bn ? "বাৎসরিক" : "Yearly"}: {formatPrice(plan.annual_price_bdt, lang)}/{bn ? "বছর" : "yr"}
                              </p>
                            )}
                          </div>

                          {/* All included features */}
                          {includedFeatures.length > 0 && (
                            <ul className="space-y-1.5 mb-3 flex-1">
                              {includedFeatures.map((f: any, j: number) => (
                                <li key={j} className="flex items-center gap-2 text-xs text-foreground/80">
                                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  </div>
                                  <span>{bn ? (f.label_bn || f.label) : f.label}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Excluded / not-included features */}
                          {excludedFeatures.length > 0 && (
                            <ul className="space-y-1.5 mb-4 border-t border-border/50 pt-2">
                              {excludedFeatures.map((f: any, j: number) => (
                                <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground/60 line-through">
                                  <div className="w-4 h-4 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                                    <span className="text-[9px]">✕</span>
                                  </div>
                                  <span>{bn ? (f.label_bn || f.label) : f.label}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <Link
                            to={`/services/${plan.slug}`}
                            className={`block w-full text-center py-2.5 rounded-lg text-xs font-semibold transition-all mt-auto ${
                              plan.is_highlighted
                                ? "gradient-primary text-primary-foreground shadow-sm hover:opacity-90"
                                : "border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            {bn ? "এখনই অর্ডার করুন" : "Order Now"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show count if more plans exist */}
                  {cat.allPlans.length > 3 && (
                    <div className="text-center mt-4">
                      <Link
                        to={`/services/${primarySlug}`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {bn
                          ? `আরো ${cat.allPlans.length - cat.plans.length}টি প্ল্যান দেখুন →`
                          : `View ${cat.allPlans.length - cat.plans.length} more plans →`}
                      </Link>
                    </div>
                  )}
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
