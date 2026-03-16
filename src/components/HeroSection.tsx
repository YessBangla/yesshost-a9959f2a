import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Clock, Globe, ArrowRight, CheckCircle, Server, Mail, Lock, ShoppingBag, Layers, HardDrive } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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

  return (
    <section className="relative overflow-hidden">
      {/* Light purple corporate gradient background — slightly darker */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(270,25%,96%)] via-[hsl(265,30%,93%)] to-[hsl(260,20%,90%)]" />
      
      {/* Purple accent glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[hsl(260,100%,65%)]/[0.1] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[hsl(270,100%,60%)]/[0.08] blur-[100px]" />
      
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
              <span className="block bg-gradient-to-r from-[hsl(260,80%,55%)] via-[hsl(270,90%,60%)] to-[hsl(280,100%,65%)] bg-clip-text text-transparent">
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(260,80%,55%)] to-[hsl(270,90%,60%)] text-white px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[hsl(260,80%,55%)]/25"
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

          {/* Right — Hero Image with floating service icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: brandCurve, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative flex items-center justify-center min-h-[420px]">
              {/* Corporate person image */}
              <img
                src={heroImg}
                alt="YessHost Corporate"
                className="w-[380px] h-auto object-contain relative z-10 drop-shadow-2xl"
              />

              {/* Floating service icons around the person */}
              {[
                { icon: Globe, label: bn ? "ডোমেইন" : "Domain", link: "/services/domain", pos: "top-2 -left-4", delay: 0.4 },
                { icon: Server, label: bn ? "হোস্টিং" : "Hosting", link: "/services/basic-hosting", pos: "top-16 -right-6", delay: 0.5 },
                { icon: HardDrive, label: "VPS", link: "/services/usa-vps", pos: "top-1/2 -left-10", delay: 0.6 },
                { icon: Lock, label: "SSL", link: "/services/ssl", pos: "bottom-28 -right-8", delay: 0.7 },
                { icon: Mail, label: bn ? "ইমেইল" : "Email", link: "/services/email-hosting", pos: "bottom-8 -left-6", delay: 0.8 },
                { icon: ShoppingBag, label: bn ? "থিম স্টোর" : "Themes", link: "/themes", pos: "bottom-2 right-4", delay: 0.9 },
                { icon: Layers, label: bn ? "রিসেলার" : "Reseller", link: "/services/linux-reseller", pos: "top-4 left-1/3", delay: 1.0 },
              ].map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: brandCurve, delay: service.delay }}
                  className={`absolute ${service.pos} z-20`}
                >
                  <Link
                    to={service.link}
                    className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-border/60 rounded-xl px-3 py-2 shadow-lg shadow-black/5 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-4 h-4 text-primary" />
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: brandCurve, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 md:mt-16"
        >
          {stats.map((stat: any, i: number) => (
            <div
              key={i}
              className="bg-white border border-border rounded-xl p-4 text-center group hover:border-[hsl(260,80%,70%)]/40 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[hsl(260,80%,95%)] flex items-center justify-center mx-auto mb-2 group-hover:bg-[hsl(260,80%,92%)] transition-colors">
                <stat.icon className="w-5 h-5 text-[hsl(260,80%,55%)]" />
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
