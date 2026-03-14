import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-datacenter.jpg";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const HeroSection = () => {
  const [domain, setDomain] = useState("");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          <span className="text-xs text-muted-foreground">All systems operational — 99.99% uptime</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: brandCurve, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter leading-[0.9] mb-6"
        >
          Deploy at the
          <br />
          <span className="text-gradient-primary">speed of thought.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
        >
          Enterprise-grade NVMe infrastructure with 99.99% uptime guaranteed by SLA.
          <br className="hidden md:block" />
          40ms global latency. 10Gbps uplink.
        </motion.p>

        {/* Domain Search */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-card/40 backdrop-blur-md border border-border glow-border">
            <div className="flex items-center gap-3 flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Search your perfect domain..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg py-3"
              />
            </div>
            <button className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition-all">
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            .com .net .org .io .dev — starting from $9.99/year
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-20"
        >
          {[
            { value: "50K+", label: "Active Websites" },
            { value: "99.99%", label: "Uptime SLA" },
            { value: "<40ms", label: "Global Latency" },
            { value: "10Gbps", label: "Network Uplink" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
