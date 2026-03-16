import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Clock, Globe, ArrowRight, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

import heroImg from "@/assets/hero-datacenter.jpg";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;
const iconMap: Record<string, typeof Globe> = { Globe, Clock, Zap, Shield };

const HeroSection = () => {
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const [siteContent, setSiteContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setSiteContent(data || []));
  }, []);

  const getContent = (key: string) => siteContent.find(c => c.section_key === key) || null;
  const getText = (key: string, fallbackKey: string) => {
    const item = getContent(key);
    if (!item) return tr(fallbackKey);
    return bn ? (item.title_bn || tr(fallbackKey)) : (item.title_en || tr(fallbackKey));
  };

  const stats = useMemo(() => {
    const item = getContent("hero_stats");
    if (item?.metadata?.stats) {
      return item.metadata.stats.map((s: any) => ({
        icon: iconMap[s.icon] || Globe,
        value: s.value,
        label: bn ? s.label_bn : s.label_en,
      }));
    }
    return [
      { icon: Globe, value: "50K+", label: tr("hero.activeWebsites") },
      { icon: Clock, value: "99.9%", label: tr("hero.uptimeGuarantee") },
      { icon: Zap, value: "LiteSpeed", label: tr("hero.webServer") },
      { icon: Shield, value: "24/7", label: tr("hero.expertSupport") },
    ];
  }, [siteContent, lang]);

  const highlights = [
    bn ? "ফ্রি SSL সার্টিফিকেট" : "Free SSL Certificate",
    bn ? "NVMe SSD স্টোরেজ" : "NVMe SSD Storage",
    bn ? "ফ্রি মাইগ্রেশন" : "Free Migration",
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Light purple corporate gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(270,30%,98%)] via-[hsl(265,35%,96%)] to-[hsl(260,25%,94%)]" />
      
      {/* Purple accent glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[hsl(260,100%,70%)]/[0.08] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[hsl(270,100%,65%)]/[0.06] blur-[100px]" />
      
      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — Text Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-primary/[0.08] border border-primary/[0.15]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground/70 text-sm font-medium">{getText("hero_offer", "hero.offer")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: brandCurve, delay: 0.1 }}
              className="font-display font-extrabold tracking-tight leading-[1.1] mb-5"
              style={{ fontSize: "clamp(1.5rem, 5vw, 3.5rem)" }}
            >
              <span className="block text-foreground mb-2">{getText("hero_title1", "hero.title1")}</span>
              <span className="block bg-gradient-to-r from-[hsl(215,100%,45%)] via-primary to-[hsl(260,100%,55%)] bg-clip-text text-transparent">
                {getText("hero_title2", "hero.title2")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve, delay: 0.2 }}
              className="text-sm md:text-base text-muted-foreground max-w-lg mb-6 leading-relaxed"
            >
              {getText("hero_subtitle", "hero.subtitle")}
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve, delay: 0.25 }}
              className="flex flex-wrap gap-x-5 gap-y-2 mb-8"
            >
              {highlights.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-muted-foreground">{h}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to="/#pricing"
                className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {bn ? "প্ল্যান দেখুন" : "View Plans"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-white border border-border text-foreground px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl font-semibold text-sm hover:bg-muted transition-all shadow-sm"
              >
                {bn ? "যোগাযোগ করুন" : "Contact Us"}
              </Link>
            </motion.div>
          </div>

          {/* Right — Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: brandCurve, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10 border border-border">
              <img
                src={heroImg}
                alt="YessHost Data Center"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-60" />
            </div>
            {/* Floating stat badge */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-border rounded-xl px-5 py-3 shadow-xl shadow-black/5">
              <p className="text-2xl font-extrabold text-foreground">99.9%</p>
              <p className="text-[11px] text-muted-foreground font-medium">{bn ? "আপটাইম গ্যারান্টি" : "Uptime Guarantee"}</p>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 md:mt-16"
        >
          {stats.map((stat: any, i: number) => (
            <div
              key={i}
              className="bg-white border border-border rounded-xl p-4 text-center group hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/15 transition-colors">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-extrabold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
