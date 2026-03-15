import { motion } from "framer-motion";
import { Check, Star, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

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

// Static fallback plans
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
    { name: "Intel Xeon E3", price: "৮,৯০০", features: ["4 Cores 3.30 GHz","16GB DDR4 ECC","256GB SSD","1Gbps Port","1 IP Address","Full Root Access","Fully Managed","24/7 Customer Support"] },
    { name: "AMD Ryzen 5600X", price: "১১,৯০০", features: ["6 Cores 3.40 GHz","64GB DDR3 ECC","512GB NVMe PCIe 4.0","1Gbps Port","1 IP Address","Fully Managed Service","Powerful Hardware","24/7 Customer Support"], highlighted: true },
    { name: "Dual Xeon Gold", price: "২৪,৯০০", features: ["16 Cores 2.10 GHz","128GB DDR4 ECC","2x 1TB NVMe SSD","10Gbps Port","5 IP Addresses","Fully Managed Service","RAID Configuration","24/7 Priority Support"] },
  ],
  email: [
    { name: "Workspace 30GB", price: "৭৯৯", features: ["Up To 5 Email Accounts","30GB Mail Storage","CrossBox Suite Panel","250 Email Per Hour","IMAP, SMTP, POP Support","MailChannels SPAM Protection"] },
    { name: "Workspace 100GB", price: "১,২৫০", features: ["Up To 10 Email Accounts","100GB Mail Storage","CrossBox Suite Panel","250 Email Per Hour","IMAP, SMTP, POP Support","MailChannels SPAM Protection"], highlighted: true },
    { name: "Workspace 250GB", price: "১,৭৯৯", features: ["Up To 25 Email Accounts","250GB Mail Storage","CrossBox Suite Panel","250 Email Per Hour","IMAP, SMTP, POP Support","MailChannels SPAM Protection"] },
  ],
};

const PricingSection = () => {
  const [activeTab, setActiveTab] = useState("web");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { tr, lang } = useLanguage();
  const isBn = lang === "bn";
  const { addItem, isInCart } = useCart();
  const [dbPlans, setDbPlans] = useState<any[]>([]);

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

  // Use DB plans if available, else fallback
  const getPlans = (category: string): Plan[] => {
    const fromDb = dbPlans.filter(p => p.category === category);
    if (fromDb.length > 0) {
      return fromDb.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price_bdt,
        annual: p.annual_price_bdt || undefined,
        subtitle: p.subtitle || undefined,
        features: Array.isArray(p.features) ? p.features : [],
        highlighted: p.is_highlighted,
        category,
      }));
    }
    return staticPlans[category] || [];
  };

  const currentPlans = getPlans(activeTab);

  return (
    <section id="pricing" className="py-12 md:py-24 relative">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-3 md:mb-4">
            Pricing
          </span>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-2 md:mb-4">
            {tr("pricing.title")}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto mb-6 md:mb-8">
            {tr("pricing.subtitle")}
          </p>

          <div className="flex overflow-x-auto gap-1 p-1 rounded-xl glass-card mb-4 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.key
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl glass-card">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isBn ? "মাসিক" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === "yearly"
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isBn ? "বাৎসরিক" : "Yearly"}
              <span className="ml-1.5 text-xs opacity-80">{isBn ? "সেভ করুন" : "Save"}</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto">
          {currentPlans.map((plan, i) => (
            <motion.div
              key={`${activeTab}-${plan.name}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-2xl overflow-hidden ${
                plan.highlighted ? "glass-card-elevated glow-border" : "glass-card"
              }`}
            >
              {plan.highlighted && <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />}
              {plan.highlighted && (
                <div className="absolute -top-0 right-4 flex items-center gap-1 px-3 py-1.5 gradient-primary text-primary-foreground text-xs font-bold rounded-b-lg">
                  <Star className="w-3 h-3 fill-current" /> {tr("pricing.popular")}
                </div>
              )}

              <div className="p-4 sm:p-8">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
                {plan.subtitle && <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>}

                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tabular-nums text-foreground">
                    ৳{formatPrice(billingCycle === "yearly" && plan.annual ? plan.annual : plan.price, lang)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {billingCycle === "yearly" ? (isBn ? "/বছর" : "/yr") : tr("pricing.mo")}
                  </span>
                </div>

                {billingCycle === "monthly" && plan.annual && (
                  <p className="text-xs text-primary font-medium mb-4">
                    💰 {isBn ? `বাৎসরিকে ৳${formatPrice(plan.annual, lang)}` : `৳${formatPrice(plan.annual, lang)} if billed yearly`}
                  </p>
                )}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {(() => {
                  const cartId = plan.id ? `hosting-${plan.id}-${billingCycle}` : "";
                  const inCart = cartId ? isInCart(cartId) : false;
                  
                  if (inCart) {
                    return (
                      <div className="w-full py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 bg-secondary text-foreground border border-border">
                        <Check className="w-4 h-4 text-primary" />
                        {isBn ? "কার্টে আছে" : "In Cart"}
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      onClick={() => {
                        if (plan.id) {
                          const price = billingCycle === "yearly" && plan.annual ? plan.annual : plan.price;
                          addItem({
                            id: cartId,
                            type: "hosting",
                            name: plan.name,
                            description: `${plan.subtitle || plan.name} • ${billingCycle === "yearly" ? (isBn ? "বাৎসরিক" : "Yearly") : (isBn ? "মাসিক" : "Monthly")}`,
                            price_bdt: price,
                            plan_id: plan.id,
                            billing_cycle: billingCycle,
                            category: plan.category || activeTab,
                          });
                        }
                      }}
                      className={`w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        plan.highlighted
                          ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isBn ? "কার্টে যোগ করুন" : "Add to Cart"}
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
