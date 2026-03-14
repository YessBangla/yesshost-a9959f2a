import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

import bannerWebHosting from "@/assets/banners/web-hosting.jpg";
import bannerVps from "@/assets/banners/vps-server.jpg";
import bannerDomain from "@/assets/banners/domain.jpg";
import bannerReseller from "@/assets/banners/reseller.jpg";
import bannerThemeStore from "@/assets/banners/theme-store.jpg";
import bannerEmail from "@/assets/banners/email-hosting.jpg";

const categories = [
  { img: bannerDomain, titleBn: "ডোমেইন রেজিস্ট্রেশন", titleEn: "Domain Registration", link: "/services/domain", desc_bn: ".COM .NET .ORG .XYZ", desc_en: ".COM .NET .ORG .XYZ" },
  { img: bannerWebHosting, titleBn: "ওয়েব হোস্টিং", titleEn: "Web Hosting", link: "/services/shared-hosting", desc_bn: "ফাস্ট ও সিকিউর হোস্টিং", desc_en: "Fast & Secure Hosting" },
  { img: bannerVps, titleBn: "VPS সার্ভার", titleEn: "VPS Server", link: "/services/vps", desc_bn: "ফুল রুট অ্যাক্সেস", desc_en: "Full Root Access" },
  { img: bannerReseller, titleBn: "রিসেলার হোস্টিং", titleEn: "Reseller Hosting", link: "/services/reseller-hosting", desc_bn: "আপনার হোস্টিং বিজনেস", desc_en: "Start Your Hosting Business" },
  { img: bannerThemeStore, titleBn: "থিম স্টোর", titleEn: "Theme Store", link: "/themes", desc_bn: "প্রিমিয়াম ওয়েবসাইট থিম", desc_en: "Premium Website Themes" },
  { img: bannerEmail, titleBn: "ইমেইল হোস্টিং", titleEn: "Email Hosting", link: "/services/email-hosting", desc_bn: "প্রফেশনাল ইমেইল", desc_en: "Professional Email" },
];

const CategoryScroller = () => {
  const { lang } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const isPaused = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let speed = 0.5;

    const animate = () => {
      if (!isPaused.current && el) {
        el.scrollLeft += speed;
        // Reset to beginning when halfway (duplicate set starts)
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Duplicate items for infinite scroll
  const items = [...categories, ...categories];

  return (
    <section className="py-12 md:py-16 bg-secondary/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          {lang === "bn" ? "আমাদের সার্ভিস ক্যাটাগরি" : "Our Service Categories"}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground text-center mt-2">
          {lang === "bn" ? "আপনার প্রয়োজন অনুযায়ী সেরা সলিউশন বেছে নিন" : "Choose the best solution for your needs"}
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        onTouchStart={() => { isPaused.current = true; }}
        onTouchEnd={() => { isPaused.current = false; }}
      >
        {items.map((cat, i) => (
          <Link
            to={cat.link}
            key={i}
            className="group relative flex-shrink-0 w-[280px] sm:w-[320px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={cat.img}
                alt={lang === "bn" ? cat.titleBn : cat.titleEn}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
              <h3 className="text-lg font-bold text-white">
                {lang === "bn" ? cat.titleBn : cat.titleEn}
              </h3>
              <p className="text-xs text-white/70 mt-0.5">
                {lang === "bn" ? cat.desc_bn : cat.desc_en}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryScroller;
