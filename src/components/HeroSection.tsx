import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Clock, Globe, ArrowRight, CheckCircle, Server, Mail, Lock, ShoppingBag, Layers, HardDrive } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@/lib/router-compat";

import heroImg from "@/assets/hero-corporate.png";
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

  const serviceLinks = [
    { icon: Globe, label: bn ? "ডোমেইন" : "Domain", link: "/services/domain", pos: "top-4 -left-2 lg:-left-4", delay: 0.4 },
    { icon: Server, label: bn ? "হোস্টিং" : "Hosting", link: "/services/basic-hosting", pos: "top-20 -right-2 lg:-right-6", delay: 0.5 },
    { icon: HardDrive, label: "VPS", link: "/services/usa-vps", pos: "top-1/2 -left-6 lg:-left-10", delay: 0.6 },
    { icon: Lock, label: "SSL", link: "/services/ssl", pos: "bottom-28 -right-4 lg:-right-8", delay: 0.7 },
    { icon: Mail, label: bn ? "ইমেইল" : "Email", link: "/services/email-hosting", pos: "bottom-10 -left-2 lg:-left-6", delay: 0.8 },
    { icon: ShoppingBag, label: bn ? "থিম" : "Themes", link: "/themes", pos: "bottom-2 right-6 lg:right-4", delay: 0.9 },
    { icon: Layers, label: bn ? "রিসেলার" : "Reseller", link: "/services/linux-reseller", pos: "top-6 left-1/3", delay: 1.0 },
  ];

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.02]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 md:pt-16 md:pb-12 lg:pt-20 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left — Text Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve }}
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/[0.06] border border-primary/[0.12]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground text-xs font-medium">{getText("hero_offer", "hero.offer")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve, delay: 0.08 }}
              className="font-display font-extrabold tracking-tight leading-[1.12] mb-4"
              style={{ fontSize: "clamp(1.6rem, 4.5vw, 3.2rem)" }}
            >
              <span className="block text-foreground">{getText("hero_title1", "hero.title1")}</span>
              <span className="block text-primary mt-1">
                {getText("hero_title2", "hero.title2")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve, delay: 0.15 }}
              className="text-sm md:text-[15px] text-muted-foreground max-w-lg mb-5 leading-relaxed"
            >
              {getText("hero_subtitle", "hero.subtitle")}
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: brandCurve, delay: 0.2 }}
              className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6"
            >
              {highlights.map((h) => (
                <div key={h} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">{h}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: brandCurve, delay: 0.25 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to="/hosting-plans"
                className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {bn ? "প্ল্যান দেখুন" : "View Plans"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl font-semibold text-sm hover:bg-secondary transition-all"
              >
                {bn ? "যোগাযোগ করুন" : "Contact Us"}
              </Link>
            </motion.div>
          </div>

          {/* Right — Hero Image with floating service icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: brandCurve, delay: 0.15 }}
            className="hidden lg:block relative"
          >
            <div className="relative flex items-center justify-center min-h-[400px]">
              <img
                src={heroImg}
                alt="Yess Host Corporate"
                className="w-[360px] h-auto object-contain relative z-10 drop-shadow-xl"
              />
              {serviceLinks.map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: brandCurve, delay: service.delay }}
                  className={`absolute ${service.pos} z-20`}
                >
                  <Link
                    to={service.link}
                    className="flex items-center gap-2 bg-card/95 backdrop-blur-xs border border-border rounded-xl px-3 py-2 shadow-md hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <service.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{service.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: brandCurve, delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 md:mt-12"
        >
          {stats.map((stat: any, i: number) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-3.5 sm:p-4 text-center group hover:border-primary/25 hover:shadow-xs transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/12 transition-colors">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-base sm:text-lg font-extrabold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
