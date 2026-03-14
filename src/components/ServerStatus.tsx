import { motion } from "framer-motion";

const servers = [
  { location: "New York, US", status: "operational", latency: "12ms", load: 34 },
  { location: "Frankfurt, DE", status: "operational", latency: "18ms", load: 52 },
  { location: "Singapore, SG", status: "operational", latency: "28ms", load: 41 },
  { location: "Tokyo, JP", status: "operational", latency: "35ms", load: 27 },
  { location: "São Paulo, BR", status: "operational", latency: "42ms", load: 19 },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const ServerStatus = () => {
  return (
    <section id="status" className="py-[20vh] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm font-mono uppercase tracking-widest mb-4">Network</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter mb-4">
            Global infrastructure.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            5 data centers across 4 continents. Real-time status monitoring.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto glass-card p-1 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 text-xs text-muted-foreground font-mono uppercase tracking-wider border-b border-border">
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
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.08 }}
              className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-card/40 transition-colors"
            >
              <span className="text-sm text-foreground font-medium">{server.location}</span>
              <span className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-success text-xs">Operational</span>
              </span>
              <span className="text-sm text-foreground tabular-nums">{server.latency}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${server.load}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{server.load}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServerStatus;
