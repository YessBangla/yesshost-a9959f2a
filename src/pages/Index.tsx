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

const Index = () => {
  return (
    <PublicLayout showOfferBanner>
      <CorporateSlider />
      <HeroSection />
      <TrustedBySection />
      <WhyChooseUs />
      <FeaturesSection />
      <PricingSection />
      <NeedHelpSection />
      <ServerStatus />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
