import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";
import {
  Server, Shield, Globe, HardDrive, Zap, Clock,
  Headphones, Check, ArrowRight, Star, Award, TrendingUp, Lock,
  Monitor, ChevronDown, ShoppingCart
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { formatPrice } from "@/lib/formatPrice";
import { BILLING_DURATIONS, calcDurationPrice, toBengaliNum, type BillingDuration } from "@/lib/billingDurations";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_bdt: string;
  annual_price_bdt: string | null;
  subtitle: string | null;
  is_highlighted: boolean | null;
  features: any;
}

const features = [
  { icon: Monitor, titleEn: "WHM & cPanel", titleBn: "WHM ও cPanel", descEn: "Full WHM root access with cPanel for every client account", descBn: "প্রতিটি ক্লায়েন্ট অ্যাকাউন্টের জন্য সম্পূর্ণ WHM রুট অ্যাক্সেস ও cPanel" },
  { icon: Globe, titleEn: "White Label DNS", titleBn: "হোয়াইট লেবেল DNS", descEn: "Use your own nameservers and brand identity", descBn: "নিজের নেমসার্ভার ও ব্র্যান্ড আইডেন্টিটি ব্যবহার করুন" },
  { icon: Zap, titleEn: "LiteSpeed Web Server", titleBn: "LiteSpeed ওয়েব সার্ভার", descEn: "Enterprise-grade LiteSpeed for blazing fast performance", descBn: "অতি দ্রুত পারফরম্যান্সের জন্য এন্টারপ্রাইজ-গ্রেড LiteSpeed" },
  { icon: Shield, titleEn: "Free SSL Certificates", titleBn: "ফ্রি SSL সার্টিফিকেট", descEn: "AutoSSL for all hosted domains at no extra cost", descBn: "সমস্ত হোস্টেড ডোমেইনের জন্য বিনামূল্যে AutoSSL" },
  { icon: HardDrive, titleEn: "SSD/NVMe Storage", titleBn: "SSD/NVMe স্টোরেজ", descEn: "High-speed SSD or NVMe storage for optimal I/O", descBn: "সর্বোত্তম I/O-র জন্য হাই-স্পিড SSD বা NVMe স্টোরেজ" },
  { icon: Clock, titleEn: "Daily Remote Backups", titleBn: "ডেইলি রিমোট ব্যাকআপ", descEn: "Automated daily backups stored on remote servers", descBn: "রিমোট সার্ভারে সঞ্চিত স্বয়ংক্রিয় দৈনিক ব্যাকআপ" },
  { icon: Lock, titleEn: "DDoS Protection", titleBn: "DDoS প্রটেকশন", descEn: "Enterprise-level DDoS mitigation included", descBn: "এন্টারপ্রাইজ-লেভেল DDoS মিটিগেশন অন্তর্ভুক্ত" },
  { icon: Headphones, titleEn: "24/7 Priority Support", titleBn: "২৪/৭ অগ্রাধিকার সাপোর্ট", descEn: "Dedicated technical support for reseller partners", descBn: "রিসেলার পার্টনারদের জন্য নিবেদিত টেকনিক্যাল সাপোর্ট" },
];

const steps = [
  { num: "১", numEn: "1", titleEn: "Choose a Plan", titleBn: "প্ল্যান বেছে নিন", descEn: "Select the reseller package that fits your business needs", descBn: "আপনার ব্যবসার প্রয়োজন অনুযায়ী রিসেলার প্যাকেজ নির্বাচন করুন" },
  { num: "২", numEn: "2", titleEn: "Set Up Your Brand", titleBn: "আপনার ব্র্যান্ড সেটআপ করুন", descEn: "Configure WHM, set nameservers, and customize your hosting brand", descBn: "WHM কনফিগার করুন, নেমসার্ভার সেট করুন, এবং আপনার ব্র্যান্ড কাস্টমাইজ করুন" },
  { num: "৩", numEn: "3", titleEn: "Start Selling", titleBn: "বিক্রি শুরু করুন", descEn: "Create cPanel accounts for your clients and grow your business", descBn: "আপনার ক্লায়েন্টদের জন্য cPanel অ্যাকাউন্ট তৈরি করুন এবং ব্যবসা বড় করুন" },
];

