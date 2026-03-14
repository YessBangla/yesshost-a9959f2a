import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Shield, Zap, Clock, Globe } from "lucide-react";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const domainPrices = [
  { ext: ".com", price: "১১৫০", popular: true },
  { ext: ".online", price: "২৫০", popular: false },
  { ext: ".net", price: "১৫৪০", popular: false },
  { ext: ".org", price: "১৬৫০", popular: false },
  { ext: ".xyz", price: "১৫০", popular: false },
  { ext: ".store", price: "২০০", popular: false },
];

const stats = [
  { icon: Globe, value: "50K+", label: "Active Websites" },
  { icon: Clock, value: "99.99%", label: "Uptime SLA" },
  { icon: Zap, value: "<40ms", label: "Global Latency" },
  { icon: Shield, value: "24/7", label: "Expert Support" },
];

const HeroSection = () => {
  const [domain, setDomain] = useState("");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 text-center py-20">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass-card text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          <span className="text-muted-foreground">Trusted by <strong className="text-foreground">6,400+</strong> businesses</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: brandCurve, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.05] mb-6"
        >
          10x Faster Hosting.
          <br />
          <span className="text-gradient-primary">Launch in Minutes.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve, delay: 0.2 }}
          className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ওয়েব হোস্টিং সেবা। NVMe SSD স্টোরেজ,
          ফ্রি SSL এবং ২৪/৭ এক্সপার্ট সাপোর্ট।
        </motion.p>

        {/* Domain Search */}
        <motion.div
          id="domain"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="flex items-center gap-2 p-2 rounded-2xl glass-card-elevated">
            <div className="flex items-center gap-3 flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="আপনার ডোমেইন নাম সার্চ করুন..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base py-3"
              />
            </div>
            <button className="shrink-0 flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Domain prices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {domainPrices.map((d) => (
            <div
              key={d.ext}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm transition-all hover:scale-105 cursor-pointer ${
                d.popular ? "glow-border" : ""
              }`}
            >
              <span className="font-bold text-foreground">{d.ext}</span>
              <span className="text-muted-foreground">{d.price}৳</span>
              {d.popular && (
                <span className="text-[10px] font-bold gradient-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-5 text-center group"
            >
              <div className="w-10 h-10 rounded-xl gradient-primary/10 bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
