import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import DomainSearch from "@/components/DomainSearch";
import { useLanguage } from "@/contexts/LanguageContext";

const DomainSearchPage = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <PublicLayout>
      <SEOHead
        title={bn ? "ডোমেইন সার্চ — Yess Host" : "Domain Search — Yess Host"}
        description={bn
          ? "আপনার পছন্দের ডোমেইন খুঁজুন এবং সাথে সাথে রেজিস্টার করুন। .com, .net, .com.bd সহ শত শত এক্সটেনশন।"
          : "Find your perfect domain and register it instantly. Hundreds of extensions including .com, .net, .com.bd."}
        canonical="/domain-search"
      />
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
              {bn ? "আপনার পছন্দের ডোমেইন খুঁজুন" : "Find Your Perfect Domain"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              {bn
                ? "ডোমেইনের নাম লিখুন — উপলব্ধতা, দাম ও AI সাজেশন সাথে সাথে দেখুন।"
                : "Type a name — see availability, pricing and AI suggestions instantly."}
            </p>
          </div>
          <DomainSearch />
        </div>
      </section>
    </PublicLayout>
  );
};

export default DomainSearchPage;
