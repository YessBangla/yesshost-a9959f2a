import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, ShoppingCart, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { BILLING_DURATIONS, calcDurationPrice, toBengaliNum, type BillingDuration } from "@/lib/billingDurations";

type Plan = {
  id?: string;
  name: string;
  price: string;
  annual?: string;
  subtitle?: string;
  features: string[];
  highlighted?: boolean;
  category?: string;
};

const staticPlans: Record<string, Plan[]> = {
  web: [
    { name: "PH 1GB Host", price: "১৩০", annual: "১,২০০", features: ["Host 2 Domain","1GB NVMe Storage","Unlimited Bandwidth","10 Sub Domain","10 Email Accounts","10 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","cPanel Control Panel"] },
    { name: "PRO 5GB Host", price: "২০০", annual: "২,২০০", features: ["Host 5 Domain","5GB NVMe Storage","Unlimited Bandwidth","30 Email Accounts","30 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","Singapore Location Server","cPanel Control Panel"], highlighted: true },
    { name: "Premium 5", price: "৫০০", annual: "৫,৫০০", features: ["10 Website Hosted","5GB NVMe Storage","Unlimited Bandwidth","20 Email Accounts","20 Sub Domain","Unlimited Databases","Ruby, Python, NodeJS","Free SSL Certificate","Shell (SSH) Access","cPanel Control Panel"] },
  ],
  reseller: [
    { name: "RH Linux 10", price: "১,৩০০", features: ["10 cPanel Accounts","10GB SSD Storage","Unlimited Bandwidth","cPanel / WHM Access","Daily Remote Backups","1-Click App Installs","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server"] },
    { name: "RH Linux 50", price: "৩,২৯৯", subtitle: "50% OFF — COUPON: RH50", features: ["50 cPanel Accounts","200GB SSD Storage","Unlimited Bandwidth","cPanel / WHM Access","Daily Remote Backups","1-Click App Installs","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server"], highlighted: true },
    { name: "BDIX RH 20", price: "১,৪৯৯", features: ["20 cPanel Accounts","20GB NVMe Storage","500 GB Bandwidth","cPanel / WHM Access","Daily Remote Backups","1-Click App Installs","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server"] },
  ],
  vps: [
    { name: "USA VPS", price: "৭৫০", features: ["1 CPU Core","2 GB RAM","25GB SSD Disk","1TB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"] },
    { name: "BDIX VPS", price: "৯৯৯", features: ["1 CPU Core","1 GB RAM","20GB NVMe Disk","500 GB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"], highlighted: true },
    { name: "Premium VPS", price: "২,৫০০", features: ["4 CPU Cores","8 GB RAM","100GB NVMe Disk","2TB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"] },
  ],
  dedicated: [
    { name: "DS-USA-1", price: "৮,৫০০", annual: "৯০,০০০", subtitle: "Intel Xeon E3-1230v5", features: ["4 Cores / 8 Threads","16GB DDR4 RAM","500GB SSD Storage","10TB Bandwidth","1Gbps Port","Full Root Access","cPanel/WHM Optional","Free Setup"] },
    { name: "DS-BD-2", price: "১৮,০০০", annual: "১,৯৫,০০০", subtitle: "Intel Xeon E5-2620v4", features: ["6 Cores / 12 Threads","32GB DDR4 RAM","1TB SSD Storage","BDIX Unlimited","1Gbps BDIX Port","Full Root Access","DDoS Protection","Free Setup"], highlighted: true },
    { name: "DS-SG-3", price: "৩৫,০০০", annual: "৩,৮০,০০০", subtitle: "Dual Xeon E5-2680v4", features: ["28 Cores / 56 Threads","64GB DDR4 RAM","2TB NVMe Storage","Unlimited Bandwidth","1Gbps Port","cPanel/WHM Included","DDoS Protection","IPMI Access"] },
  ],
  email: [
    { name: "Workspace 30GB", price: "৭৯৯", annual: "৮,৫০০", subtitle: "ছোট ব্যবসার জন্য", features: ["৫টি ইমেইল অ্যাকাউন্ট","30GB NVMe স্টোরেজ","CrossBox Suite Panel","250 Email/Hour","IMAP, SMTP, POP","SPAM Protection","কাস্টম ডোমেইন","24/7 সাপোর্ট"] },
    { name: "Workspace 100GB", price: "১,২৫০", annual: "১৩,০০০", subtitle: "গ্রোয়িং বিজনেস", features: ["১০টি ইমেইল অ্যাকাউন্ট","100GB NVMe স্টোরেজ","CrossBox Suite Panel","500 Email/Hour","IMAP, SMTP, POP","MailChannels SPAM Protection","অটো রিপ্লাই ও ফরওয়ার্ড","Priority সাপোর্ট"], highlighted: true },
    { name: "Workspace 250GB", price: "১,৭৯৯", annual: "১৮,৫০০", subtitle: "এন্টারপ্রাইজ", features: ["২৫টি ইমেইল অ্যাকাউন্ট","250GB NVMe স্টোরেজ","CrossBox Suite Panel","1000 Email/Hour","IMAP, SMTP, POP","MailChannels SPAM Protection","ক্যালেন্ডার ও কন্ট্যাক্ট সিঙ্ক","Priority সাপোর্ট"] },
  ],
};

