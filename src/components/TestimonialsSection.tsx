import { Star, Quote } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

import avatarRahim from "@/assets/avatars/avatar-rahim.jpg";
import avatarFatima from "@/assets/avatars/avatar-fatima.jpg";
import avatarKamal from "@/assets/avatars/avatar-kamal.jpg";
import avatarTanvir from "@/assets/avatars/avatar-tanvir.jpg";
import avatarNusrat from "@/assets/avatars/avatar-nusrat.jpg";
import avatarArif from "@/assets/avatars/avatar-arif.jpg";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const defaultAvatars = [avatarRahim, avatarFatima, avatarKamal, avatarTanvir, avatarNusrat, avatarArif];

const fallbackTestimonials = [
  { name: "Rahim Ahmed", company: "TechBD Solutions", key: "testimonials.t1", avatar: avatarRahim, rating: 5 },
  { name: "Fatima Khan", company: "ShopNow BD", key: "testimonials.t2", avatar: avatarFatima, rating: 5 },
  { name: "Kamal Hossain", company: "DevStudio BD", key: "testimonials.t3", avatar: avatarKamal, rating: 5 },
  { name: "Tanvir Rahman", company: "StartUp Dhaka", key: "testimonials.t1", avatar: avatarTanvir, rating: 5 },
  { name: "Nusrat Jahan", company: "DesignHub BD", key: "testimonials.t2", avatar: avatarNusrat, rating: 5 },
  { name: "Arif Islam", company: "CloudTech BD", key: "testimonials.t3", avatar: avatarArif, rating: 5 },
];

const TestimonialCard = ({ item }: { item: { name: string; company: string; text: string; rating: number; avatarSrc: string } }) => (
  <div className="glass-card p-4 sm:p-6 relative flex-shrink-0 w-[260px] sm:w-[340px]">
    <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
    <div className="flex gap-1 mb-4">
      {[...Array(item.rating)].map((_, j) => (
        <Star key={j} className="w-4 h-4 fill-warning text-warning" />
      ))}
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-4">"{item.text}"</p>
    <div className="flex items-center gap-3">
      <img
        src={item.avatarSrc}
        alt={item.name}
        className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
        loading="lazy"
      />
      <div>
        <p className="text-sm font-semibold text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.company}</p>
      </div>
    </div>
  </div>
);

const TestimonialsSection = () => {
  const { tr, lang } = useLanguage();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const isPaused = useRef(false);

  useEffect(() => {
    supabase.from("testimonials").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setTestimonials(data || []));
  }, []);

  const items = testimonials.length > 0
    ? testimonials.map((t, i) => ({
        name: t.name,
        company: t.company || "",
        text: lang === "bn" ? t.content_bn : t.content_en,
        rating: t.rating || 5,
        avatarSrc: t.avatar_url || defaultAvatars[i % defaultAvatars.length],
      }))
    : fallbackTestimonials.map(t => ({
        name: t.name,
        company: t.company,
        text: tr(t.key),
        rating: t.rating,
        avatarSrc: t.avatar,
      }));

  // Duplicate for infinite scroll
  const scrollItems = [...items, ...items];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const animate = () => {
      if (!isPaused.current && el) {
        el.scrollLeft += 0.5;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [items.length]);

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-3 md:mb-4">
            Testimonials
          </span>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-2 md:mb-4">
            {tr("testimonials.title")}
          </h2>
        </motion.div>
      </div>

      {/* Scrolling testimonials */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        onTouchStart={() => { isPaused.current = true; }}
        onTouchEnd={() => { isPaused.current = false; }}
      >
        {scrollItems.map((item, i) => (
          <TestimonialCard key={`${item.name}-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
