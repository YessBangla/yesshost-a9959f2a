import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Shield, Zap, Clock, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const iconMap: Record<string, typeof Globe> = { Globe, Clock, Zap, Shield };

const defaultDomainPrices = [
  { ext: ".top", price: "১৮০", popular: false },
  { ext: ".xyz", price: "২৯৫", popular: false },
  { ext: ".fun", price: "৩৮০", popular: false },
  { ext: ".shop", price: "৩৯০", popular: false },
  { ext: ".com", price: "৯৯০", popular: true },
];

const HeroSection = () => {
  const [domain, setDomain] = useState("");
  const { tr, lang } = useLanguage();
  const [siteContent, setSiteContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setSiteContent(data || []));
  }, []);

  const getContent = (key: string) => {
    const item = siteContent.find(c => c.section_key === key);
    if (!item) return null;
    return item;
  };

  const getText = (key: string, fallbackKey: string) => {
    const item = getContent(key);
    if (!item) return tr(fallbackKey);
    return lang === "bn" ? (item.title_bn || tr(fallbackKey)) : (item.title_en || tr(fallbackKey));
  };

  const domainPrices = useMemo(() => {
    const item = getContent("hero_domain_prices");
    if (item?.metadata?.prices) return item.metadata.prices;
    return defaultDomainPrices;
  }, [siteContent]);

  const stats = useMemo(() => {
    const item = getContent("hero_stats");
    if (item?.metadata?.stats) {
      return item.metadata.stats.map((s: any) => ({
        icon: iconMap[s.icon] || Globe,
        value: s.value,
        label: lang === "bn" ? s.label_bn : s.label_en,
      }));
    }
    return [
      { icon: Globe, value: "50K+", label: tr("hero.activeWebsites") },
      { icon: Clock, value: "99.9%", label: tr("hero.uptimeGuarantee") },
      { icon: Zap, value: "LiteSpeed", label: tr("hero.webServer") },
      { icon: Shield, value: "24/7", label: tr("hero.expertSupport") },
    ];
  }, [siteContent, lang]);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass-card text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          <span className="text-muted-foreground">{getText("hero_offer", "hero.offer")}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: brandCurve, delay: 0.1 }}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold tracking-tight leading-[1.1] mb-4 md:mb-6"
        >
          {getText("hero_title1", "hero.title1")}
          <br />
          <span className="text-gradient-primary">{getText("hero_title2", "hero.title2")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve, delay: 0.2 }}
          className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {getText("hero_subtitle", "hero.subtitle")}
        </motion.p>

        <motion.div
          id="domain"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl glass-card-elevated">
            <div className="flex items-center gap-3 flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={getText("hero_placeholder", "hero.placeholder")}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm sm:text-base py-3"
              />
            </div>
            <button className="shrink-0 flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-5 sm:px-6 py-3 rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              {getText("hero_register", "hero.register")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: brandCurve, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {domainPrices.map((d: any) => (
            <div
              key={d.ext}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm transition-all hover:scale-105 cursor-pointer ${
                d.popular ? "glow-border" : ""
              }`}
            >
              <span className="font-bold text-foreground">{d.ext}</span>
              <span className="text-muted-foreground">৳{d.price}</span>
              {d.popular && (
                <span className="text-[10px] font-bold gradient-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {tr("pricing.popular")}
                </span>
              )}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat: any) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-5 text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
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
