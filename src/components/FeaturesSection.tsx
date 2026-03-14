import { motion } from "framer-motion";
import { Globe, Server, HardDrive, Mail, Cpu, Lock, RefreshCw, Rocket, MousePointerClick, BarChart3, Shield, Headphones, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

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
        color: s.color,
      }));
    }
    return [
      { icon: Globe, title: tr("features.domain"), description: tr("features.domainDesc"), price: "199 BDT/Year", color: "from-blue-500/20 to-blue-600/5" },
      { icon: HardDrive, title: tr("nav.webHosting"), description: tr("features.webHostingDesc"), price: "130 BDT/Month", color: "from-green-500/20 to-green-600/5" },
      { icon: Cpu, title: tr("nav.proHosting"), description: tr("features.proHostingDesc"), price: "200 BDT/Month", color: "from-purple-500/20 to-purple-600/5" },
      { icon: Rocket, title: tr("nav.premiumHosting"), description: tr("features.premiumHostingDesc"), price: "500 BDT/Month", color: "from-orange-500/20 to-orange-600/5" },
      { icon: Server, title: tr("nav.reseller"), description: tr("features.resellerHostingDesc"), price: "1,499 BDT/Month", color: "from-pink-500/20 to-pink-600/5" },
      { icon: Shield, title: tr("nav.vps"), description: tr("features.vpsServerDesc"), price: "750 BDT/Month", color: "from-cyan-500/20 to-cyan-600/5" },
      { icon: Mail, title: tr("nav.emailHosting"), description: tr("features.emailHostingDesc"), price: "799 BDT/Month", color: "from-yellow-500/20 to-yellow-600/5" },
      { icon: HardDrive, title: tr("nav.dedicated"), description: tr("features.dedicatedServerDesc"), price: "11,200 BDT/Month", color: "from-red-500/20 to-red-600/5" },
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
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            {tr("features.ourServices")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            {getText("features_section_title", tr("features.allHosting"))}
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            {getText("features_section_subtitle", tr("features.servicesSubtitle"))}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-24">
          {services.map((service: any, i: number) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.06 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card-elevated p-6 group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{service.description}</p>
                <p className="text-sm font-bold text-primary">{tr("features.startingFrom")} {service.price}</p>
                <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold mt-3 group-hover:gap-3 transition-all">
                  {tr("features.viewPlan")} <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            {tr("features.extraBenefits")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            {getText("features_benefits_title", tr("features.benefitsTitle"))}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature: any, i: number) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
