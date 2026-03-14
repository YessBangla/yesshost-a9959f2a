import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FooterSection from "@/components/FooterSection";

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
    </div>
  );
};

export default PublicLayout;
