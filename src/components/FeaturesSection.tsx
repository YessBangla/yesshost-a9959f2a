import { motion } from "framer-motion";
import { Cpu, Shield, Zap, Globe, HardDrive, Headphones } from "lucide-react";

const features = [
  {
    icon: HardDrive,
    title: "NVMe SSD Storage",
    description: "Pure NVMe drives delivering 7,000 MB/s read speeds. No spinning disks, no compromises.",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    description: "Enterprise-grade L3/L4/L7 mitigation. 20Tbps network capacity absorbs attacks instantly.",
  },
  {
    icon: Zap,
    title: "LiteSpeed Server",
    description: "Up to 12x faster than Apache. Built-in caching engine for WordPress and dynamic sites.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    description: "280+ edge locations. Static assets cached and served from the nearest node to your visitors.",
  },
  {
    icon: Cpu,
    title: "Isolated Resources",
    description: "Guaranteed CPU and RAM allocation. Your neighbors can't affect your performance.",
  },
  {
    icon: Headphones,
    title: "24/7 Expert Support",
    description: "Real engineers, not scripts. Average response time under 3 minutes via live chat.",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const FeaturesSection = () => {
  return (
    <section id="features" className="py-[20vh] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm font-mono uppercase tracking-widest mb-4">Infrastructure</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter mb-4">
            Built for performance.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every layer optimized. From hardware to software, no bottleneck left unaddressed.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
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
