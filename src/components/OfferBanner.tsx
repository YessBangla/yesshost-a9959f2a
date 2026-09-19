import { useEffect, useMemo, useState } from "react";
import { X, Star, Zap, Tag, Gift, Percent, Megaphone, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, typeof Star> = { Star, Zap, Tag, Gift, Percent, Megaphone, Sparkles };

const fallbackOffers = [
  { icon: "Star", en: "🔥 .TOP Domain only ৳180/year! Register now →", bn: "🔥 .TOP ডোমেইন মাত্র ১৮০ টাকা/বছর! এখনই রেজিস্টার করুন →" },
  { icon: "Tag", en: "💰 Up to 50% OFF on Reseller Hosting! Use code: RH50", bn: "💰 রিসেলার হোস্টিংয়ে সর্বোচ্চ ৫০% ছাড়! কোড: RH50" },
  { icon: "Zap", en: "⚡ .COM Domain Registration only ৳990 — Limited Time!", bn: "⚡ .COM ডোমেইন রেজিস্ট্রেশন মাত্র ৯৯০ টাকা — সীমিত সময়!" },
];

const OfferBanner = () => {
  const [visible, setVisible] = useState(true);
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [cms, setCms] = useState<any>(null);

  useEffect(() => {
    supabase.from("site_content").select("*")
      .eq("page", "home").eq("section_key", "offer_banner").eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => setCms(data));
  }, []);

  const offers = useMemo(() => {
    const list = cms?.metadata?.offers;
    return Array.isArray(list) && list.length ? list : fallbackOffers;
  }, [cms]);

  const speed = Number(cms?.metadata?.speed_seconds) > 0 ? Number(cms.metadata.speed_seconds) : 60;

  if (!visible || offers.length === 0) return null;

  return (
    <div className="relative h-8 sm:h-9 flex items-center bg-card/75 text-foreground backdrop-blur-2xl border-b border-card/80 shadow-[inset_0_-1px_0_hsl(var(--primary)/0.08)] overflow-hidden">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex whitespace-nowrap" style={{ animation: `marquee ${speed}s linear infinite` }}>
          {[...offers, ...offers].map((offer: any, i: number) => {
            const Icon = iconMap[offer.icon] || Star;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-6 text-[11px] sm:text-xs font-semibold tracking-wide [&_svg]:text-primary"
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
        className="shrink-0 h-full min-w-11 px-3 flex items-center justify-center border-l border-border/60 text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default OfferBanner;
