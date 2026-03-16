import { Home, Grid3X3, Headphones, User, ShoppingCart, Globe2, Server, Zap, Crown, Wifi, Users, WifiHigh, MonitorSmartphone, HardDrive, MapPin, Mail, Radio, Palette, ListOrdered, X, ChevronRight, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/formatPrice";

interface ServiceItem {
  label: string;
  labelBn: string;
  href: string;
  icon: typeof Home;
  price?: string; // starting price in BDT e.g. "99"
}

interface ServiceCategory {
  title: string;
  titleBn: string;
  items: ServiceItem[];
}

const serviceCategories: ServiceCategory[] = [
  {
    title: "Domain", titleBn: "ডোমেইন",
    items: [
      { label: "Domain Registration", labelBn: "ডোমেইন রেজিস্ট্রেশন", href: "/services/domain", icon: Globe2, price: "120" },
      { label: "Domain Pricing", labelBn: "ডোমেইন মূল্য", href: "/domain-pricing", icon: ListOrdered },
    ],
  },
  {
    title: "Web Hosting", titleBn: "ওয়েব হোস্টিং",
    items: [
      { label: "Basic Hosting", labelBn: "বেসিক হোস্টিং", href: "/services/basic-hosting", icon: Server, price: "99" },
      { label: "Pro Hosting", labelBn: "প্রো হোস্টিং", href: "/services/pro-hosting", icon: Zap, price: "299" },
      { label: "Premium Hosting", labelBn: "প্রিমিয়াম হোস্টিং", href: "/services/premium-hosting", icon: Crown, price: "599" },
      { label: "BDIX Hosting", labelBn: "বিডিআইএক্স হোস্টিং", href: "/services/bdix-hosting", icon: Wifi, price: "199" },
    ],
  },
  {
    title: "Reseller", titleBn: "রিসেলার",
    items: [
      { label: "Linux Reseller", labelBn: "লিনাক্স রিসেলার", href: "/services/linux-reseller", icon: Users, price: "1,500" },
      { label: "BDIX Reseller", labelBn: "বিডিআইএক্স রিসেলার", href: "/services/bdix-reseller", icon: WifiHigh, price: "2,000" },
    ],
  },
  {
    title: "VPS & Dedicated", titleBn: "ভিপিএস ও ডেডিকেটেড",
    items: [
      { label: "USA VPS", labelBn: "USA ভিপিএস", href: "/services/usa-vps", icon: MonitorSmartphone, price: "800" },
      { label: "BDIX VPS", labelBn: "বিডিআইএক্স ভিপিএস", href: "/services/bdix-vps", icon: HardDrive, price: "1,200" },
      { label: "USA Dedicated", labelBn: "USA ডেডিকেটেড", href: "/services/usa-dedicated", icon: MonitorSmartphone, price: "5,000" },
      { label: "BD Dedicated", labelBn: "BD ডেডিকেটেড", href: "/services/bd-dedicated", icon: MapPin, price: "8,000" },
    ],
  },
  {
    title: "More Services", titleBn: "আরো সেবা",
    items: [
      { label: "Email Hosting", labelBn: "ইমেইল হোস্টিং", href: "/services/email-hosting", icon: Mail, price: "150" },
      { label: "Radio Hosting", labelBn: "রেডিও হোস্টিং", href: "/services/radio-hosting", icon: Radio, price: "500" },
      { label: "Graphics Design", labelBn: "গ্রাফিক্স ডিজাইন", href: "/services/graphics-design", icon: Palette, price: "1,000" },
      { label: "Theme Store", labelBn: "থিম স্টোর", href: "/themes", icon: ShoppingBag, price: "2,999" },
    ],
  },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { itemCount, setCartOpen } = useCart();
  const [tapped, setTapped] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const bn = lang === "bn";

  const tabs = [
    { id: "home", icon: Home, label: bn ? "হোম" : "Home", href: "/" },
    { id: "services", icon: Grid3X3, label: bn ? "সার্ভিস" : "Services", href: "#services" },
    { id: "cart", icon: ShoppingCart, label: bn ? "কার্ট" : "Cart", href: "#cart" },
    { id: "support", icon: Headphones, label: bn ? "সাপোর্ট" : "Support", href: "/contact" },
    {
      id: "account",
      icon: User,
      label: user ? (bn ? "অ্যাকাউন্ট" : "Account") : (bn ? "লগইন" : "Login"),
      href: user ? "/dashboard" : "/login",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("#")) return false;
    return location.pathname.startsWith(href);
  };

  const handleTap = (id: string) => {
    setTapped(id);
    setTimeout(() => setTapped(null), 300);
  };

  const handleTabClick = (tab: typeof tabs[0], e: React.MouseEvent) => {
    handleTap(tab.id);
    if (tab.id === "services") {
      e.preventDefault();
      setServicesOpen(true);
    } else if (tab.id === "cart") {
      e.preventDefault();
      setCartOpen(true);
    }
  };

  return (
    <>
      {/* Services Full-Screen Sheet */}
      <AnimatePresence>
        {servicesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setServicesOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[61] bg-background rounded-t-2xl max-h-[85vh] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  {bn ? "আমাদের সেবাসমূহ" : "Our Services"}
                </h2>
                <button
                  onClick={() => setServicesOpen(false)}
                  className="p-2 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Service categories */}
              <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] px-4 py-3 space-y-4">
                {serviceCategories.map((cat, ci) => (
                  <div key={ci}>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 px-1">
                      {bn ? cat.titleBn : cat.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setServicesOpen(false)}
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-[0.97]"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-foreground leading-tight">
                                {bn ? item.labelBn : item.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                                {bn ? item.descBn : item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="glass-surface border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16">
            {tabs.map((tab) => {
              const active = tab.id === "services" ? servicesOpen : isActive(tab.href);
              const bouncing = tapped === tab.id;
              const isCart = tab.id === "cart";

              const content = (
                <div
                  className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors duration-200 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`relative p-1.5 rounded-xl transition-all duration-200 ${active ? "bg-primary/10" : ""}`}
                    style={{
                      transform: bouncing ? "scale(0.75)" : "scale(1)",
                      transition: bouncing
                        ? "transform 0.1s cubic-bezier(0.2, 0, 0.7, 1)"
                        : "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <tab.icon className="w-5 h-5" />
                    {active && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                    {isCart && itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                        {itemCount > 9 ? "9+" : itemCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </div>
              );

              if (tab.href.startsWith("#")) {
                return (
                  <button
                    key={tab.id}
                    onClick={(e) => handleTabClick(tab, e as any)}
                    className="w-full h-full"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  onClick={(e) => handleTabClick(tab, e)}
                  className="w-full h-full"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
