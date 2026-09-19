import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Clock, Globe, ArrowRight, CheckCircle, Server, Mail, Lock, ShoppingBag, Layers, HardDrive, Activity, Cloud } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";

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

  const desktopBanner = (
    <div className="relative mx-auto w-full max-w-[430px] lg:max-w-[560px]">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/75 shadow-[0_24px_60px_hsl(var(--glass-shadow)/0.14),inset_0_1px_0_hsl(0_0%_100%/0.9)] backdrop-blur-2xl">
        <div className="flex h-8 items-center justify-between border-b border-border/70 bg-card/80 px-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-destructive/65" />
            <span className="h-2 w-2 rounded-full bg-warning/70" />
            <span className="h-2 w-2 rounded-full bg-success/70" />
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-[9px] font-semibold text-muted-foreground sm:text-[10px]">
            <Lock className="h-2.5 w-2.5 text-success" />
            <span className="truncate">yesshost.com</span>
          </div>
          <Activity className="h-3 w-3 text-success" aria-label="Online" />
        </div>

        <div className="relative h-[126px] overflow-hidden bg-secondary/55 sm:h-[156px] lg:h-[330px]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--card)/0.96),hsl(var(--secondary)/0.72))]" />
          <div className="absolute inset-y-0 left-0 z-10 flex w-[64%] flex-col justify-center px-4 text-left sm:px-5 lg:w-[60%] lg:px-9">
            <div className="mb-2 flex w-fit items-center gap-1.5 rounded-md border border-success/20 bg-success/8 px-2 py-1 text-[9px] font-bold text-success sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {bn ? "ঢাকা বিডিআইএক্স অনলাইন" : "DHAKA BDIX ONLINE"}
            </div>
            <p className="font-display text-base font-extrabold leading-tight text-foreground sm:text-xl lg:text-4xl">
              {bn ? "ব্যবসার জন্য দ্রুত ও নিরাপদ ক্লাউড" : "Cloud built for serious business"}
            </p>
            <div className="mt-2 flex items-center gap-3 text-[9px] font-semibold text-muted-foreground sm:text-[10px] lg:mt-4 lg:text-xs">
              <span className="flex items-center gap-1"><Cloud className="h-3 w-3 text-primary" /> NVMe Cloud</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-success" /> 99.9% SLA</span>
            </div>
          </div>
          <img
            src={heroImg}
            alt={bn ? "ইয়েস হোস্ট কর্পোরেট ক্লাউড সেবা" : "Yess Host corporate cloud service"}
            className="absolute bottom-0 right-[-2%] z-10 h-[118px] w-auto object-contain sm:h-[148px] lg:right-[2%] lg:h-[315px]"
          />
        </div>
      </div>
      <div className="mx-auto h-2.5 w-[38%] rounded-b-xl bg-foreground/12 lg:h-3" aria-hidden="true" />
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-secondary/25 lg:bg-transparent" />

      <div className="relative z-10 container mx-auto px-4 pb-7 pt-6 sm:pb-10 sm:pt-10 md:pt-14 lg:pb-16 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          {/* Left — Text Content */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve }}
              className="mb-3 inline-flex min-h-8 max-w-full items-center gap-2 rounded-lg border border-border/70 bg-card/70 px-3 py-1.5 shadow-sm backdrop-blur-xl sm:mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground text-xs font-medium">{getText("hero_offer", "hero.offer")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve, delay: 0.08 }}
              className="mb-3 font-display text-[2rem] font-extrabold leading-[1.12] tracking-normal sm:text-[2.45rem] lg:mb-4 lg:text-[3.2rem]"
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
              className="mb-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-[15px] lg:mb-5"
            >
              {getText("hero_subtitle", "hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: brandCurve, delay: 0.18 }}
              className="mb-4 lg:hidden"
            >
              {desktopBanner}
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: brandCurve, delay: 0.2 }}
              className="mb-6 hidden flex-wrap gap-x-4 gap-y-2 sm:flex"
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
              className="grid max-w-md grid-cols-2 gap-3"
            >
              <Button asChild size="lg" className="h-12 rounded-xl font-bold shadow-[0_12px_28px_hsl(var(--primary)/0.24),inset_0_1px_0_hsl(0_0%_100%/0.28)]">
                <Link to="/hosting-plans">
                  {bn ? "প্ল্যান দেখুন" : "View Plans"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-border/80 bg-card/70 font-semibold shadow-sm backdrop-blur-xl">
                <Link to="/contact">{bn ? "যোগাযোগ করুন" : "Contact Us"}</Link>
              </Button>
            </motion.div>
          </div>

          {/* Right — desktop-style corporate banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: brandCurve, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="relative flex min-h-[400px] items-center justify-center">
              {desktopBanner}
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
          className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-border/75 bg-card/72 shadow-[0_12px_32px_hsl(var(--glass-shadow)/0.08),inset_0_1px_0_hsl(0_0%_100%/0.9)] backdrop-blur-2xl md:mt-10 md:grid-cols-4"
        >
          {stats.map((stat: any, i: number) => (
            <div
              key={i}
              className={`${i === 3 ? "hidden md:block" : "block"} group border-r border-border/65 px-2 py-3 text-center transition-colors last:border-r-0 hover:bg-primary/5 sm:p-4`}
            >
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary/8 transition-colors group-hover:bg-primary/12 sm:h-9 sm:w-9">
                <stat.icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              </div>
              <p className="text-sm font-extrabold tabular-nums text-foreground sm:text-lg">{stat.value}</p>
              <p className="mt-0.5 truncate text-[9px] font-medium text-muted-foreground sm:text-[11px]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
