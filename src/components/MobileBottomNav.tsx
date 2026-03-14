import { Home, Grid3X3, Headphones, User, Globe } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { lang, setLang } = useLanguage();
  const [tapped, setTapped] = useState<string | null>(null);

  const tabs = [
    { icon: Home, label: lang === "bn" ? "হোম" : "Home", href: "/" },
    { icon: Grid3X3, label: lang === "bn" ? "সার্ভিস" : "Services", href: "/services/basic-hosting" },
    { icon: Headphones, label: lang === "bn" ? "সাপোর্ট" : "Support", href: "/contact" },
    {
      icon: User,
      label: user ? (lang === "bn" ? "অ্যাকাউন্ট" : "Account") : (lang === "bn" ? "লগইন" : "Login"),
      href: user ? "/dashboard" : "/login",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleTap = (id: string) => {
    setTapped(id);
    setTimeout(() => setTapped(null), 300);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="glass-surface border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const bouncing = tapped === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                onClick={() => handleTap(tab.href)}
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
                </div>
                <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => { handleTap("lang"); setLang(lang === "bn" ? "en" : "bn"); }}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full text-muted-foreground"
          >
            <div
              className="p-1.5 rounded-xl"
              style={{
                transform: tapped === "lang" ? "scale(0.75)" : "scale(1)",
                transition: tapped === "lang"
                  ? "transform 0.1s cubic-bezier(0.2, 0, 0.7, 1)"
                  : "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">
              {lang === "bn" ? "EN" : "বাং"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
