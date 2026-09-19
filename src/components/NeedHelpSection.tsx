import { Phone, MessageCircle, TicketCheck, Mail, Headphones, LifeBuoy, Send, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, typeof Phone> = {
  Phone, MessageCircle, TicketCheck, Mail, Headphones, LifeBuoy, Send, Users,
};

type HelpOption = {
  icon: typeof Phone;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  href: string;
  external?: boolean;
};

const fallbackOptions: HelpOption[] = [
  { icon: Phone, titleBn: "কল করুন", titleEn: "Call Us", descBn: "১০AM - ৮PM (প্রতিদিন)", descEn: "10AM - 8PM (Everyday)", href: "tel:+8801805464343", external: true },
  { icon: MessageCircle, titleBn: "লাইভ চ্যাট", titleEn: "Live Chat", descBn: "তাৎক্ষণিক সাহায্য পান", descEn: "Get instant help", href: "/chat-rooms" },
  { icon: TicketCheck, titleBn: "সাপোর্ট টিকেট", titleEn: "Support Ticket", descBn: "বিস্তারিত সমস্যা জানান", descEn: "Submit detailed issues", href: "/dashboard/support" },
  { icon: Mail, titleBn: "ইমেইল করুন", titleEn: "Email Us", descBn: "support@yesshost.com", descEn: "support@yesshost.com", href: "mailto:support@yesshost.com", external: true },
];

const NeedHelpSection = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [cms, setCms] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .in("section_key", ["help_heading", "help_options"])
      .then(({ data }) => setCms(data || []));
  }, []);

  const get = (key: string) => cms.find(c => c.section_key === key);
  const heading = get("help_heading");
  const headingMeta = heading?.metadata || {};

  const options: HelpOption[] = useMemo(() => {
    const list = get("help_options")?.metadata?.options;
    if (Array.isArray(list) && list.length) {
      return list.map((o: any) => ({
        icon: iconMap[o.icon] || LifeBuoy,
        titleBn: o.title_bn,
        titleEn: o.title_en,
        descBn: o.desc_bn,
        descEn: o.desc_en,
        href: o.href || "/contact",
        external: Boolean(o.external) || /^(tel:|mailto:|https?:)/.test(o.href || ""),
      }));
    }
    return fallbackOptions;
  }, [cms]);

  return (
    <section className="py-10 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold gradient-primary text-primary-foreground mb-3">
            {(bn ? headingMeta.badge_bn : headingMeta.badge_en) || (bn ? "সাহায্য" : "Support")}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {(bn ? heading?.title_bn : heading?.title_en) || (bn ? "সাহায্য দরকার? আমরা এখানে আছি" : "Need Help? We Are Here")}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto">
            {(bn ? heading?.content_bn : heading?.content_en) || (bn ? "যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন" : "Contact us anytime — our team is always ready to help")}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            const inner = (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-4 md:p-5 text-center cursor-pointer hover:border-primary/25 hover:shadow-xs transition-all group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-xs shadow-primary/15 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">
                  {bn ? opt.titleBn : opt.titleEn}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {bn ? opt.descBn : opt.descEn}
                </p>
              </motion.div>
            );

            if (opt.external) return <a key={i} href={opt.href} target="_blank" rel="noopener noreferrer">{inner}</a>;
            return <Link key={i} to={opt.href as any}>{inner}</Link>;
          })}
        </div>
      </div>
    </section>
  );
};

export default NeedHelpSection;
