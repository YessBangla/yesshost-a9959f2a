import { useLanguage } from "@/contexts/LanguageContext";

const partners = [
  { name: "bKash", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Bkash_logo.png/320px-Bkash_logo.png" },
  { name: "Nagad", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Nagad-Logo.wine.svg/320px-Nagad-Logo.wine.svg.png" },
  { name: "Grameenphone", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Grameenphone_Logo.svg/320px-Grameenphone_Logo.svg.png" },
  { name: "Robi", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Robi_Logo.svg/320px-Robi_Logo.svg.png" },
  { name: "Banglalink", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Banglalink-logo.svg/320px-Banglalink-logo.svg.png" },
  { name: "Pathao", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Pathao_logo.svg/320px-Pathao_logo.svg.png" },
  { name: "Daraz", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Daraz_Logo.svg/320px-Daraz_Logo.svg.png" },
  { name: "SSL Wireless", logo: "https://sslwireless.com/wp-content/uploads/2020/08/ssl-wireless-logo.png" },
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
              className="flex-shrink-0 flex items-center justify-center w-28 h-14 sm:w-36 sm:h-16 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={p.logo}
                alt={p.name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
