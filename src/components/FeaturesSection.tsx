import { motion } from "framer-motion";
import { Globe, Server, HardDrive, Mail, Radio, Palette, ArrowUpRight, Shield, Headphones, Cpu, Lock, RefreshCw, Rocket, MousePointerClick, BarChart3 } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Domain",
    description: "Register Your Domain Names .COM .NET .ORG .XYZ and more",
    price: "199 BDT/Year",
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: HardDrive,
    title: "Web Hosting",
    description: "Get fast and secure Web hosting for small & medium sites.",
    price: "130 BDT/Month",
    color: "from-green-500/20 to-green-600/5",
  },
  {
    icon: Cpu,
    title: "Pro Hosting",
    description: "Faster Pro NVMe cPanel Web Hosting for your website!",
    price: "200 BDT/Month",
    color: "from-purple-500/20 to-purple-600/5",
  },
  {
    icon: Rocket,
    title: "Premium Hosting",
    description: "Premium Hosting designed for larger resources and more features",
    price: "500 BDT/Month",
    color: "from-orange-500/20 to-orange-600/5",
  },
  {
    icon: Server,
    title: "Reseller Hosting",
    description: "Pick the best reseller hosting plan for your Business",
    price: "1,499 BDT/Month",
    color: "from-pink-500/20 to-pink-600/5",
  },
  {
    icon: Shield,
    title: "VPS Server",
    description: "Powerful and 100% Configurable VPS Servers",
    price: "750 BDT/Month",
    color: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    icon: Mail,
    title: "Email Hosting",
    description: "Professional email hosting with CrossBox Suite Panel",
    price: "799 BDT/Month",
    color: "from-yellow-500/20 to-yellow-600/5",
  },
  {
    icon: HardDrive,
    title: "Dedicated Server",
    description: "Dedicated servers are entirely different from shared hostings",
    price: "11,200 BDT/Month",
    color: "from-red-500/20 to-red-600/5",
  },
];

const features = [
  {
    icon: RefreshCw,
    title: "Free Migration Service",
    description: "Transfer your website to us free with the help of our migration experts. Migrate WordPress by just a click!",
  },
  {
    icon: Shield,
    title: "7 Days Money Back Guarantee",
    description: "If you're not completely satisfied, simply cancel and request a refund within 7 days.",
  },
  {
    icon: MousePointerClick,
    title: "One-Click Deploy",
    description: "With our one click installer tool, available on every plan, you can install any type of website.",
  },
  {
    icon: BarChart3,
    title: "99.9% Uptime Guarantee",
    description: "Our servers ensure your websites stay online without downtime. Uptime backed by our SLA.",
  },
  {
    icon: Headphones,
    title: "24/7 Chat with Experts",
    description: "Our customer support is 24x7x365. Gain 24x7 access to our expert support team.",
  },
  {
    icon: Lock,
    title: "Free SSL Certificate",
    description: "Free SSL Certificate, automated, and open certificate authority for Internet Security.",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            Our Services
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            All Hosting Solutions
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            আপনার অনলাইন বিজনেসের জন্য সেরা হোস্টিং সার্ভিস।
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-24">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.06 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card-elevated p-6 group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{service.description}</p>
                <p className="text-sm font-bold text-primary">Starting From {service.price}</p>
                <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold mt-3 group-hover:gap-3 transition-all">
                  View Plan <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            Extra Benefits
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            We Have the Features You Deserve!
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
