import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const TestimonialsSection = () => {
  const { tr, lang } = useLanguage();
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("testimonials").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setTestimonials(data || []));
  }, []);

  // Fallback to hardcoded if no DB data
  const items = testimonials.length > 0 ? testimonials.map(t => ({
    name: t.name,
    company: t.company || "",
    text: lang === "bn" ? t.content_bn : t.content_en,
    rating: t.rating || 5,
    avatar: t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
  })) : [
    { name: "Rahim Ahmed", company: "TechBD Solutions", text: tr("testimonials.t1"), rating: 5, avatar: "RA" },
    { name: "Fatima Khan", company: "ShopNow BD", text: tr("testimonials.t2"), rating: 5, avatar: "FK" },
    { name: "Kamal Hossain", company: "DevStudio BD", text: tr("testimonials.t3"), rating: 5, avatar: "KH" },
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
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            {tr("testimonials.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((t, i) => (
            <motion.div
              key={t.name + i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
