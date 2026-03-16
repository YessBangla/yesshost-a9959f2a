import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Shield, Clock, Headphones, Server, Award, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

  const stats = [
    {
      icon: Users,
      value: 50000,
      suffix: "+",
      labelBn: "সক্রিয় ওয়েবসাইট",
      labelEn: "Active Websites",
    },
    {
      icon: Clock,
      value: 99.9,
      suffix: "%",
      labelBn: "আপটাইম গ্যারান্টি",
      labelEn: "Uptime Guarantee",
      isDecimal: true,
    },
    {
      icon: Headphones,
      value: 24,
      suffix: "/7",
      labelBn: "এক্সপার্ট সাপোর্ট",
      labelEn: "Expert Support",
    },
    {
      icon: Award,
      value: 8,
      suffix: "+",
      labelBn: "বছরের অভিজ্ঞতা",
      labelEn: "Years Experience",
    },
  ];

  const reasons = [
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

  return (
    <section className="py-12 md:py-28 relative">
      <div className="container mx-auto px-4 relative z-10">
        {/* Stats counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-20"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card-elevated p-4 md:p-8 text-center group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg shadow-primary/20">
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <p className="text-2xl md:text-4xl font-extrabold text-foreground mb-0.5 md:mb-1">
                {stat.isDecimal ? (
                  <span className="tabular-nums">99.9%</span>
                ) : (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                )}
              </p>
              <p className="text-[11px] md:text-sm text-muted-foreground font-medium">
                {lang === "bn" ? stat.labelBn : stat.labelEn}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Why choose us */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-3 md:mb-4">
            {lang === "bn" ? "কেন আমরা" : "Why Us"}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-2 md:mb-4">
            {lang === "bn" ? "কেন YessHost বেছে নেবেন?" : "Why Choose YessHost?"}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {lang === "bn"
              ? "বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ও দ্রুতগতির হোস্টিং সেবা"
              : "Bangladesh's most reliable and fastest hosting service"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5 max-w-5xl mx-auto">
          {reasons.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass-card-elevated p-5 md:p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <reason.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {lang === "bn" ? reason.titleBn : reason.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === "bn" ? reason.descBn : reason.descEn}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
