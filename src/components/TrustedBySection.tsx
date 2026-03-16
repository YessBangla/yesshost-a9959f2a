import { useLanguage } from "@/contexts/LanguageContext";
import bkashLogo from "@/assets/partners/bkash.svg";
import nagadLogo from "@/assets/partners/nagad.svg";
import gpLogo from "@/assets/partners/grameenphone.png";
import robiLogo from "@/assets/partners/robi.png";
import banglalinkLogo from "@/assets/partners/banglalink.png";
import pathaoLogo from "@/assets/partners/pathao.png";
import darazLogo from "@/assets/partners/daraz.png";
import sslLogo from "@/assets/partners/ssl-wireless.png";

const partners = [
  { name: "bKash", logo: bkashLogo },
  { name: "Nagad", logo: nagadLogo },
  { name: "Grameenphone", logo: gpLogo },
  { name: "Robi", logo: robiLogo },
  { name: "Banglalink", logo: banglalinkLogo },
  { name: "Pathao", logo: pathaoLogo },
  { name: "Daraz", logo: darazLogo },
  { name: "SSLCommerz", logo: sslLogo },
];

const TrustedBySection = () => {
  const { lang } = useLanguage();
  const doubled = [...partners, ...partners];

  return (
    <section className="py-6 md:py-10 border-t border-border/40 bg-secondary/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-3 md:mb-6">
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="h-px w-6 bg-primary/30" />
          <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-primary">
            {lang === "bn" ? "বিশ্বস্ত পার্টনার" : "Trusted Partners"}
          </span>
          <div className="h-px w-6 bg-primary/30" />
        </div>
        <h2 className="text-sm md:text-xl font-bold text-foreground text-center">
          {lang === "bn" ? "যারা আমাদের উপর আস্থা রাখেন" : "Trusted by Leading Brands"}
        </h2>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-r from-secondary/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-l from-secondary/60 to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-8 md:gap-12 animate-marquee whitespace-nowrap">
          {doubled.map((p, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center justify-center w-20 h-10 sm:w-32 sm:h-14 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <img src={p.logo} alt={p.name} className="max-w-full max-h-full object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
