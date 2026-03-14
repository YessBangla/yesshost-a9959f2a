import { motion } from "framer-motion";
import { Globe, Server, Wrench, ArrowUpRight, Shield, Headphones, Cpu, Rocket, HardDrive, Lock, BarChart3, RefreshCw } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Cloud Hosting",
    description: "NVMe SSD স্টোরেজ সহ হাই-পারফরম্যান্স ক্লাউড হোস্টিং। গ্যারান্টিড আপটাইম।",
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: Server,
    title: "VPS Hosting",
    description: "ডেডিকেটেড রিসোর্স সহ ফুল root access। স্কেলেবল ভার্চুয়াল প্রাইভেট সার্ভার।",
    color: "from-purple-500/20 to-purple-600/5",
  },
  {
    icon: Wrench,
    title: "WordPress Hosting",
    description: "Managed WordPress হোস্টিং। অটো আপডেট, ক্যাশিং এবং এনহ্যান্সড সিকিউরিটি।",
    color: "from-green-500/20 to-green-600/5",
  },
];

const features = [
  {
    icon: Cpu,
    title: "NVMe SSD Storage",
    description: "আল্ট্রা-ফাস্ট NVMe SSD স্টোরেজ যা রেগুলার SSD থেকে ১০ গুণ দ্রুত।",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    description: "এন্টারপ্রাইজ-গ্রেড DDoS প্রোটেকশন। আপনার সাইট সর্বদা সুরক্ষিত।",
  },
  {
    icon: Lock,
    title: "Free SSL Certificate",
    description: "সব প্ল্যানে ফ্রি SSL সার্টিফিকেট। আপনার ভিজিটরদের ডেটা এনক্রিপ্টেড।",
  },
  {
    icon: RefreshCw,
    title: "Daily Backups",
    description: "অটোমেটিক ডেইলি ব্যাকআপ। যেকোনো সময় ওয়ান-ক্লিকে রিস্টোর করুন।",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "এক্সপার্ট সাপোর্ট টিম সবসময় আপনার পাশে। লাইভ চ্যাট, ফোন এবং টিকেট।",
  },
  {
    icon: BarChart3,
    title: "99.99% Uptime",
    description: "গ্যারান্টিড ৯৯.৯৯% আপটাইম SLA। আপনার সাইট সবসময় অনলাইন থাকবে।",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Services */}
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
            World-Class Hosting Solutions
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            আপনার অনলাইন বিজনেসের জন্য সেরা হোস্টিং সার্ভিস।
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card-elevated p-8 group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{service.description}</p>
                <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                  Learn More <ArrowUpRight className="w-4 h-4" />
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
            Why YessHost
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            কেন YessHost বেছে নিবেন?
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