/* ─── Duration Dropdown ─── */
const DurationDropdown = ({ selected, onChange, isBn }: { selected: BillingDuration; onChange: (d: BillingDuration) => void; isBn: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/40 text-sm font-semibold text-foreground hover:border-primary/40 transition-all"
      >
        <span>{isBn ? selected.labelBn : selected.labelEn}</span>
        <div className="flex items-center gap-1.5">
          {selected.discount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">-{selected.discount}%</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden max-h-56 overflow-y-auto"
          >
            {BILLING_DURATIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => { onChange(d); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all ${
                  selected.key === d.key ? "bg-primary/5 text-primary font-bold" : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <span>{isBn ? d.labelBn : d.labelEn}</span>
                <div className="flex items-center gap-1.5">
                  {d.discount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {isBn ? `${toBengaliNum(d.discount)}%` : `${d.discount}%`}
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

const PricingSection = () => {
  const [activeTab, setActiveTab] = useState("web");
  const { tr, lang } = useLanguage();
  const isBn = lang === "bn";
  const { addItem, isInCart } = useCart();
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [planDurations, setPlanDurations] = useState<Record<string, BillingDuration>>({});

  useEffect(() => {
    supabase.from("pricing_plans").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setDbPlans(data || []));
  }, []);

  const tabs = [
    { key: "web", label: tr("pricing.webHosting") },
    { key: "reseller", label: tr("pricing.resellerHosting") },
    { key: "vps", label: tr("pricing.vpsServer") },
    { key: "dedicated", label: isBn ? "ডেডিকেটেড সার্ভার" : "Dedicated Server" },
    { key: "email", label: tr("pricing.emailHosting") },
  ];

  const getPlans = (category: string): Plan[] => {
    const fromDb = dbPlans.filter(p => p.category === category);
    if (fromDb.length > 0) {
      return fromDb.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price_bdt,
        annual: p.annual_price_bdt || undefined,
        subtitle: p.subtitle || undefined,
        features: Array.isArray(p.features)
          ? p.features.map((f: any) => typeof f === "string" ? f : (isBn ? (f.label_bn || f.label) : f.label))
          : [],
        highlighted: p.is_highlighted,
        category,
      }));
    }
    return staticPlans[category] || [];
  };

  const currentPlans = getPlans(activeTab);

  const getDuration = (planKey: string) => planDurations[planKey] || BILLING_DURATIONS[0];
  const setDuration = (planKey: string, d: BillingDuration) => setPlanDurations(prev => ({ ...prev, [planKey]: d }));

  // Quick duration shortcuts
  const quickDurations = [
    BILLING_DURATIONS[0],  // 1m
    BILLING_DURATIONS[3],  // 6m
    BILLING_DURATIONS[4],  // 1y
    BILLING_DURATIONS[6],  // 3y
    BILLING_DURATIONS[8],  // 5y
  ];

  const setAllDurations = (d: BillingDuration) => {
    const updated: Record<string, BillingDuration> = {};
    currentPlans.forEach((p) => { updated[`${activeTab}-${p.name}`] = d; });
    setPlanDurations(prev => ({ ...prev, ...updated }));
  };

  return (
    <section id="pricing" className="py-10 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-3">
            Pricing
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {tr("pricing.title")}
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto mb-6">
            {tr("pricing.subtitle")}
          </p>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 p-1 rounded-xl bg-card border border-border mb-4 no-scrollbar max-w-fit mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.key
                    ? "gradient-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Duration Shortcuts */}
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <span className="text-xs text-muted-foreground">{isBn ? "মেয়াদ:" : "Duration:"}</span>
            {quickDurations.map((d) => (
              <button
                key={d.key}
                onClick={() => setAllDurations(d)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                {isBn ? d.shortBn : d.shortEn}
                {d.discount > 0 && <span className="ml-1 text-primary">-{d.discount}%</span>}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {currentPlans.map((plan, i) => {
            const planKey = `${activeTab}-${plan.name}`;
            const duration = getDuration(planKey);
            const totalPrice = calcDurationPrice(plan.price, plan.annual || null, duration);
            const cartId = plan.id ? `hosting-${plan.id}-${duration.key}` : "";
            const inCart = cartId ? isInCart(cartId) : false;
            const durationLabel = isBn ? duration.labelBn : duration.labelEn;

            return (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative rounded-xl overflow-hidden bg-card border ${
                  plan.highlighted ? "border-primary/30 shadow-md shadow-primary/5" : "border-border"
                } hover:border-primary/25 transition-all`}
              >
                {plan.highlighted && <div className="absolute top-0 left-0 right-0 h-0.5 gradient-primary" />}
                {plan.highlighted && (
                  <div className="absolute -top-0 right-3 flex items-center gap-1 px-2.5 py-1 gradient-primary text-primary-foreground text-xs font-bold rounded-b-lg">
                    <Star className="w-3 h-3 fill-current" /> {tr("pricing.popular")}
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
                  {plan.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>}

                  {/* Duration Selector per plan */}
                  <div className="mt-3">
                    <DurationDropdown
                      selected={duration}
                      onChange={(d) => setDuration(planKey, d)}
                      isBn={isBn}
                    />
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${planKey}-${duration.key}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground">
                            ৳{isBn ? toBengaliNum(totalPrice) : totalPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">/{durationLabel}</span>
                        </div>
                        {duration.discount > 0 && (
                          <p className="text-xs text-primary font-medium mt-1">
                            🎉 {isBn ? `${toBengaliNum(duration.discount)}% ছাড়!` : `${duration.discount}% off!`}
                          </p>
                        )}
                        {duration.months > 1 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ≈ ৳{isBn ? toBengaliNum(Math.round(totalPrice / duration.months)) : Math.round(totalPrice / duration.months).toLocaleString()}/{isBn ? "মাস" : "mo"}
                          </p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {inCart ? (
                    <div className="w-full py-2.5 font-semibold rounded-lg flex items-center justify-center gap-2 bg-secondary text-foreground border border-border text-sm">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      {isBn ? "কার্টে আছে" : "In Cart"}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (plan.id) {
                          addItem({
                            id: cartId,
                            type: "hosting",
                            name: plan.name,
                            description: `${plan.subtitle || plan.name} • ${durationLabel}`,
                            price_bdt: totalPrice.toString(),
                            plan_id: plan.id,
                            billing_cycle: duration.key,
                            category: plan.category || activeTab,
                          });
                        }
                      }}
                      className={`w-full py-2.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
                        plan.highlighted
                          ? "gradient-primary text-primary-foreground shadow-xs shadow-primary/15 hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {isBn ? "কার্টে যোগ করুন" : "Add to Cart"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
