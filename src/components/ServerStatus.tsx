import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const servers = [
  { location: "🇨🇦 Canada", city: "Toronto", status: "operational", latency: "12ms", load: 34 },
  { location: "🇺🇸 United States", city: "New York", status: "operational", latency: "18ms", load: 52 },
  { location: "🇫🇮 Finland", city: "Helsinki", status: "operational", latency: "28ms", load: 41 },
  { location: "🇮🇳 India", city: "Mumbai", status: "operational", latency: "35ms", load: 27 },
  { location: "🇦🇺 Australia", city: "Sydney", status: "operational", latency: "42ms", load: 19 },
  { location: "🇧🇩 Bangladesh", city: "Dhaka (BDIX)", status: "operational", latency: "5ms", load: 63 },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const ServerStatus = () => {
  return (
    <section id="status" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            Global Network
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            Data Center Locations
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            বিশ্বব্যাপী ৬টি ডেটা সেন্টারে আপনার কন্টেন্ট ডেলিভার করুন।
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto glass-card-elevated overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider border-b border-border bg-secondary/30">
            <span>Location</span>
            <span>Status</span>
            <span>Latency</span>
            <span>Load</span>
          </div>

          {servers.map((server, i) => (
            <motion.div
              key={server.location}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
              className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
            >
              <div>
                <span className="text-sm font-semibold text-foreground">{server.location}</span>
                <span className="block text-xs text-muted-foreground">{server.city}</span>
              </div>
              <span className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-success text-xs font-medium">Operational</span>
              </span>
              <span className="text-sm text-foreground tabular-nums font-medium">{server.latency}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${server.load}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-8">{server.load}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServerStatus;
