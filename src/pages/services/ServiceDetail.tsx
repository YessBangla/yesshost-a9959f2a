import { useParams, Link } from "@/lib/router-compat";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, ArrowLeft, Star, Server, Globe, Shield, Zap, Clock,
  Headphones, ShoppingCart, ChevronDown, ArrowRight,
  Phone, MessageCircle, Plus, Minus
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { formatPrice } from "@/lib/formatPrice";
import { BILLING_DURATIONS, calcDurationPrice, toBengaliNum, type BillingDuration } from "@/lib/billingDurations";

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const iconMap: Record<string, typeof Server> = { Server, Globe, Shield, Zap, Clock, Headphones };

const normalizeFeature = (f: any): string => {
  if (typeof f === "string") return f;
  return f.label || String(f);
};

/* ─── Plan Card ─── */
const PlanCard = ({ plan, i, title, slug, isBn, addItem, isInCart }: any) => {
  const [duration, setDuration] = useState<BillingDuration>(BILLING_DURATIONS[0]);
  const [durationOpen, setDurationOpen] = useState(false);
  const rawFeatures = Array.isArray(plan.features) ? plan.features : [];
  const features = rawFeatures.map(normalizeFeature);
  
  const totalPrice = calcDurationPrice(plan.price_bdt, plan.annual_price_bdt, duration);
  const durationLabel = isBn ? duration.labelBn : duration.labelEn;
  const cartId = `hosting-${plan.id}-${duration.key}`;
  const inCart = isInCart(cartId);

  const handleAdd = () => {
    addItem({
      id: cartId,
      type: "hosting",
      name: plan.name,
      description: `${title} • ${durationLabel}`,
      price_bdt: totalPrice.toString(),
      plan_id: plan.id,
      billing_cycle: duration.key,
      category: slug || "",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease, delay: i * 0.08 }}
      className={`relative bg-card border rounded-xl flex flex-col transition-all duration-200 ${
        plan.is_highlighted
          ? "border-primary shadow-md shadow-primary/10 scale-[1.02] z-10"
          : "border-border hover:border-primary/20 hover:shadow-xs"
      }`}
    >
      {plan.is_highlighted && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-xl" />
          <div className="absolute -top-0 right-4 flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-b-lg">
            <Star className="w-3 h-3 fill-current" /> {isBn ? "জনপ্রিয়" : "Popular"}
          </div>
        </>
      )}

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
        {plan.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>}

        {/* Duration Selector */}
        <div className="relative mt-3">
          <button
            onClick={() => setDurationOpen(!durationOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/40 text-sm font-semibold text-foreground hover:border-primary/40 transition-all"
          >
            <span>{durationLabel}</span>
            <div className="flex items-center gap-1.5">
              {duration.discount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">-{duration.discount}%</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${durationOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          <AnimatePresence>
            {durationOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-56 overflow-y-auto"
              >
                {BILLING_DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => { setDuration(d); setDurationOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all ${
                      duration.key === d.key ? "bg-primary/5 text-primary font-bold" : "text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <span>{isBn ? d.labelBn : d.labelEn}</span>
                    <div className="flex items-center gap-1.5">
                      {d.discount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                          {isBn ? `${toBengaliNum(d.discount)}%` : `${d.discount}%`}
                        </span>
                      )}
                      {duration.key === d.key && <Check className="w-3 h-3 text-primary" />}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 my-4">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${plan.id}-${duration.key}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="text-3xl md:text-4xl font-extrabold tabular-nums text-foreground"
            >
              ৳{isBn ? toBengaliNum(totalPrice) : totalPrice.toLocaleString()}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-muted-foreground">/{durationLabel}</span>
        </div>

        {duration.discount > 0 && (
          <p className="text-xs text-primary font-medium mb-3 px-2.5 py-1 rounded-md bg-primary/5 inline-block w-fit">
            🎉 {isBn ? `${toBengaliNum(duration.discount)}% ছাড়!` : `${duration.discount}% off!`}
          </p>
        )}
        {duration.months > 1 && (
          <p className="text-xs text-muted-foreground mb-3">
            ≈ ৳{isBn ? toBengaliNum(Math.round(totalPrice / duration.months)) : Math.round(totalPrice / duration.months).toLocaleString()}/{isBn ? "মাস" : "mo"}
          </p>
        )}

        <ul className="space-y-2 mb-6 flex-1">
          {features.map((f: string) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {inCart ? (
          <div className="w-full py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 bg-primary/5 text-primary border border-primary/20">
            <Check className="w-4 h-4" />
            {isBn ? "কার্টে আছে" : "In Cart"}
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              plan.is_highlighted
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {isBn ? "কার্টে যোগ করুন" : "Add to Cart"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Feature Comparison Table ─── */
const ComparisonTable = ({ plans, isBn }: { plans: any[]; isBn: boolean }) => {
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    plans.forEach(p => {
      const features = Array.isArray(p.features) ? p.features : [];
      features.forEach((f: any) => featureSet.add(normalizeFeature(f)));
    });
    return Array.from(featureSet);
  }, [plans]);

  if (plans.length === 0 || allFeatures.length === 0) return null;

  // Helper to check if a plan has a feature
  const planHasFeature = (p: any, feature: string) => {
    const features = Array.isArray(p.features) ? p.features.map(normalizeFeature) : [];
    return features.includes(feature);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground uppercase tracking-wider">
                {isBn ? "ফিচার" : "Feature"}
              </th>
              {plans.map(p => (
                <th key={p.id} className="text-center px-3 py-3.5">
                  <span className={`text-sm font-bold ${p.is_highlighted ? "text-primary" : "text-foreground"}`}>{p.name}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">৳{p.price_bdt}/{isBn ? "মাস" : "mo"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature, idx) => (
              <tr key={feature} className={`border-b border-border/50 last:border-0 ${idx % 2 !== 0 ? "bg-secondary/20" : ""}`}>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{feature}</td>
                {plans.map(p => {
                  const has = planHasFeature(p, feature);
                  return (
                    <td key={p.id} className="text-center px-3 py-3">
                      {has ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-3.5 h-3.5 text-muted-foreground/25 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

/* ─── Main Page ─── */
const ServiceDetail = () => {
  const { slug } = useParams();
  const { lang, tr } = useLanguage();
  const isBn = lang === "bn";
  const { addItem, isInCart } = useCart();

  const [plans, setPlans] = useState<any[]>([]);
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const [serviceFaqs, setServiceFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      supabase.from("pricing_plans").select("*").eq("slug", slug).eq("is_active", true).order("sort_order"),
      supabase.from("site_content").select("*").eq("page", "services").eq("section_key", slug).eq("is_active", true).maybeSingle(),
      supabase.from("faqs").select("*").eq("category", slug).eq("is_active", true).order("sort_order"),
    ]).then(([plansRes, infoRes, faqsRes]) => {
      setPlans(plansRes.data || []);
      setServiceInfo(infoRes.data);
      setServiceFaqs(faqsRes.data || []);
      setLoading(false);
    });
  }, [slug]);

  const title = serviceInfo ? (isBn ? serviceInfo.title_bn : serviceInfo.title_en) : slug;
  const description = serviceInfo ? (isBn ? serviceInfo.content_bn : serviceInfo.content_en) : "";
  const ServiceIcon = serviceInfo?.metadata?.icon ? (iconMap[serviceInfo.metadata.icon] || Globe) : Globe;

  const highlights = useMemo(() => {
    if (!serviceInfo?.metadata?.highlights) return [];
    return serviceInfo.metadata.highlights.map((h: any) => ({
      icon: iconMap[h.icon] || Zap,
      label: isBn ? h.label_bn : h.label_en,
    }));
  }, [serviceInfo, isBn]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!serviceInfo && plans.length === 0) {
    return (
      <PublicLayout>
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{isBn ? "পেইজ পাওয়া যায়নি" : "Page Not Found"}</h1>
          <Link to="/" className="text-primary hover:underline text-sm">{isBn ? "হোমপেইজে ফিরুন" : "Go Home"}</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead
        title={`${title} - Yess Host`}
        description={description || `${title} - Enterprise-grade hosting solution from Yess Host Bangladesh.`}
        canonical={`/services/${slug}`}
      />

      {/* ─── Hero Banner ─── */}
      <section className="relative pt-16 lg:pt-20 pb-12 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="text-center max-w-3xl mx-auto"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {isBn ? "হোমপেইজ" : "Home"}
            </Link>

            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/15">
                <ServiceIcon className="w-7 h-7 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {title}
            </h1>

            {description && (
              <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                {description}
              </p>
            )}
          </motion.div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-8"
            >
              {highlights.map((h: any, i: number) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-3 text-center hover:border-primary/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mx-auto mb-1.5">
                    <h.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{h.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Pricing Plans ─── */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease }}
            className="text-center mb-10"
          >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
              {isBn ? "প্ল্যান বেছে নিন" : "Choose Your Plan"}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold tracking-tight mb-2">
              {isBn ? "আপনার জন্য পারফেক্ট প্ল্যান" : "The Perfect Plan for You"}
            </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              {isBn
                ? "সকল প্ল্যানে ফ্রি SSL, ডেইলি ব্যাকআপ ও ২৪/৭ সাপোর্ট"
                : "All plans include free SSL, daily backups & 24/7 support"}
            </p>
          </motion.div>

          <div className={`grid gap-4 max-w-5xl mx-auto ${
            plans.length === 1 ? "grid-cols-1 max-w-md" :
            plans.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl" :
            plans.length >= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
            "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          }`}>
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                i={i}
                title={title}
                slug={slug}
                isBn={isBn}
                addItem={addItem}
                isInCart={isInCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Comparison Toggle ─── */}
      {plans.length > 1 && (
        <section className="pb-12 container mx-auto px-4">
          <div className="text-center mb-6">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-card border border-border text-sm font-semibold text-foreground hover:border-primary/20 transition-all"
            >
              {isBn ? "ফিচার তুলনা করুন" : "Compare Features"}
              <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${showComparison ? "rotate-180" : ""}`} />
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{ height: showComparison ? "auto" : 0, opacity: showComparison ? 1 : 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ComparisonTable plans={plans} isBn={isBn} />
          </motion.div>
        </section>
      )}

      {/* ─── Why Choose This Service ─── */}
      <section className="py-10 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease }}
            className="text-center mb-10"
          >
            <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight mb-2">
              {isBn ? "কেন আমাদের বেছে নেবেন?" : "Why Choose Us?"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Zap, titleBn: "লাইটনিং ফাস্ট", titleEn: "Lightning Fast", descBn: "NVMe SSD স্টোরেজ ও LiteSpeed সার্ভারের মাধ্যমে সর্বোচ্চ স্পিড।", descEn: "Maximum speed with NVMe SSD storage and LiteSpeed servers." },
              { icon: Shield, titleBn: "এন্টারপ্রাইজ সিকিউরিটি", titleEn: "Enterprise Security", descBn: "ফ্রি SSL, DDoS প্রোটেকশন ও ম্যালওয়্যার স্ক্যানিং।", descEn: "Free SSL, DDoS protection, and malware scanning." },
              { icon: Headphones, titleBn: "২৪/৭ সাপোর্ট", titleEn: "24/7 Support", descBn: "যেকোনো সমস্যায় আমাদের টিম সবসময় প্রস্তুত।", descEn: "Our team is always ready to help." },
              { icon: Clock, titleBn: "৯৯.৯% আপটাইম", titleEn: "99.9% Uptime", descBn: "গ্লোবাল ডেটা সেন্টার ও রিডান্ড্যান্ট ইনফ্রাস্ট্রাকচার।", descEn: "Global data centers and redundant infrastructure." },
              { icon: Globe, titleBn: "ফ্রি মাইগ্রেশন", titleEn: "Free Migration", descBn: "আমরা আপনার ওয়েবসাইট ফ্রিতে ট্রান্সফার করে দেব।", descEn: "We transfer your website for free." },
              { icon: Star, titleBn: "মানিব্যাক গ্যারান্টি", titleEn: "Money Back Guarantee", descBn: "৩০ দিনের মধ্যে সন্তুষ্ট না হলে পূর্ণ রিফান্ড।", descEn: "Full refund within 30 days." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, ease, delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 hover:shadow-xs transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">{isBn ? item.titleBn : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isBn ? item.descBn : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Service FAQ ─── */}
      {serviceFaqs.length > 0 && (
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease }}
              className="text-center mb-10"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                FAQ
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight mb-2">
                {isBn ? "সচরাচর জিজ্ঞাসা" : "Frequently Asked Questions"}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
                {isBn ? `${title} সম্পর্কে সাধারণ প্রশ্নোত্তর` : `Common questions about ${title}`}
              </p>
            </motion.div>

            <div className="max-w-2xl mx-auto space-y-2">
              {serviceFaqs.map((faq, i) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, ease, delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <span className="text-base font-semibold text-foreground pr-4">
                      {isBn ? faq.question_bn : faq.question_en}
                    </span>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      openFaq === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                      {openFaq === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {isBn ? faq.answer_bn : faq.answer_en}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Banner ─── */}
      <section className="pb-12 md:pb-16 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-2xl bg-primary p-8 sm:p-10 md:p-14 text-center"
        >
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-primary-foreground/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-primary-foreground/5 blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold tracking-tight text-primary-foreground mb-3">
              {isBn ? "সঠিক প্ল্যান বুঝতে পারছেন না?" : "Not Sure Which Plan is Right?"}
            </h2>
            <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl mx-auto mb-6">
              {isBn
                ? "আমাদের এক্সপার্ট টিম আপনাকে সঠিক সলিউশন খুঁজে দিতে প্রস্তুত।"
                : "Our expert team is ready to help you find the right solution."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="tel:+8801805464343"
                className="flex items-center gap-2 bg-card text-foreground px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-card/90 transition-all shadow-md"
              >
                <Phone className="w-4 h-4" />
                {isBn ? "কল করুন" : "Call Us"}
              </a>
              <Link
                to="/contact"
                className="flex items-center gap-2 text-primary-foreground border border-primary-foreground/30 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-foreground/10 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                {isBn ? "লাইভ চ্যাট" : "Live Chat"}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </PublicLayout>
  );
};

export default ServiceDetail;
