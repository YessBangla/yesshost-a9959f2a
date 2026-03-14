import { useState } from "react";
import { X, Star, Zap, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const offers = [
  {
    icon: Star,
    en: "🔥 .TOP Domain only ৳180/year! Register now →",
    bn: "🔥 .TOP ডোমেইন মাত্র ১৮০ টাকা/বছর! এখনই রেজিস্টার করুন →",
  },
  {
    icon: Tag,
    en: "💰 Up to 50% OFF on Reseller Hosting! Use code: RH50",
    bn: "💰 রিসেলার হোস্টিংয়ে সর্বোচ্চ ৫০% ছাড়! কোড: RH50",
  },
  {
    icon: Zap,
    en: "⚡ .COM Domain Registration only ৳990 — Limited Time!",
    bn: "⚡ .COM ডোমেইন রেজিস্ট্রেশন মাত্র ৯৯০ টাকা — সীমিত সময়!",
  },
];

const OfferBanner = () => {
  const [visible, setVisible] = useState(true);
  const { lang } = useLanguage();
  const bn = lang === "bn";

  if (!visible) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground overflow-hidden">
      <button
        onClick={() => setVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex animate-marquee whitespace-nowrap py-2 pr-8">
        {[...offers, ...offers].map((offer, i) => {
          const Icon = offer.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 mx-8 text-xs sm:text-sm font-medium"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {bn ? offer.bn : offer.en}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default OfferBanner;