const faqs = [
  { qEn: "What is Reseller Hosting?", qBn: "রিসেলার হোস্টিং কী?", aEn: "Reseller hosting allows you to purchase hosting resources in bulk and redistribute them to your own clients under your own brand. You get a WHM panel to manage individual cPanel accounts.", aBn: "রিসেলার হোস্টিং আপনাকে হোস্টিং রিসোর্স বাল্কে কিনে নিজের ব্র্যান্ডে ক্লায়েন্টদের মধ্যে বিতরণ করতে দেয়। আপনি একটি WHM প্যানেল পাবেন যেখান থেকে ক্লায়েন্টদের cPanel অ্যাকাউন্ট ম্যানেজ করতে পারবেন।" },
  { qEn: "Can I use my own branding?", qBn: "আমি কি নিজের ব্র্যান্ডিং ব্যবহার করতে পারি?", aEn: "Yes! With white-label DNS and custom nameservers, your clients will see your brand, not ours. You can fully customize the cPanel experience.", aBn: "হ্যাঁ! হোয়াইট-লেবেল DNS ও কাস্টম নেমসার্ভারের মাধ্যমে আপনার ক্লায়েন্টরা আপনার ব্র্যান্ড দেখবে। আপনি cPanel অভিজ্ঞতা পুরোপুরি কাস্টমাইজ করতে পারবেন।" },
  { qEn: "Do I need technical knowledge?", qBn: "আমার কি টেকনিক্যাল জ্ঞান দরকার?", aEn: "Basic knowledge of web hosting is helpful, but our WHM panel and 24/7 support make it easy for anyone to get started.", aBn: "ওয়েব হোস্টিং সম্পর্কে প্রাথমিক জ্ঞান সহায়ক, তবে আমাদের WHM প্যানেল এবং ২৪/৭ সাপোর্ট যে কাউকে সহজে শুরু করতে সাহায্য করবে।" },
  { qEn: "Can I upgrade my plan later?", qBn: "পরে কি প্ল্যান আপগ্রেড করা যাবে?", aEn: "Absolutely! You can upgrade your reseller plan anytime to accommodate more clients and resources.", aBn: "অবশ্যই! আরও ক্লায়েন্ট ও রিসোর্সের জন্য যেকোনো সময় প্ল্যান আপগ্রেড করতে পারবেন।" },
];

const normalizeFeature = (f: any) => {
  if (typeof f === "string") return { label: f, included: true };
  return { label: f.label || f, label_bn: f.label_bn, included: f.included !== false };
};

