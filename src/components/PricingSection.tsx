import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const plans = [
  {
    name: "Cloud Starter",
    subtitle: "Medium traffic personal sites",
    monthly: "১,৫৯৯",
    yearly: "৫,৯৯৯",
    features: [
      "10 Hosted Domains",
      "25 GB RAID 10 Storage",
      "200 GB Bandwidth",
      "1 Free Domain included",
      "Super Fast SSD Storage",
      "Free SSL Certificate",
      "99.95% Uptime",
      "24/7 Phone Support",
    ],
    highlighted: false,
  },
  {
    name: "Cloud Business",
    subtitle: "High traffic corporate sites",
    monthly: "৪,৯৯৯",
    yearly: "১৫,৯৯৯",
    features: [
      "30 Hosted Domains",
      "75 GB RAID 10 Storage",
      "700 GB Bandwidth",
      "3 Free Domain included",
      "Super Fast SSD Storage",
      "Free SSL Certificate",
      "99.95% Uptime",
      "24/7 Phone Support",
    ],
    highlighted: true,
  },
  {
    name: "Cloud Enterprise",
    subtitle: "Enterprise content management",
    monthly: "৬,৯৯৯",
    yearly: "২৫,৯৯৯",
    features: [
      "60 Hosted Domains",
      "175 GB RAID 10 Storage",
      "1500 GB Bandwidth",
      "6 Free Domain included",
      "Super Fast SSD Storage",
      "Free SSL Certificate",
      "99.95% Uptime",
      "24/7 Phone Support",
    ],
    highlighted: false,
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-[15vh] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-mono uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter mb-4">
            Managed Hosting Price
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8">
            Professional hosting at an affordable price. Transparent pricing, no hidden fees.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-secondary/60 rounded-full p-1 border border-border">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`p-6 rounded-[24px] border ${
                plan.highlighted
                  ? "bg-secondary border-primary/30 glow-border relative"
                  : "bg-secondary border-border"
              }`}
              style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full whitespace-nowrap">
                  Popular
                </div>
              )}
              <div className="rounded-[12px] p-4 bg-background/40">
                <h3 className="text-primary font-mono text-sm uppercase tracking-widest">{plan.name}</h3>
                <p className="text-3xl md:text-4xl font-bold mt-2 tabular-nums text-foreground">
                  ৳{isYearly ? plan.yearly : plan.monthly}
                  <span className="text-sm text-muted-foreground font-normal">/{isYearly ? "yr" : "mo"}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">{plan.subtitle}</p>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full mt-8 py-3 font-semibold rounded-xl transition-all ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:brightness-110"
                    : "bg-card text-foreground border border-border hover:border-primary/30"
                }`}
              >
                Purchase Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
