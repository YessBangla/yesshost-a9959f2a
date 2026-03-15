import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, LogIn, Globe, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import logoWhite from "@/assets/logo-white.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const { user } = useAuth();
  const { lang, setLang, tr } = useLanguage();
  const { itemCount, setCartOpen } = useCart();

  const navLinks = [
    {
      label: tr("nav.domain"),
      href: "/services/domain",
      children: [
        { label: lang === "bn" ? "ডোমেইন রেজিস্ট্রেশন" : "Domain Registration", href: "/services/domain" },
        { label: lang === "bn" ? "ডোমেইন মূল্য তালিকা" : "Domain Pricing", href: "/domain-pricing" },
      ],
    },
    {
      label: tr("nav.webHosting"),
      href: "/services/basic-hosting",
      children: [
        { label: tr("nav.basicHosting"), href: "/services/basic-hosting" },
        { label: tr("nav.proHosting"), href: "/services/pro-hosting" },
        { label: tr("nav.premiumHosting"), href: "/services/premium-hosting" },
        { label: tr("nav.bdixHosting"), href: "/services/bdix-hosting" },
      ],
    },
    {
      label: tr("nav.reseller"),
      href: "/services/linux-reseller",
      children: [
        { label: tr("nav.linuxReseller"), href: "/services/linux-reseller" },
        { label: tr("nav.bdixReseller"), href: "/services/bdix-reseller" },
      ],
    },
    {
      label: tr("nav.vps"),
      href: "/services/usa-vps",
      children: [
        { label: tr("nav.usaVps"), href: "/services/usa-vps" },
        { label: tr("nav.bdixVps"), href: "/services/bdix-vps" },
      ],
    },
    { label: tr("nav.dedicated"), href: "/services/dedicated" },
    {
      label: tr("nav.services"),
      href: "#",
      children: [
        { label: tr("nav.emailHosting"), href: "/services/email-hosting" },
        { label: tr("nav.radioHosting"), href: "/services/radio-hosting" },
        { label: tr("nav.graphicsDesign"), href: "/services/graphics-design" },
      ],
    },
    { label: tr("nav.about"), href: "/about" },
    { label: tr("nav.themes"), href: "/themes" },
    { label: tr("nav.contact"), href: "/contact" },
  ];

  const isInternal = (href: string) => href.startsWith("/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6">
        <Link to="/" className="flex items-center shrink-0">
          <img src={logoWhite} alt="YessHost" className="h-7 lg:h-9" />
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.children && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {isInternal(link.href) ? (
                <Link
                  to={link.href}
                  className="flex items-center gap-1 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all whitespace-nowrap"
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="flex items-center gap-1 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all whitespace-nowrap"
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                </a>
              )}

              <AnimatePresence>
                {link.children && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 min-w-[240px]"
                  >
                    <div className="glass-card-elevated rounded-xl p-1.5 shadow-xl shadow-black/20 border border-border/60">
                      <div className="px-3 pt-2 pb-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{link.label}</p>
                      </div>
                      <div className="space-y-0.5">
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.href}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all whitespace-nowrap group"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary/60"
          >
            <Globe className="w-4 h-4" />
            {lang === "bn" ? "EN" : "বাং"}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary/60"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          <a href="tel:+8809638205205"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            <Phone className="w-4 h-4" />
            <span className="hidden xl:inline">+88 096 38 205 205</span>
          </a>
          {user ? (
            <Link to="/dashboard"
              className="text-sm px-5 py-2.5 rounded-xl font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              {tr("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold border border-border hover:bg-secondary/60 text-foreground transition-all">
                <LogIn className="w-4 h-4" /> {tr("nav.login")}
              </Link>
              <Link to="/signup"
                className="text-sm px-5 py-2.5 rounded-xl font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20">
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-border overflow-hidden"
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
                            <div className="pl-4 pb-1 space-y-0.5">
                              {link.children.map((child) => (
                                <Link key={child.label} to={child.href}
                                  className="block py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                                  onClick={() => setMobileOpen(false)}>
                                  {child.label}
                                </Link>
                              ))}
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
