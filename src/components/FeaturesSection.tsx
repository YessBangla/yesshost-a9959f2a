import { motion } from "framer-motion";
import { Globe, Server, HardDrive, Mail, Cpu, Lock, RefreshCw, Rocket, MousePointerClick, BarChart3, Shield, Headphones, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, typeof Globe> = {
  Globe, Server, HardDrive, Mail, Cpu, Lock, RefreshCw, Rocket,
  MousePointerClick, BarChart3, Shield, Headphones,
};

const FeaturesSection = () => {
  const { tr, lang } = useLanguage();
  const [siteContent, setSiteContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setSiteContent(data || []));
  }, []);

  const getContent = (key: string) => siteContent.find(c => c.section_key === key);
  const getText = (key: string, fallback: string) => {
    const item = getContent(key);
    if (!item) return fallback;
    return lang === "bn" ? (item.title_bn || fallback) : (item.title_en || fallback);
  };

  const services = useMemo(() => {
    const item = getContent("features_services");
    if (item?.metadata?.services) {
      return item.metadata.services.map((s: any) => ({
        icon: iconMap[s.icon] || Globe,
        title: lang === "bn" ? s.title_bn : s.title_en,
        description: lang === "bn" ? s.desc_bn : s.desc_en,
        price: s.price,
        link: s.link || "#pricing",
      }));
    }
    return [
      { icon: Globe, title: tr("features.domain"), description: tr("features.domainDesc"), price: "199 BDT/Year", link: "/services/domain" },
      { icon: HardDrive, title: tr("nav.webHosting"), description: tr("features.webHostingDesc"), price: "130 BDT/Month", link: "/services/basic-hosting" },
      { icon: Cpu, title: tr("nav.proHosting"), description: tr("features.proHostingDesc"), price: "200 BDT/Month", link: "/services/pro-hosting" },
      { icon: Rocket, title: tr("nav.premiumHosting"), description: tr("features.premiumHostingDesc"), price: "500 BDT/Month", link: "/services/premium-hosting" },
      { icon: Server, title: tr("nav.reseller"), description: tr("features.resellerHostingDesc"), price: "1,499 BDT/Month", link: "/services/linux-reseller" },
      { icon: Shield, title: tr("nav.vps"), description: tr("features.vpsServerDesc"), price: "750 BDT/Month", link: "/services/usa-vps" },
      { icon: Mail, title: tr("nav.emailHosting"), description: tr("features.emailHostingDesc"), price: "799 BDT/Month", link: "/services/email-hosting" },
      { icon: HardDrive, title: tr("nav.dedicated"), description: tr("features.dedicatedServerDesc"), price: "11,200 BDT/Month", link: "/services/dedicated" },
    ];
  }, [siteContent, lang]);

  const features = useMemo(() => {
    const item = getContent("features_benefits");
    if (item?.metadata?.features) {
      return item.metadata.features.map((f: any) => ({
        icon: iconMap[f.icon] || Shield,
        title: lang === "bn" ? f.title_bn : f.title_en,
        description: lang === "bn" ? f.desc_bn : f.desc_en,
      }));
    }
    return [
      { icon: RefreshCw, title: tr("features.freeMigration"), description: tr("features.freeMigrationDesc") },
      { icon: Shield, title: tr("features.moneyBack"), description: tr("features.moneyBackDesc") },
      { icon: MousePointerClick, title: tr("features.oneClick"), description: tr("features.oneClickDesc") },
      { icon: BarChart3, title: tr("features.uptime"), description: tr("features.uptimeDesc") },
      { icon: Headphones, title: tr("features.support"), description: tr("features.supportDesc") },
      { icon: Lock, title: tr("features.freeSSL"), description: tr("features.freeSSLDesc") },
    ];
  }, [siteContent, lang]);

  return (
    <section id="features" className="py-10 md:py-20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold gradient-primary text-primary-foreground mb-3">
            {tr("features.ourServices")}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {getText("features_section_title", tr("features.allHosting"))}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {getText("features_section_subtitle", tr("features.servicesSubtitle"))}
          </p>
        </motion.div>

        {/* Service cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-16">
          {services.map((service: any, i: number) => (
            <Link to={service.link} key={service.title} className="block">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="bg-card border border-border rounded-xl p-4 md:p-5 group cursor-pointer h-full hover:border-primary/25 hover:shadow-xs transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/12 transition-colors">
                  <service.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm md:text-[15px] font-bold text-foreground mb-1">{service.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{service.description}</p>
                <p className="text-xs font-bold text-primary">{tr("features.startingFrom")} {service.price}</p>
                <span className="hidden md:inline-flex items-center gap-1 text-primary text-xs font-semibold mt-2 group-hover:gap-2 transition-all">
                  {tr("features.viewPlan")} <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Benefits header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold gradient-primary text-primary-foreground mb-3">
            {tr("features.extraBenefits")}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {getText("features_benefits_title", tr("features.benefitsTitle"))}
          </h2>
        </motion.div>

        {/* Benefit cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
          {features.map((feature: any, i: number) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl p-4 md:p-5 group hover:border-primary/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/12 transition-colors">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