const ResellerHosting = () => {
  const { lang } = useLanguage();
  const { addItem } = useCart();
  const bn = lang === "bn";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(BILLING_DURATIONS[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("pricing_plans").select("*").eq("category", "reseller").eq("is_active", true).order("sort_order")
      .then(({ data }) => { setPlans((data || []) as Plan[]); setLoading(false); });
  }, []);

  const handleAddToCart = (plan: Plan) => {
    const price = calcDurationPrice(plan.price_bdt, plan.annual_price_bdt, duration);
    addItem({ id: `hosting-${plan.id}-${duration.key}`, name: plan.name, type: "hosting", price_bdt: String(price), billing_cycle: duration.key, plan_id: plan.slug, category: "reseller" });
  };

  return (
    <PublicLayout>
      <SEOHead
        title={bn ? "রিসেলার হোস্টিং - Yess Host" : "Reseller Hosting - Yess Host"}
        description={bn ? "নিজের হোস্টিং ব্যবসা শুরু করুন। WHM/cPanel, হোয়াইট লেবেল ব্র্যান্ডিং, LiteSpeed সার্ভার।" : "Start your own hosting business with WHM/cPanel, white-label branding, and LiteSpeed servers."}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Award className="w-3.5 h-3.5" />
              {bn ? "বাংলাদেশের সেরা রিসেলার হোস্টিং" : "Bangladesh's Best Reseller Hosting"}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4">
              {bn ? (
                <>নিজের <span className="text-primary">হোস্টিং ব্যবসা</span> শুরু করুন</>
              ) : (
                <>Start Your Own <span className="text-primary">Hosting Business</span></>
              )}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {bn
                ? "WHM/cPanel অ্যাক্সেস, হোয়াইট লেবেল ব্র্যান্ডিং এবং LiteSpeed সার্ভারের সাথে প্রফেশনাল রিসেলার হোস্টিং। কোনো বিনিয়োগ ছাড়াই নিজের হোস্টিং কোম্পানি চালান।"
                : "Professional reseller hosting with WHM/cPanel access, white-label branding, and LiteSpeed servers. Run your own hosting company with zero infrastructure investment."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#plans" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                {bn ? "প্ল্যান দেখুন" : "View Plans"} <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-secondary/50 transition-all">
                <Headphones className="w-4 h-4" /> {bn ? "পরামর্শ নিন" : "Get Consultation"}
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { value: bn ? "৯৯.৯%" : "99.9%", label: bn ? "আপটাইম গ্যারান্টি" : "Uptime Guarantee" },
              { value: bn ? "২৪/৭" : "24/7", label: bn ? "টেকনিক্যাল সাপোর্ট" : "Technical Support" },
              { value: bn ? "৫০০+" : "500+", label: bn ? "সক্রিয় রিসেলার" : "Active Resellers" },
              { value: bn ? "১০০%" : "100%", label: bn ? "হোয়াইট লেবেল" : "White Label" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {bn ? "কেন Yess Host রিসেলার হোস্টিং?" : "Why Yess Host Reseller Hosting?"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {bn ? "আপনার হোস্টিং ব্যবসা সফল করতে প্রয়োজনীয় সব টুল ও রিসোর্স" : "All the tools and resources you need to run a successful hosting business"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{bn ? f.titleBn : f.titleEn}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{bn ? f.descBn : f.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {bn ? "কিভাবে শুরু করবেন?" : "How It Works"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20">
                  {bn ? s.num : s.numEn}
                </div>
                {i < 2 && <div className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-px bg-border" />}
                <h3 className="text-sm font-bold text-foreground mb-1.5">{bn ? s.titleBn : s.titleEn}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{bn ? s.descBn : s.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PLANS ── */}
      <section id="plans" className="py-16 sm:py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {bn ? "রিসেলার হোস্টিং প্ল্যান" : "Reseller Hosting Plans"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
              {bn ? "আপনার প্রয়োজন অনুযায়ী সেরা প্ল্যান বেছে নিন" : "Choose the best plan for your needs"}
            </p>

            {/* Duration Selector */}
            {(() => {
              const mobileKeys = ["1m", "3m", "6m", "1y", "2y"];
              const mobileDurations = BILLING_DURATIONS.filter(d => mobileKeys.includes(d.key));
              return (
                <>
                  {/* Mobile: 5 popular options */}
                  <div className="flex items-center gap-1 p-1 bg-secondary/60 rounded-xl sm:hidden overflow-x-auto scrollbar-hide">
                    {mobileDurations.map(d => (
                      <button key={d.key} onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                          duration.key === d.key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {bn ? d.shortBn : d.shortEn}
                        {d.discount > 0 && <span className="ml-0.5 text-primary text-[9px]">-{d.discount}%</span>}
                      </button>
                    ))}
                  </div>
                  {/* Desktop: all options */}
                  <div className="hidden sm:inline-flex items-center gap-1 p-1 bg-secondary/60 rounded-xl flex-wrap justify-center">
                    {BILLING_DURATIONS.map(d => (
                      <button key={d.key} onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          duration.key === d.key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {bn ? d.labelBn : d.labelEn}
                        {d.discount > 0 && <span className="ml-1 text-primary text-[9px]">-{d.discount}%</span>}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, i) => {
                const price = calcDurationPrice(plan.price_bdt, plan.annual_price_bdt, duration);
                const planFeatures = Array.isArray(plan.features) ? plan.features.map(normalizeFeature) : [];

                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass-card rounded-2xl overflow-hidden transition-all hover:shadow-xl ${
                      plan.is_highlighted ? "border-primary/40 ring-1 ring-primary/20 relative" : ""
                    }`}>
                    {plan.is_highlighted && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
                    )}
                    <div className="p-5 sm:p-6">
                      {plan.is_highlighted && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mb-3">
                          <Star className="w-3 h-3" /> {bn ? "জনপ্রিয়" : "Popular"}
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      {plan.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>}
                      <div className="mt-4 mb-5">
                        <span className="text-3xl font-extrabold text-foreground">৳{formatPrice(String(price), bn ? "bn" : "en")}</span>
                        <span className="text-xs text-muted-foreground">/{bn ? duration.labelBn : duration.labelEn}</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {planFeatures.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-xs">
                            <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${f.included ? "text-primary" : "text-muted-foreground/30"}`} />
                            <span className={f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                              {bn && f.label_bn ? f.label_bn : f.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleAddToCart(plan)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          plan.is_highlighted
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                            : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                        }`}>
                        <ShoppingCart className="w-4 h-4" />
                        {bn ? "অর্ডার করুন" : "Order Now"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {bn ? "সাধারণ জিজ্ঞাসা" : "Frequently Asked Questions"}
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left">
                  <span className="text-sm font-semibold text-foreground">{bn ? faq.qBn : faq.qEn}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{bn ? faq.aBn : faq.aEn}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {bn ? "আজই আপনার হোস্টিং ব্যবসা শুরু করুন" : "Start Your Hosting Business Today"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
              {bn
                ? "শূন্য পুঁজিতে হোস্টিং ব্যবসা শুরু করুন। আমরা সার্ভার, সাপোর্ট ও ইনফ্রাস্ট্রাকচার সব দিচ্ছি।"
                : "Start a hosting business with zero capital. We provide the servers, support, and infrastructure."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#plans" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                {bn ? "এখনই শুরু করুন" : "Get Started Now"} <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-secondary/50 transition-all">
                <Headphones className="w-4 h-4" /> {bn ? "যোগাযোগ করুন" : "Contact Us"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ResellerHosting;
