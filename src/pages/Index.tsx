import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CorporateSlider from "@/components/CorporateSlider";
import CategoryScroller from "@/components/CategoryScroller";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import ServerStatus from "@/components/ServerStatus";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CorporateSlider />
      <HeroSection />
      <CategoryScroller />
      <FeaturesSection />
      <PricingSection />
      <ServerStatus />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default Index;
