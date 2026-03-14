import PublicLayout from "@/components/PublicLayout";
import HeroSection from "@/components/HeroSection";
import CorporateSlider from "@/components/CorporateSlider";
import CategoryScroller from "@/components/CategoryScroller";
import TrustedBySection from "@/components/TrustedBySection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import ServerStatus from "@/components/ServerStatus";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  return (
    <PublicLayout>
      <CorporateSlider />
      <HeroSection />
      <CategoryScroller />
      <TrustedBySection />
      <FeaturesSection />
      <PricingSection />
      <ServerStatus />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
