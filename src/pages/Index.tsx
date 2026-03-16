import PublicLayout from "@/components/PublicLayout";
import HeroSection from "@/components/HeroSection";
import CorporateSlider from "@/components/CorporateSlider";
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
        title="YessHost — Super Hosting Solution | Cloud Hosting Bangladesh"
        description="YessHost - Yes, It's a Super Hosting Solution! Enterprise-grade cloud hosting, VPS, domains and SSL certificates with 99.99% uptime in Bangladesh. Starting from ৳99/mo."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "YessHost - Super Hosting Solution",
          "description": "Enterprise-grade cloud hosting, VPS, domains and SSL certificates with 99.99% uptime.",
          "provider": { "@type": "Organization", "name": "YessHost" },
        }}
      />
      <CorporateSlider />
      <HeroSection />
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
