import { motion } from "framer-motion";
import { Phone, MessageCircle, Mail, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CTASection = () => {
  const { tr, lang } = useLanguage();
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .in("section_key", ["cta_badge", "cta_title", "cta_subtitle", "cta_contacts"])
      .then(({ data }) => setContent(data || []));
  }, []);

  const get = (key: string) => content.find(c => c.section_key === key);
  const text = (key: string, fallback: string) => {
    const item = get(key);
    if (!item) return tr(fallback);
    return lang === "bn" ? (item.title_bn || tr(fallback)) : (item.title_en || tr(fallback));
  };

  const contacts = get("cta_contacts")?.metadata || {};

  return (
    <section id="contact" className="py-10 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl gradient-primary p-6 sm:p-10 md:p-14 text-center"
        >
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-xs text-primary-foreground text-xs">
              <Zap className="w-3.5 h-3.5" />
              {text("cta_badge", "cta.needHelp")}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-primary-foreground mb-3">
              {text("cta_title", "cta.title")}
            </h2>
            <p className="text-sm md:text-base text-primary-foreground/80 max-w-lg mx-auto mb-6">
              {text("cta_subtitle", "cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`tel:${contacts.phone || "+8801805464343"}`}
                className="flex items-center gap-2 bg-white text-foreground px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-md"
              >
                <Phone className="w-4 h-4" />
                {lang === "bn" ? (contacts.phone_label_bn || tr("cta.callUs")) : (contacts.phone_label_en || tr("cta.callUs"))}
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-primary-foreground border border-primary-foreground/25 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                {lang === "bn" ? (contacts.chat_label_bn || tr("cta.liveChat")) : (contacts.chat_label_en || tr("cta.liveChat"))}
              </a>
              <a
                href={`mailto:${contacts.email || "support@yesshost.com"}`}
                className="flex items-center gap-2 text-primary-foreground border border-primary-foreground/25 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all"
              >
                <Mail className="w-4 h-4" />
                {lang === "bn" ? (contacts.email_label_bn || tr("cta.email")) : (contacts.email_label_en || tr("cta.email"))}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
