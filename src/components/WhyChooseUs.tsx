import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { Shield, Clock, Headphones, Server, Award, Users, Zap, Globe, Lock, Rocket, HardDrive, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, typeof Shield> = {
  Shield, Clock, Headphones, Server, Award, Users, Zap, Globe, Lock, Rocket, HardDrive, BarChart3,
};

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const WhyChooseUs = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [cms, setCms] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .in("section_key", ["why_heading", "why_stats", "why_reasons"])
      .then(({ data }) => setCms(data || []));
  }, []);

  const get = (key: string) => cms.find(c => c.section_key === key);
  const heading = get("why_heading");
  const headingMeta = heading?.metadata || {};

  const stats = useMemo(() => {
    const list = get("why_stats")?.metadata?.stats;
    if (Array.isArray(list) && list.length) {
      return list.map((s: any) => ({
        icon: iconMap[s.icon] || Users,
        value: Number(s.value) || 0,
        suffix: s.suffix || "",
        display: s.display as string | undefined,
        labelBn: s.label_bn,
        labelEn: s.label_en,
      }));
    }
    return [
      { icon: Users, value: 50000, suffix: "+", display: undefined, labelBn: "সক্রিয় ওয়েবসাইট", labelEn: "Active Websites" },
      { icon: Clock, value: 0, suffix: "", display: "99.9%", labelBn: "আপটাইম গ্যারান্টি", labelEn: "Uptime Guarantee" },
      { icon: Headphones, value: 24, suffix: "/7", display: undefined, labelBn: "এক্সপার্ট সাপোর্ট", labelEn: "Expert Support" },
      { icon: Award, value: 8, suffix: "+", display: undefined, labelBn: "বছরের অভিজ্ঞতা", labelEn: "Years Experience" },
    ];
  }, [cms]);

  const reasons = useMemo(() => {
    const list = get("why_reasons")?.metadata?.reasons;
    if (Array.isArray(list) && list.length) {
      return list.map((r: any) => ({
        icon: iconMap[r.icon] || Server,
        titleBn: r.title_bn,
        titleEn: r.title_en,
        descBn: r.desc_bn,
        descEn: r.desc_en,
      }));
    }
    return [
      {
        icon: Server,
        titleBn: "LiteSpeed ওয়েব সার্ভার",
        titleEn: "LiteSpeed Web Server",
        descBn: "Apache এর চেয়ে ৬ গুণ দ্রুত LiteSpeed সার্ভারে আপনার সাইট হোস্ট করুন।",
        descEn: "Host your site on LiteSpeed servers, 6x faster than Apache.",
      },
      {
        icon: Shield,
        titleBn: "ফ্রি SSL ও DDoS প্রোটেকশন",
        titleEn: "Free SSL & DDoS Protection",
        descBn: "সকল প্ল্যানে ফ্রি SSL সার্টিফিকেট এবং এন্টারপ্রাইজ-গ্রেড সিকিউরিটি।",
        descEn: "Free SSL certificates and enterprise-grade security on all plans.",
      },
      {
        icon: Clock,
        titleBn: "NVMe SSD স্টোরেজ",
        titleEn: "NVMe SSD Storage",
        descBn: "আলট্রা-ফাস্ট NVMe SSD ডিস্কে আপনার ডেটা সুরক্ষিত থাকবে।",
        descEn: "Your data stays secure on ultra-fast NVMe SSD drives.",
      },
    ];
  }, [cms]);

  return (
    <section className="py-10 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Stats counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-4 md:p-6 text-center hover:border-primary/20 transition-colors"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-xs shadow-primary/15">
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="text-xl md:text-3xl font-extrabold text-foreground mb-0.5">
                {stat.display ? (
                  <span className="tabular-nums">{stat.display}</span>
                ) : (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                )}
              </p>
              <p className="text-[11px] md:text-xs text-muted-foreground font-medium">
                {lang === "bn" ? stat.labelBn : stat.labelEn}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Why choose us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold gradient-primary text-primary-foreground mb-3">
            {lang === "bn" ? "কেন আমরা" : "Why Us"}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {lang === "bn" ? "কেন Yess Host বেছে নেবেন?" : "Why Choose Yess Host?"}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {lang === "bn"
              ? "বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ও দ্রুতগতির হোস্টিং সেবা"
              : "Bangladesh's most reliable and fastest hosting service"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
          {reasons.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 md:p-6 group hover:border-primary/20 hover:shadow-xs transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/12 transition-colors">
                <reason.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-bold text-foreground mb-1.5">
                {lang === "bn" ? reason.titleBn : reason.titleEn}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {lang === "bn" ? reason.descBn : reason.descEn}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
