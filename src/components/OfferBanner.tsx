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
    <div className="relative h-8 sm:h-9 flex items-center bg-primary text-primary-foreground overflow-hidden">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 60s linear infinite" }}>
          {[...offers, ...offers].map((offer, i) => {
            const Icon = offer.icon;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-6 text-[11px] sm:text-xs font-medium tracking-wide"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-90" />
                {bn ? offer.bn : offer.en}
              </span>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="shrink-0 h-full px-3 flex items-center border-l border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default OfferBanner;
