import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import DomainSearch from "./DomainSearch";

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
    ctaBn: "প্ল্যান দেখুন",
    ctaEn: "View Plans",
    link: "/#pricing",
  },
  {
    img: slideTeam,
    titleBn: "এক্সপার্ট সাপোর্ট টিম",
    titleEn: "Expert Support Team",
    descBn: "আমাদের দক্ষ ইঞ্জিনিয়ার টিম সবসময় আপনার পাশে — ২৪/৭ সাপোর্ট।",
    descEn: "Our skilled engineering team is always by your side — 24/7 support.",
    ctaBn: "যোগাযোগ করুন",
    ctaEn: "Contact Us",
    link: "/contact",
  },
  {
    img: slideNetwork,
    titleBn: "গ্লোবাল নেটওয়ার্ক কানেক্টিভিটি",
    titleEn: "Global Network Connectivity",
    descBn: "বিশ্বব্যাপী ৬টি ডেটা সেন্টার থেকে আপনার কন্টেন্ট দ্রুত ডেলিভার করুন।",
    descEn: "Deliver your content fast from 6 data centers worldwide.",
    ctaBn: "আরো জানুন",
    ctaEn: "Learn More",
    link: "/about",
  },
  {
    img: slideSecurity,
    titleBn: "এন্টারপ্রাইজ-গ্রেড সিকিউরিটি",
    titleEn: "Enterprise-Grade Security",
    descBn: "ফ্রি SSL, DDoS প্রোটেকশন এবং অটোমেটেড ব্যাকআপ সহ সম্পূর্ণ সুরক্ষা।",
    descEn: "Complete protection with free SSL, DDoS protection, and automated backups.",
    ctaBn: "শুরু করুন",
    ctaEn: "Get Started",
    link: "/signup",
  },
];

const CorporateSlider = () => {
  const { lang } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          setScrollY(-rect.top * 0.3);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div>
      <section ref={sectionRef} className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
        {/* Slides */}
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-[800ms] ease-out ${
              i === current ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]"
            }`}
          >
            <img
              src={slide.img}
              alt={lang === "bn" ? slide.titleBn : slide.titleEn}
              className={`w-full h-[120%] object-cover transition-transform duration-[6000ms] ease-out ${
                i === current ? "scale-[1.12]" : "scale-100"
              }`}
              style={{ transform: `translateY(${scrollY}px) ${i === current ? "scale(1.12)" : "scale(1)"}` }}
            />
            {/* Texture + gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div
              className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
              }}
            />

            {/* Text Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full">
                <div className="max-w-lg">
                  <div
                    className={`w-12 h-1 rounded-full bg-primary mb-4 transition-all duration-700 delay-100 ${
                      i === current ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    } origin-left`}
                  />
                  <h2
                    className={`text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight transition-all duration-700 delay-200 ${
                      i === current ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                  >
                    {lang === "bn" ? slide.titleBn : slide.titleEn}
                  </h2>
                  <p
                    className={`mt-2 md:mt-4 text-xs sm:text-sm md:text-base text-white/75 leading-relaxed max-w-md transition-all duration-700 delay-300 ${
                      i === current ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                  >
                    {lang === "bn" ? slide.descBn : slide.descEn}
                  </p>
                  <Link
                    to={slide.link}
                    className={`inline-flex items-center gap-2 mt-4 md:mt-6 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold hover:bg-white/20 transition-all duration-700 delay-[400ms] ${
                      i === current ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                  >
                    {lang === "bn" ? slide.ctaBn : slide.ctaEn}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/5 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all z-10"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/5 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all z-10"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-xs z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: i === current ? 28 : 8 }}
              aria-label={`Slide ${i + 1}`}
            >
              <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                i === current ? "bg-white" : "bg-white/30 hover:bg-white/50"
              }`} />
            </button>
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs text-white/60 text-xs font-mono z-10">
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      </section>

      {/* Domain Search Section */}
      <DomainSearch />
    </div>
  );
};

export default CorporateSlider;
