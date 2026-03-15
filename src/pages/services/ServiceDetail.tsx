import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Check, X, ArrowLeft, Star, Server, Globe, Shield, Zap, Clock,
  Headphones, ShoppingCart, ChevronDown, Sparkles, ArrowRight,
  Phone, MessageCircle, Plus, Minus
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;
const iconMap: Record<string, typeof Server> = { Server, Globe, Shield, Zap, Clock, Headphones };

/* ─── Plan Card ─── */
const PlanCard = ({ plan, i, title, slug, isBn, tr, addItem, isInCart, totalPlans }: any) => {
  const [cycle, setCycle] = useState<"monthly" | "yearly">(plan.annual_price_bdt ? "yearly" : "monthly");
  const features = Array.isArray(plan.features) ? plan.features : [];
  const price = cycle === "yearly" && plan.annual_price_bdt ? plan.annual_price_bdt : plan.price_bdt;
  const cartId = `hosting-${plan.id}-${cycle}`;
  const inCart = isInCart(cartId);

  const handleAdd = () => {
    addItem({
      id: cartId,
      type: "hosting",
      name: plan.name,
      description: `${title} • ${cycle === "yearly" ? (isBn ? "বাৎসরিক" : "Yearly") : (isBn ? "মাসিক" : "Monthly")}`,
      price_bdt: price,
      plan_id: plan.id,
      billing_cycle: cycle,
      category: slug || "",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: brandCurve, delay: i * 0.12 }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className={`relative rounded-2xl overflow-hidden flex flex-col ${
        plan.is_highlighted
          ? "glass-card-elevated glow-border scale-[1.02] z-10"
          : "glass-card"
      }`}
    >
      {plan.is_highlighted && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1.5 gradient-primary" />
          <div className="absolute -top-0 right-4 flex items-center gap-1 px-4 py-2 gradient-primary text-primary-foreground text-xs font-bold rounded-b-xl shadow-lg shadow-primary/20">
            <Star className="w-3 h-3 fill-current" /> {isBn ? "সবচেয়ে জনপ্রিয়" : "Most Popular"}
          </div>
        </>
      )}

      <div className="p-6 sm:p-8 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
        {plan.subtitle && <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>}

        {/* Billing cycle toggle */}
        {plan.annual_price_bdt && (
          <div className="flex items-center gap-1 mt-4 p-1 rounded-xl bg-secondary/50 border border-border">
            <button
              onClick={() => setCycle("monthly")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                cycle === "monthly"
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isBn ? "মাসিক" : "Monthly"}
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                cycle === "yearly"
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isBn ? "বাৎসরিক" : "Yearly"}
              <span className="ml-1 text-[10px] opacity-80">💰</span>
            </button>
          </div>
        )}

        <div className="flex items-baseline gap-1 my-5">
          <span className="text-4xl md:text-5xl font-extrabold tabular-nums text-foreground">৳{price}</span>
          <span className="text-sm text-muted-foreground">
            {cycle === "yearly" ? (isBn ? "/বছর" : "/yr") : (isBn ? "/মাস" : "/mo")}
          </span>
        </div>

        {cycle === "monthly" && plan.annual_price_bdt && (
          <p className="text-xs text-primary font-medium mb-4 px-3 py-1.5 rounded-lg bg-primary/5 inline-block">
            💰 {isBn ? `বাৎসরিকে মাত্র ৳${plan.annual_price_bdt}` : `Only ৳${plan.annual_price_bdt} yearly`}
          </p>
        )}

        <ul className="space-y-3 mb-8 flex-1">
          {features.map((f: string) => (
            <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              {f}
            </li>
          ))}
        </ul>

        {inCart ? (
          <div className="w-full py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 bg-primary/5 text-primary border border-primary/20">
            <Check className="w-4 h-4" />
            {isBn ? "কার্টে যোগ হয়েছে" : "Added to Cart"}
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className={`w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              plan.is_highlighted
                ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 hover:shadow-xl hover:shadow-primary/30"
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
  // Collect all unique features across plans
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    plans.forEach(p => {
      const features = Array.isArray(p.features) ? p.features : [];
      features.forEach((f: string) => featureSet.add(f));
    });
    return Array.from(featureSet);
  }, [plans]);

  if (plans.length === 0 || allFeatures.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: brandCurve }}
      className="glass-card-elevated overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                {isBn ? "ফিচার" : "Feature"}
              </th>
              {plans.map(p => (
                <th key={p.id} className="text-center px-4 py-4">
                  <span className={`text-sm font-bold ${p.is_highlighted ? "text-primary" : "text-foreground"}`}>
                    {p.name}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">৳{p.price_bdt}/{isBn ? "মাস" : "mo"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature, idx) => (
              <tr
                key={feature}
                className={`border-b border-border/50 last:border-0 ${idx % 2 === 0 ? "" : "bg-secondary/10"}`}
              >
                <td className="px-6 py-3.5 text-sm text-muted-foreground">{feature}</td>
                {plans.map(p => {
                  const has = Array.isArray(p.features) && p.features.includes(feature);
                  return (
                    <td key={p.id} className="text-center px-4 py-3.5">
                      {has ? (
                        <Check className="w-5 h-5 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                      )}
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
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!serviceInfo && plans.length === 0) {
    return (
      <PublicLayout>
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{isBn ? "পেইজ পাওয়া যায়নি" : "Page Not Found"}</h1>
          <Link to="/" className="text-primary hover:underline">{isBn ? "হোমপেইজে ফিরুন" : "Go Home"}</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead
        title={`${title} - YessHost`}
        description={description || `${title} - Enterprise-grade hosting solution from YessHost Bangladesh.`}
        canonical={`/services/${slug}`}
      />

      {/* ─── Hero Banner ─── */}
      <section className="relative pt-20 lg:pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: brandCurve }}
            className="text-center max-w-3xl mx-auto"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors glass-card px-4 py-2 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" /> {isBn ? "হোমপেইজ" : "Home"}
            </Link>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              <div className="p-5 rounded-3xl bg-primary/10 backdrop-blur-sm border border-primary/20">
                <ServiceIcon className="w-12 h-12 text-primary" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: brandCurve, delay: 0.15 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight mb-5 text-foreground"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            >
              {description}
            </motion.p>
          </motion.div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-10"
            >
              {highlights.map((h: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                  className="glass-card p-4 text-center group hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                    <h.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{h.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Pricing Plans ─── */}
      <section className="py-16 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: brandCurve }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {isBn ? "প্ল্যান বেছে নিন" : "Choose Your Plan"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-3">
              {isBn ? "আপনার জন্য পারফেক্ট প্ল্যান" : "The Perfect Plan for You"}
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {isBn
                ? "সকল প্ল্যানে ফ্রি SSL, ডেইলি ব্যাকআপ এবং ২৪/৭ সাপোর্ট অন্তর্ভুক্ত"
                : "All plans include free SSL, daily backups, and 24/7 support"}
            </p>
          </motion.div>

          <div className={`grid gap-6 max-w-5xl mx-auto ${
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
                tr={tr}
                addItem={addItem}
                isInCart={isInCart}
                totalPlans={plans.length}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Comparison Toggle ─── */}
      {plans.length > 1 && (
        <section className="pb-16 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-card text-sm font-semibold text-foreground hover:border-primary/30 transition-all group"
            >
              {isBn ? "ফিচার তুলনা করুন" : "Compare Features"}
              <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${showComparison ? "rotate-180" : ""}`} />
            </button>
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              height: showComparison ? "auto" : 0,
              opacity: showComparison ? 1 : 0
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ComparisonTable plans={plans} isBn={isBn} />
          </motion.div>
        </section>
      )}

      {/* ─── Why Choose This Service ─── */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: brandCurve }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight mb-3">
              {isBn ? "কেন আমাদের বেছে নেবেন?" : "Why Choose Us?"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: Zap,
                titleBn: "লাইটনিং ফাস্ট",
                titleEn: "Lightning Fast",
                descBn: "NVMe SSD স্টোরেজ ও LiteSpeed সার্ভারের মাধ্যমে সর্বোচ্চ স্পিড নিশ্চিত করা হয়।",
                descEn: "Maximum speed guaranteed with NVMe SSD storage and LiteSpeed servers.",
              },
              {
                icon: Shield,
                titleBn: "এন্টারপ্রাইজ সিকিউরিটি",
                titleEn: "Enterprise Security",
                descBn: "ফ্রি SSL সার্টিফিকেট, DDoS প্রোটেকশন ও ম্যালওয়্যার স্ক্যানিং।",
                descEn: "Free SSL certificate, DDoS protection, and malware scanning.",
              },
              {
                icon: Headphones,
                titleBn: "২৪/৭ এক্সপার্ট সাপোর্ট",
                titleEn: "24/7 Expert Support",
                descBn: "যেকোনো সমস্যায় আমাদের বাংলাদেশি টিম সবসময় প্রস্তুত।",
                descEn: "Our Bangladeshi team is always ready to help with any issue.",
              },
              {
                icon: Clock,
                titleBn: "৯৯.৯% আপটাইম",
                titleEn: "99.9% Uptime",
                descBn: "গ্লোবাল ডেটা সেন্টার ও রিডান্ড্যান্ট ইনফ্রাস্ট্রাকচার।",
                descEn: "Global data centers and redundant infrastructure.",
              },
              {
                icon: Globe,
                titleBn: "ফ্রি মাইগ্রেশন",
                titleEn: "Free Migration",
                descBn: "আমরা আপনার ওয়েবসাইট ফ্রিতে ট্রান্সফার করে দেব।",
                descEn: "We will transfer your website for free.",
              },
              {
                icon: Star,
                titleBn: "মানিব্যাক গ্যারান্টি",
                titleEn: "Money Back Guarantee",
                descBn: "৩০ দিনের মধ্যে সন্তুষ্ট না হলে পূর্ণ রিফান্ড।",
                descEn: "Full refund within 30 days if not satisfied.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="glass-card p-6 group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{isBn ? item.titleBn : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isBn ? item.descBn : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="pb-16 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-primary p-8 sm:p-12 md:p-16 text-center"
        >
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight text-primary-foreground mb-4">
              {isBn ? "সঠিক প্ল্যান বুঝতে পারছেন না?" : "Not Sure Which Plan is Right?"}
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              {isBn
                ? "আমাদের এক্সপার্ট টিম আপনাকে সঠিক সলিউশন খুঁজে দিতে প্রস্তুত।"
                : "Our expert team is ready to help you find the right solution."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+8809638205205"
                className="flex items-center gap-2 bg-white text-foreground px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
              >
                <Phone className="w-5 h-5" />
                {isBn ? "কল করুন" : "Call Us"}
              </a>
              <Link
                to="/contact"
                className="flex items-center gap-2 text-primary-foreground border border-primary-foreground/30 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
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
