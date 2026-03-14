import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
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
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
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
      <FooterSection />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
