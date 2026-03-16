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
import SectionWrapper from "@/components/SectionWrapper";

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

      <SectionWrapper variant="alt" divider="curve">
        <WhyChooseUs />
      </SectionWrapper>

      <SectionWrapper variant="default" divider="wave">
        <FeaturesSection />
      </SectionWrapper>

      <SectionWrapper variant="accent" divider="curve">
        <PricingSection />
      </SectionWrapper>

      <SectionWrapper variant="default" divider="wave">
        <NeedHelpSection />
      </SectionWrapper>

      <SectionWrapper variant="alt" divider="curve">
        <ServerStatus />
      </SectionWrapper>

      <SectionWrapper variant="default" divider="wave">
        <TestimonialsSection />
      </SectionWrapper>

      <SectionWrapper variant="alt" divider="curve">
        <FAQSection />
      </SectionWrapper>

      <SectionWrapper variant="default">
        <CTASection />
      </SectionWrapper>

      <TrustedBySection />
    </PublicLayout>
  );
};

export default Index;
