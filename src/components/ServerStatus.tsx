import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const defaultServers = [
  { location: "🇧🇩 Bangladesh", city: "Dhaka (BDIX)", latency: "5ms", load: 63 },
  { location: "🇨🇦 Canada", city: "Toronto", latency: "12ms", load: 34 },
  { location: "🇺🇸 United States", city: "New York", latency: "18ms", load: 52 },
  { location: "🇫🇮 Finland", city: "Helsinki", latency: "28ms", load: 41 },
  { location: "🇮🇳 India", city: "Mumbai", latency: "35ms", load: 27 },
  { location: "🇦🇺 Australia", city: "Sydney", latency: "42ms", load: 19 },
];

const ServerStatus = () => {
  const { tr, lang } = useLanguage();
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .in("section_key", ["server_title", "server_subtitle", "server_list"])
      .then(({ data }) => setContent(data || []));
  }, []);

  const get = (key: string) => content.find(c => c.section_key === key);
  const text = (key: string, fallback: string) => {
    const item = get(key);
    if (!item) return tr(fallback);
    return lang === "bn" ? (item.title_bn || tr(fallback)) : (item.title_en || tr(fallback));
  };

  const servers = useMemo(() => {
    const item = get("server_list");
    return item?.metadata?.servers || defaultServers;
  }, [content]);

  return (
    <section id="status" className="py-12 md:py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-3 md:mb-4">
            Global Network
          </span>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-2 md:mb-4">
            {text("server_title", "server.title")}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {text("server_subtitle", "server.subtitle")}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto glass-card-elevated overflow-hidden">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-4 gap-4 px-6 py-3.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider border-b border-border bg-secondary/30">
            <span>{tr("server.location")}</span>
            <span>{tr("server.status")}</span>
            <span>{tr("server.latency")}</span>
            <span>{tr("server.load")}</span>
          </div>

          {servers.map((server: any, i: number) => (
            <motion.div
              key={server.location}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
              className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
            >
              {/* Mobile layout */}
              <div className="sm:hidden px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{server.location}</span>
                    <span className="block text-[11px] text-muted-foreground">{server.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
                      <span className="text-success text-[10px] font-medium">{tr("server.operational")}</span>
                    </span>
                    <span className="text-xs text-foreground tabular-nums font-bold">{server.latency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${server.load}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                      className="h-full rounded-full gradient-primary"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-7">{server.load}%</span>
                </div>
              </div>
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-4 gap-4 px-6 py-4">
                <div>
                  <span className="text-sm font-semibold text-foreground">{server.location}</span>
                  <span className="block text-xs text-muted-foreground">{server.city}</span>
                </div>
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                  <span className="text-success text-xs font-medium">{tr("server.operational")}</span>
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
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServerStatus;
