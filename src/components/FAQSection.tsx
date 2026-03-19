import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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

  // Generate FAQPage JSON-LD for Google rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <section className="py-10 md:py-20 bg-secondary/30">
      {/* FAQ Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold gradient-primary text-primary-foreground mb-3">
            FAQ
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight mb-2">
            {tr("faq.title")}
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  openIndex === i ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {openIndex === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
