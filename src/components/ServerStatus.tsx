import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    <section id="status" className="py-10 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold gradient-primary text-primary-foreground mb-3">
            Global Network
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {text("server_title", "server.title")}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {text("server_subtitle", "server.subtitle")}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-3 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider border-b border-border bg-secondary/40">
            <span>{tr("server.location")}</span>
            <span>{tr("server.status")}</span>
            <span>{tr("server.latency")}</span>
            <span>{tr("server.load")}</span>
          </div>

          {servers.map((server: any, i: number) => (
            <motion.div
              key={server.location}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
            >
              {/* Mobile */}
              <div className="sm:hidden px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{server.location}</span>
                    <span className="block text-[11px] text-muted-foreground">{server.city}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-600 text-[10px] font-medium">{tr("server.operational")}</span>
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
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                      className="h-full rounded-full gradient-primary"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-7">{server.load}%</span>
                </div>
              </div>
              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-3.5">
                <div>
                  <span className="text-sm font-semibold text-foreground">{server.location}</span>
                  <span className="block text-xs text-muted-foreground">{server.city}</span>
                </div>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 text-xs font-medium">{tr("server.operational")}</span>
                </span>
                <span className="text-sm text-foreground tabular-nums font-medium">{server.latency}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${server.load}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                      className="h-full rounded-full gradient-primary"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-7">{server.load}%</span>
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
