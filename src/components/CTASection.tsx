import { motion } from "framer-motion";
import { Phone, MessageCircle, Mail, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const CTASection = () => {
  const { tr } = useLanguage();

  return (
    <section id="contact" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="relative overflow-hidden rounded-3xl gradient-primary p-12 md:p-16 text-center"
        >
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-primary-foreground text-sm">
              <Zap className="w-4 h-4" />
              {tr("cta.needHelp")}
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-primary-foreground mb-4">
              {tr("cta.title")}
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              {tr("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+8809638205205"
                className="flex items-center gap-2 bg-white text-foreground px-8 py-4 rounded-xl font-bold text-base hover:bg-white/90 transition-all shadow-lg"
              >
                <Phone className="w-5 h-5" />
                {tr("cta.callUs")}
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-primary-foreground border border-primary-foreground/30 px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                {tr("cta.liveChat")}
              </a>
              <a
                href="mailto:support@putulhost.com"
                className="flex items-center gap-2 text-primary-foreground border border-primary-foreground/30 px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                <Mail className="w-5 h-5" />
                {tr("cta.email")}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
