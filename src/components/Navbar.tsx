import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown, LogIn, Globe, ShoppingCart,
  Globe2, ListOrdered, Server, Zap, Crown, Wifi,
  Users, WifiHigh, MonitorSmartphone, HardDrive, MapPin, Globe as GlobeIcon,
  Mail, Radio, Palette, ArrowRight,
  type LucideIcon
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import NotificationBell from "@/components/NotificationBell";
import logoWhite from "@/assets/logo-white.png";

interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
  desc: string;
}

interface NavLink {
  label: string;
  href: string;
  children?: NavChild[];
  mega?: boolean;
  minor?: boolean;
  cta?: { label: string; href: string };
  blink?: boolean;
}

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { lang, setLang, tr } = useLanguage();
  const { itemCount, setCartOpen } = useCart();
  const isBn = lang === "bn";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: NavLink[] = [
    {
      label: tr("nav.domain"),
      href: "/services/domain",
      cta: { label: isBn ? "সকল ডোমেইন দেখুন" : "View All Domains", href: "/domain-pricing" },
      children: [
        { label: isBn ? "ডোমেইন রেজিস্ট্রেশন" : "Domain Registration", href: "/services/domain", icon: Globe2, desc: isBn ? ".com .net .org .info রেজিস্টার করুন" : "Register .com .net .org .info" },
        { label: isBn ? "ডোমেইন মূল্য তালিকা" : "Domain Pricing", href: "/domain-pricing", icon: ListOrdered, desc: isBn ? "সকল ডোমেইনের মূল্য দেখুন" : "View all domain prices" },
      ],
    },
    {
      label: tr("nav.webHosting"),
      href: "/services/basic-hosting",
      mega: true,
      cta: { label: isBn ? "সকল প্ল্যান তুলনা করুন" : "Compare All Plans", href: "/services/basic-hosting" },
      children: [
        { label: tr("nav.basicHosting"), href: "/services/basic-hosting", icon: Server, desc: isBn ? "নতুনদের জন্য সাশ্রয়ী হোস্টিং" : "Affordable hosting for beginners" },
        { label: tr("nav.proHosting"), href: "/services/pro-hosting", icon: Zap, desc: isBn ? "দ্রুত গতির প্রফেশনাল হোস্টিং" : "Fast professional hosting" },
        { label: tr("nav.premiumHosting"), href: "/services/premium-hosting", icon: Crown, desc: isBn ? "সর্বোচ্চ পারফরম্যান্স ও নিরাপত্তা" : "Maximum performance & security" },
        { label: isBn ? "বিডিআইএক্স হোস্টিং" : "BDIX Hosting", href: "/services/bdix-hosting", icon: Wifi, desc: isBn ? "বাংলাদেশে সুপার ফাস্ট স্পিড" : "Super fast speed in Bangladesh" },
      ],
    },
    {
      label: tr("nav.reseller"),
      href: "/reseller-hosting",
      cta: { label: isBn ? "রিসেলার প্ল্যান দেখুন" : "View Reseller Plans", href: "/reseller-hosting" },
      children: [
        { label: isBn ? "রিসেলার হোস্টিং" : "Reseller Hosting", href: "/reseller-hosting", icon: Crown, desc: isBn ? "রিসেলার হোস্টিং প্ল্যান ও মূল্য" : "Reseller hosting plans & pricing" },
        { label: tr("nav.linuxReseller"), href: "/services/linux-reseller", icon: Users, desc: isBn ? "নিজের হোস্টিং ব্যবসা শুরু করুন" : "Start your hosting business" },
        { label: tr("nav.bdixReseller"), href: "/services/bdix-reseller", icon: WifiHigh, desc: isBn ? "বিডিআইএক্স রিসেলার প্যাকেজ" : "BDIX reseller packages" },
      ],
    },
    {
      label: tr("nav.vps"),
      href: "/services/usa-vps",
      cta: { label: isBn ? "সকল VPS দেখুন" : "View All VPS", href: "/services/usa-vps" },
      children: [
        { label: tr("nav.usaVps"), href: "/services/usa-vps", icon: MonitorSmartphone, desc: isBn ? "USA ডাটাসেন্টার VPS সার্ভার" : "USA datacenter VPS server" },
        { label: tr("nav.bdixVps"), href: "/services/bdix-vps", icon: HardDrive, desc: isBn ? "বাংলাদেশ BDIX VPS সার্ভার" : "Bangladesh BDIX VPS server" },
      ],
    },
    {
      label: tr("nav.dedicated"),
      href: "/services/dedicated",
      cta: { label: isBn ? "সকল ডেডিকেটেড সার্ভার দেখুন" : "View All Dedicated Servers", href: "/services/dedicated" },
      children: [
        { label: isBn ? "USA ডেডিকেটেড সার্ভার" : "USA Dedicated Server", href: "/services/usa-dedicated", icon: MonitorSmartphone, desc: isBn ? "আমেরিকা ডেটাসেন্টার সার্ভার" : "USA datacenter server" },
        { label: isBn ? "সিঙ্গাপুর ডেডিকেটেড সার্ভার" : "Singapore Dedicated Server", href: "/services/singapore-dedicated", icon: GlobeIcon, desc: isBn ? "সিঙ্গাপুর ডেটাসেন্টার সার্ভার" : "Singapore datacenter server" },
        { label: isBn ? "বাংলাদেশ ডেডিকেটেড সার্ভার" : "BD Dedicated Server", href: "/services/bd-dedicated", icon: MapPin, desc: isBn ? "বাংলাদেশ লোকাল সার্ভার" : "Bangladesh local server" },
      ],
    },
    {
      label: tr("nav.services"),
      href: "#",
      cta: { label: isBn ? "সকল সার্ভিস দেখুন" : "View All Services", href: "/services/email-hosting" },
      children: [
        { label: tr("nav.emailHosting"), href: "/services/email-hosting", icon: Mail, desc: isBn ? "প্রফেশনাল ইমেইল সার্ভিস" : "Professional email service" },
        { label: tr("nav.radioHosting"), href: "/services/radio-hosting", icon: Radio, desc: isBn ? "অনলাইন রেডিও স্ট্রিমিং" : "Online radio streaming" },
        { label: tr("nav.graphicsDesign"), href: "/services/graphics-design", icon: Palette, desc: isBn ? "লোগো, ব্যানার ও গ্রাফিক্স" : "Logo, banner & graphics" },
        { label: isBn ? "চ্যাট রুম" : "Chat Rooms", href: "/chat-rooms", icon: Users, desc: isBn ? "কমিউনিটি লাইভ চ্যাট রুম" : "Community live chat rooms" },
      ],
    },
    { label: tr("nav.themes"), href: "/themes", blink: true },
    { label: isBn ? "চ্যাট রুম" : "Chat Rooms", href: "/chat-rooms", minor: true },
  ];

  const isInternal = (href: string) => href.startsWith("/");

  const renderMegaDropdown = (link: NavLink, align: "center" | "left" | "right") => {
    if (!link.children) return null;
    const isMega = link.mega && link.children.length >= 4;
    const position =
      align === "left"
        ? "left-0"
        : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`absolute top-full pt-2 z-50 ${position} ${isMega ? "w-[540px]" : "w-[340px]"} max-w-[calc(100vw-2rem)]`}
      >
        <div className="rounded-2xl p-2 shadow-2xl shadow-black/25 border border-border bg-popover">
          {/* Header */}
          <div className="px-3.5 pt-2 pb-2 flex items-center gap-2 border-b border-border/40 mb-1.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{link.label}</span>
          </div>

          {/* Items grid */}
          <div className={isMega ? "grid grid-cols-2 gap-1" : "space-y-0.5"}>
            {link.children.map((child) => {
              const Icon = child.icon;
              return (
                <Link
                  key={child.label}
                  to={child.href}
                  className="flex items-start gap-3 px-3.5 py-3 rounded-xl hover:bg-primary/8 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4.5 h-4.5 text-primary" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {child.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-snug">
                      {child.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          {link.cta && (
            <div className="px-2 pt-1.5 pb-1 mt-1 border-t border-border/40">
              <Link
                to={link.cta.href}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-[12px] font-semibold text-primary hover:bg-primary/10 transition-all group"
              >
                {link.cta.label}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <nav className={`relative w-full transition-all duration-300 bg-background/95 backdrop-blur-xl border-b ${
      scrolled
        ? "border-border/60 shadow-lg shadow-black/5"
        : "border-border/40"
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6">
        <Link to="/" className="flex items-center shrink-0 mr-4 xl:mr-8">
          <img src={logoWhite} alt="Yess Host" className="h-8 lg:h-10" />
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 mr-auto">
          {navLinks.map((link, idx) => (
            <div
              key={link.label}
              className={`relative ${link.minor ? "hidden 2xl:block" : ""}`}
              onMouseEnter={() => link.children && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {isInternal(link.href) ? (
                <Link
                  to={link.href}
                  className={`flex items-center gap-1 px-2 xl:px-3 py-2 rounded-lg text-[14px] xl:text-[15px] font-semibold hover:text-foreground hover:bg-secondary/60 transition-all whitespace-nowrap ${
                    link.blink ? "text-primary animate-pulse" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className={`flex items-center gap-1 px-2 xl:px-3 py-2 rounded-lg text-[14px] xl:text-[15px] font-semibold hover:text-foreground hover:bg-secondary/60 transition-all whitespace-nowrap ${
                    link.blink ? "text-primary animate-pulse" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />}
                </a>
              )}

              <AnimatePresence>
                {link.children && activeDropdown === link.label && renderMegaDropdown(
                  link,
                  idx === 0 ? "left" : idx >= navLinks.length - 3 ? "right" : "center"
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0 ml-2">
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2.5 py-2 rounded-lg hover:bg-secondary/60"
          >
            <Globe className="w-4 h-4" />
            {lang === "bn" ? "EN" : "বাং"}
          </button>
          {user && <NotificationBell />}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center text-muted-foreground hover:text-foreground transition-colors px-2.5 py-2 rounded-lg hover:bg-secondary/60"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
          {user ? (
            <Link to="/dashboard"
              className="text-sm px-4 xl:px-5 py-2.5 rounded-xl font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              {tr("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="flex items-center gap-2 text-sm px-3 xl:px-4 py-2.5 rounded-xl font-semibold border border-border hover:bg-secondary/60 text-foreground transition-all">
                <LogIn className="w-4 h-4" /> {tr("nav.login")}
              </Link>
              <Link to="/signup"
                className="text-sm px-4 xl:px-5 py-2.5 rounded-xl font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                {tr("nav.signup")}
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden text-foreground p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-popover border-t border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-0.5 max-h-[calc(100vh-4rem-5rem)] overflow-y-auto">
              {navLinks.map((link) => (
                <div key={link.label}>
                  {link.children ? (
                    <>
                      <button
                        onClick={() => setMobileAccordion(mobileAccordion === link.label ? null : link.label)}
                        className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                      >
                        {link.label}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileAccordion === link.label ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {mobileAccordion === link.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-2 pb-1 space-y-0.5">
                              {link.children.map((child) => {
                                const Icon = child.icon;
                                return (
                                  <Link key={child.label} to={child.href}
                                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                                    onClick={() => setMobileOpen(false)}>
                                    <Icon className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium">{child.label}</p>
                                      <p className="text-[11px] text-muted-foreground/60">{child.desc}</p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link to={link.href}
                      className="block py-2.5 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                      onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
