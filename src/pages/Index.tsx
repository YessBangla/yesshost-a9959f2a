import PublicLayout from "@/components/PublicLayout";
import HeroSection from "@/components/HeroSection";
import DomainSearch from "@/components/DomainSearch";
import TrustedBySection from "@/components/TrustedBySection";
import WhyChooseUs from "@/components/WhyChooseUs";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import ServerStatus from "@/components/ServerStatus";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import NeedHelpSection from "@/components/NeedHelpSection";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <PublicLayout showOfferBanner>
      <SEOHead
        title="Yess Host — বাংলাদেশের সেরা ওয়েব হোস্টিং | Best Web Hosting Bangladesh"
        description="ইয়েস হোস্ট (Yess Host) — বাংলাদেশের সেরা ওয়েব হোস্টিং, ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার, SSL সার্টিফিকেট ও ক্লাউড হোস্টিং প্রোভাইডার। ৯৯.৯৯% আপটাইম গ্যারান্টি, NVMe SSD স্টোরেজ, ফ্রি SSL। মাত্র ৳৯৯/মাস থেকে শুরু। 24/7 বাংলা সাপোর্ট।"
        canonical="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Yess Host — বাংলাদেশের সেরা ওয়েব হোস্টিং",
            "description": "বাংলাদেশের ১ নম্বর হোস্টিং প্রোভাইডার। ক্লাউড হোস্টিং, VPS, ডোমেইন ও SSL সার্টিফিকেট ৯৯.৯৯% আপটাইমে।",
            "provider": { "@type": "Organization", "name": "Yess Host" },
            "inLanguage": ["bn", "en"],
            "isPartOf": { "@type": "WebSite", "url": "https://yesshost.lovable.app" },
          },
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "ওয়েব হোস্টিং — Web Hosting Bangladesh",
            "description": "বাংলাদেশের সবচেয়ে দ্রুত ও নির্ভরযোগ্য ওয়েব হোস্টিং। NVMe SSD, LiteSpeed সার্ভার, ফ্রি SSL সার্টিফিকেট।",
            "brand": { "@type": "Brand", "name": "Yess Host" },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "99",
              "highPrice": "4999",
              "priceCurrency": "BDT",
              "offerCount": "12",
              "availability": "https://schema.org/InStock",
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "500",
              "bestRating": "5",
              "worstRating": "1",
            },
          },
        ]}
        keywords="ইয়েস হোস্ট, ইয়েস হোষ্ট, Yess Host, YessHost, বাংলাদেশ হোস্টিং, best web hosting bangladesh, সেরা ওয়েব হোস্টিং, ডোমেইন কিনুন, domain buy bd, bd domain buy, cheap hosting bd, সস্তা হোস্টিং বাংলাদেশ, domain registration bangladesh, VPS server bd, SSL certificate, cloud hosting, BDIX hosting, রিসেলার হোস্টিং, dedicated server, email hosting, whois, হোস্টিং মূল্য তালিকা, hosting price bangladesh, NVMe SSD hosting, LiteSpeed hosting, cPanel hosting bd, best domain reseller bangladesh, ওয়েবসাইট তৈরি, website hosting bangladesh"
      />
      <HeroSection />
      <DomainSearch />
      <WhyChooseUs />
      <FeaturesSection />
      <PricingSection />
      <NeedHelpSection />
      <ServerStatus />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <TrustedBySection />
    </PublicLayout>
  );
};

export default Index;
