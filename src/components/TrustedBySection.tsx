import { useLanguage } from "@/contexts/LanguageContext";
import { Building2 } from "lucide-react";

const placeholder = "/placeholder.svg";

const partners = [
  { name: "bKash", logo: placeholder },
  { name: "Nagad", logo: placeholder },
  { name: "Grameenphone", logo: placeholder },
  { name: "Robi", logo: placeholder },
  { name: "Banglalink", logo: placeholder },
  { name: "Pathao", logo: placeholder },
  { name: "Daraz", logo: placeholder },
  { name: "SSL Wireless", logo: placeholder },
];

const TrustedBySection = () => {
  const { lang } = useLanguage();
  const doubled = [...partners, ...partners];

  return (
    <section className="py-10 md:py-14 border-y border-border/40 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center gap-3 justify-center mb-2">
          <div className="h-px w-8 bg-primary/40" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {lang === "bn" ? "বিশ্বস্ত পার্টনার" : "Trusted Partners"}
          </span>
          <div className="h-px w-8 bg-primary/40" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground text-center">
          {lang === "bn" ? "যারা আমাদের উপর আস্থা রাখেন" : "Trusted by Leading Brands"}
        </h2>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted/80 to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
          {doubled.map((p, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex flex-col items-center justify-center w-28 sm:w-36 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-sm mb-2 overflow-hidden">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
