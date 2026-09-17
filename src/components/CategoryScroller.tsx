import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import { ArrowRight } from "lucide-react";

import bannerWebHosting from "@/assets/banners/web-hosting.jpg";
import bannerVps from "@/assets/banners/vps-server.jpg";
import bannerDomain from "@/assets/banners/domain.jpg";
import bannerReseller from "@/assets/banners/reseller.jpg";
import bannerThemeStore from "@/assets/banners/theme-store.jpg";
import bannerEmail from "@/assets/banners/email-hosting.jpg";
import bannerDedicated from "@/assets/banners/dedicated-server.jpg";
import bannerSsl from "@/assets/banners/ssl-certificate.jpg";

const categories = [
  { img: bannerDomain, titleBn: "ডোমেইন রেজিস্ট্রেশন", titleEn: "Domain Registration", link: "/services/domain", desc_bn: ".COM .NET .ORG .XYZ", desc_en: ".COM .NET .ORG .XYZ" },
  { img: bannerWebHosting, titleBn: "ওয়েব হোস্টিং", titleEn: "Web Hosting", link: "/services/basic-hosting", desc_bn: "ফাস্ট ও সিকিউর হোস্টিং", desc_en: "Fast & Secure Hosting" },
  { img: bannerVps, titleBn: "VPS সার্ভার", titleEn: "VPS Server", link: "/services/usa-vps", desc_bn: "ফুল রুট অ্যাক্সেস", desc_en: "Full Root Access" },
  { img: bannerDedicated, titleBn: "ডেডিকেটেড সার্ভার", titleEn: "Dedicated Server", link: "/services/dedicated", desc_bn: "সম্পূর্ণ নিজস্ব সার্ভার", desc_en: "Your Own Powerful Server" },
  { img: bannerReseller, titleBn: "রিসেলার হোস্টিং", titleEn: "Reseller Hosting", link: "/services/linux-reseller", desc_bn: "আপনার হোস্টিং বিজনেস", desc_en: "Start Your Hosting Business" },
  { img: bannerThemeStore, titleBn: "থিম স্টোর", titleEn: "Theme Store", link: "/themes", desc_bn: "প্রিমিয়াম ওয়েবসাইট থিম", desc_en: "Premium Website Themes" },
  { img: bannerEmail, titleBn: "ইমেইল হোস্টিং", titleEn: "Email Hosting", link: "/services/email-hosting", desc_bn: "প্রফেশনাল ইমেইল", desc_en: "Professional Email" },
  { img: bannerSsl, titleBn: "SSL সার্টিফিকেট", titleEn: "SSL Certificate", link: "/services/ssl", desc_bn: "ওয়েবসাইট সিকিউরিটি", desc_en: "Secure Your Website" },
];

const CategoryScroller = () => {
  const { lang } = useLanguage();

  return (
    <section className="py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center gap-3 justify-center mb-2">
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {lang === "bn" ? "সার্ভিস" : "Services"}
          </span>
          <div className="h-px w-8 bg-primary/40" />
        </div>
        <h2 className="text-lg md:text-3xl font-bold text-foreground text-center">
          {lang === "bn" ? "আমাদের সার্ভিস ক্যাটাগরি" : "Our Service Categories"}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground text-center mt-1.5 max-w-md mx-auto">
          {lang === "bn" ? "আপনার প্রয়োজন অনুযায়ী সেরা সলিউশন বেছে নিন" : "Choose the best solution for your needs"}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {categories.map((cat, i) => (
            <Link
              to={cat.link}
              key={i}
              className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15),0_20px_40px_hsl(var(--primary)/0.1)] active:scale-[0.98]"
            >
              {/* Glow overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none rounded-xl sm:rounded-2xl ring-1 ring-primary/40 ring-inset" />
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-xl sm:rounded-2xl" />

              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cat.img}
                  alt={lang === "bn" ? cat.titleBn : cat.titleEn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 group-hover:from-black/95 group-hover:via-black/70">
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white group-hover:text-primary-foreground transition-colors duration-300">
                  {lang === "bn" ? cat.titleBn : cat.titleEn}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/60 mt-0.5 group-hover:text-white/80 transition-colors duration-300">
                  {lang === "bn" ? cat.desc_bn : cat.desc_en}
                </p>
                <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-primary font-medium translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {lang === "bn" ? "প্ল্যান দেখুন" : "View Plans"} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryScroller;
