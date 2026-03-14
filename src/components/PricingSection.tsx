import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "4.99",
    description: "Perfect for personal sites and blogs.",
    features: [
      "50GB NVMe Storage",
      "Unlimited Bandwidth",
      "Free SSL Certificate",
      "1 Website",
      "Weekly Backups",
      "Email Support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "19.99",
    description: "For growing businesses and traffic.",
    features: [
      "100GB NVMe Storage",
      "Unlimited Bandwidth",
      "Free SSL + Dedicated IP",
      "Unlimited Websites",
      "Daily Backups",
      "Priority Support",
      "LiteSpeed Cache",
      "Staging Environment",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "49.99",
    description: "Mission-critical applications.",
    features: [
      "500GB NVMe Storage",
      "10Gbps Uplink",
      "Free SSL + Dedicated IP",
      "Unlimited Websites",
      "Real-time Backups",
      "24/7 Phone Support",
      "Custom Firewall Rules",
      "SLA Guarantee",
    ],
    highlighted: false,
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const PricingSection = () => {
  return (
    <section id="pricing" className="py-[20vh] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm font-mono uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter mb-4">
            Transparent pricing.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No hidden fees. No surprise charges. Scale when you're ready.
          </p>
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="rounded-[12px] p-4 bg-background/40">
                <h3 className="text-primary font-mono text-sm uppercase tracking-widest">{plan.name}</h3>
                <p className="text-4xl font-bold mt-2 tabular-nums text-foreground">
                  ${plan.price}
                  <span className="text-sm text-muted-foreground font-normal">/mo</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
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
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
