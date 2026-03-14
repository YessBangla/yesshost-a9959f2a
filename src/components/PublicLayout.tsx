import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FooterSection from "@/components/FooterSection";
import LiveChatWidget from "@/components/LiveChatWidget";
import OfferBanner from "@/components/OfferBanner";

interface PublicLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  showOfferBanner?: boolean;
}

const PublicLayout = ({ children, hideFooter, showOfferBanner }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {showOfferBanner && <OfferBanner />}
      <Navbar />
      {children}
      {!hideFooter && <FooterSection />}
      <MobileBottomNav />
      <LiveChatWidget />
    </div>
  );
};

export default PublicLayout;
