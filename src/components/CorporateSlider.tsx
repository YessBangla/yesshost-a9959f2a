import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

import slideDatacenter from "@/assets/slides/slide-datacenter.jpg";
import slideTeam from "@/assets/slides/slide-team.jpg";
import slideNetwork from "@/assets/slides/slide-network.jpg";
import slideSecurity from "@/assets/slides/slide-security.jpg";

const slides = [
  {
    img: slideDatacenter,
    titleBn: "বাংলাদেশের সেরা ডেটা সেন্টার",
    titleEn: "Bangladesh's Best Data Center",
    descBn: "হাই পারফরম্যান্স সার্ভার, ৯৯.৯% আপটাইম গ্যারান্টি এবং ২৪/৭ মনিটরিং।",
    descEn: "High performance servers, 99.9% uptime guarantee, and 24/7 monitoring.",
  },
  {
    img: slideTeam,
    titleBn: "এক্সপার্ট সাপোর্ট টিম",
    titleEn: "Expert Support Team",
    descBn: "আমাদের দক্ষ ইঞ্জিনিয়ার টিম সবসময় আপনার পাশে — ২৪/৭ সাপোর্ট।",
    descEn: "Our skilled engineering team is always by your side — 24/7 support.",
  },
  {
    img: slideNetwork,
    titleBn: "গ্লোবাল নেটওয়ার্ক কানেক্টিভিটি",
    titleEn: "Global Network Connectivity",
    descBn: "বিশ্বব্যাপী ৬টি ডেটা সেন্টার থেকে আপনার কন্টেন্ট দ্রুত ডেলিভার করুন।",
    descEn: "Deliver your content fast from 6 data centers worldwide.",
  },
  {
    img: slideSecurity,
    titleBn: "এন্টারপ্রাইজ-গ্রেড সিকিউরিটি",
    titleEn: "Enterprise-Grade Security",
    descBn: "ফ্রি SSL, DDoS প্রোটেকশন এবং অটোমেটেড ব্যাকআপ সহ সম্পূর্ণ সুরক্ষা।",
    descEn: "Complete protection with free SSL, DDoS protection, and automated backups.",
  },
];

const CorporateSlider = () => {
  const { lang } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full h-[50vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <img
            src={slide.img}
            alt={lang === "bn" ? slide.titleBn : slide.titleEn}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          {/* Text Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
              <div className="max-w-xl">
                <h2
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight transition-all duration-700 delay-200 ${
                    i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                >
                  {lang === "bn" ? slide.titleBn : slide.titleEn}
                </h2>
                <p
                  className={`mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-white/80 leading-relaxed transition-all duration-700 delay-400 ${
                    i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                >
                  {lang === "bn" ? slide.descBn : slide.descEn}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 h-2.5 bg-white"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default CorporateSlider;
