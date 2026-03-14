import { motion } from "framer-motion";
import { Check, Star, ArrowRight } from "lucide-react";
import { useState } from "react";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const plans = [
  {
    name: "Starter",
    subtitle: "পারসোনাল ওয়েবসাইটের জন্য",
    monthly: "৯৯৯",
    yearly: "৪,৯৯৯",
    save: "৪৫%",
    features: [
      "5 Hosted Domains",
      "10 GB NVMe SSD",
      "100 GB Bandwidth",
      "Free SSL Certificate",
      "cPanel Control Panel",
      "1-Click WordPress Install",
      "Daily Backups",
      "24/7 Support",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Business",
    subtitle: "গ্রোইং বিজনেসের জন্য",
    monthly: "২,৯৯৯",
    yearly: "১৪,৯৯৯",
    save: "৫৮%",
    features: [
      "30 Hosted Domains",
      "75 GB NVMe SSD",
      "Unlimited Bandwidth",
      "3 Free Domains",
      "Free SSL Certificate",
      "LiteSpeed Web Server",
      "Daily Backups",
      "Priority 24/7 Support",
    ],
    highlighted: true,
    cta: "Start Business",
  },
  {
    name: "Enterprise",
    subtitle: "এন্টারপ্রাইজ সলিউশন",
    monthly: "৬,৯৯৯",
    yearly: "২৯,৯৯৯",
    save: "৬৪%",
    features: [
      "Unlimited Domains",
      "200 GB NVMe SSD",
      "Unlimited Bandwidth",
      "6 Free Domains",
      "Free SSL Certificate",
      "Dedicated Resources",
      "Real-time Backups",
      "VIP 24/7 Support",
    ],
    highlighted: false,
    cta: "Go Enterprise",
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            Select Your Perfect Plan
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8">
            ট্রান্সপারেন্ট প্রাইসিং, কোনো হিডেন ফি নেই। যেকোনো সময় আপগ্রেড বা ডাউনগ্রেড করুন।
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl glass-card">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !isYearly ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                isYearly ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="text-[10px] bg-primary-foreground/20 px-2 py-0.5 rounded-full">Save up to 64%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-2xl overflow-hidden ${
                plan.highlighted ? "glass-card-elevated glow-border" : "glass-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
              )}
              {plan.highlighted && (
                <div className="absolute -top-0 right-4 flex items-center gap-1 px-3 py-1.5 gradient-primary text-primary-foreground text-xs font-bold rounded-b-lg">
                  <Star className="w-3 h-3 fill-current" /> Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.subtitle}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl md:text-5xl font-extrabold tabular-nums text-foreground">
                    ৳{isYearly ? plan.yearly : plan.monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">/{isYearly ? "year" : "mo"}</span>
                  {isYearly && (
                    <span className="ml-2 text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      Save {plan.save}
                    </span>
                  )}
                </div>

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

                <button
                  className={`w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                      : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
