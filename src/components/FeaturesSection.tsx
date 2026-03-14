import { motion } from "framer-motion";
import { Globe, Server, Wrench, ArrowUpRight, Shield, Headphones } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Cloud Hosting",
    description: "High-performance cloud hosting with NVMe SSD storage and guaranteed uptime for your growing business.",
  },
  {
    icon: Server,
    title: "VPS Web Hosting",
    description: "Dedicated resources with full root access. Scalable virtual private servers for maximum control.",
  },
  {
    icon: Wrench,
    title: "Email Hosting",
    description: "Professional email hosting with your domain. Secure, reliable and spam-free email solutions.",
  },
];

const features = [
  {
    icon: Globe,
    title: "Easy & First Website Building",
    description: "Globally fashion client-focused synergy for accurate results. Quick setup with one-click installations.",
  },
  {
    icon: Server,
    title: "Managed WordPress",
    description: "Suitable for all users. Optimized WordPress hosting with automatic updates and enhanced security.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "24/7 expert support team ready to help. Average response time under 3 minutes via live chat.",
  },
  {
    icon: Shield,
    title: "Easy Website Transfer",
    description: "Smooth and hassle-free website migration. Our team handles everything for you at no extra cost.",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const FeaturesSection = () => {
  return (
    <section id="features" className="py-[15vh] relative">
      <div className="container mx-auto px-4">
        {/* Services */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-[15vh]">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <service.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{service.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
              <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                Read More <ArrowUpRight className="w-4 h-4" />
              </span>
            </motion.div>
          ))}
        </div>

        {/* Tools & Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-mono uppercase tracking-widest mb-4">Tools & Services</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter mb-4">
            Optimize Website Building
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Everything you need to build, manage, and grow your online presence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="glass-card p-6 group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
