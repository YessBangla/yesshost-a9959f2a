import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { tr, lang } = useLanguage();
  const [dbFaqs, setDbFaqs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("faqs").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setDbFaqs(data || []));
  }, []);

  const faqs = dbFaqs.length > 0 ? dbFaqs.map(f => ({
    q: lang === "bn" ? f.question_bn : f.question_en,
    a: lang === "bn" ? f.answer_bn : f.answer_en,
  })) : [
    { q: tr("faq.q1"), a: tr("faq.a1") },
    { q: tr("faq.q2"), a: tr("faq.a2") },
    { q: tr("faq.q3"), a: tr("faq.a3") },
    { q: tr("faq.q4"), a: tr("faq.a4") },
    { q: tr("faq.q5"), a: tr("faq.a5") },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            {tr("faq.title")}
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  openIndex === i ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
