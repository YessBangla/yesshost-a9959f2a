import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FooterSection from "@/components/FooterSection";
import LiveChatWidget from "@/components/LiveChatWidget";

interface PublicLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

const PublicLayout = ({ children, hideFooter }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      {children}
      {!hideFooter && <FooterSection />}
      <MobileBottomNav />
      <LiveChatWidget />
    </div>
  );
};

export default PublicLayout;
