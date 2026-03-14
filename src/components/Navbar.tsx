import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, LogIn, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user } = useAuth();
  const { lang, setLang, tr } = useLanguage();

  const navLinks = [
    { label: tr("nav.domain"), href: "#domain" },
    {
      label: tr("nav.webHosting"),
      href: "#pricing",
      children: [
        { label: tr("nav.basicHosting"), href: "#pricing" },
        { label: tr("nav.proHosting"), href: "#pricing" },
        { label: tr("nav.premiumHosting"), href: "#pricing" },
        { label: tr("nav.bdixHosting"), href: "#pricing" },
      ],
    },
    {
      label: tr("nav.reseller"),
      href: "#pricing",
      children: [
        { label: tr("nav.linuxReseller"), href: "#pricing" },
        { label: tr("nav.bdixReseller"), href: "#pricing" },
      ],
    },
    {
      label: tr("nav.vps"),
      href: "#pricing",
      children: [
        { label: tr("nav.usaVps"), href: "#pricing" },
        { label: tr("nav.bdixVps"), href: "#pricing" },
      ],
    },
    { label: tr("nav.dedicated"), href: "#pricing" },
    {
      label: tr("nav.services"),
      href: "#",
      children: [
        { label: tr("nav.emailHosting"), href: "#pricing" },
        { label: tr("nav.radioHosting"), href: "#" },
        { label: tr("nav.graphicsDesign"), href: "#" },
      ],
    },
    { label: tr("nav.about"), href: "#about" },
    { label: tr("nav.contact"), href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center">
          <img src={logoWhite} alt="PutulHost" className="h-9" />
        </a>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.children && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href={link.href}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                {link.label}
                {link.children && <ChevronDown className="w-3.5 h-3.5" />}
              </a>

              <AnimatePresence>
                {link.children && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 pt-2 min-w-[200px]"
                  >
                    <div className="glass-card-elevated p-2">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {/* Language switcher */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary/60"
          >
            <Globe className="w-4 h-4" />
            {lang === "bn" ? "EN" : "বাং"}
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
          className="lg:hidden text-foreground p-2 rounded-lg hover:bg-secondary/60 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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
            <div className="px-4 py-4 space-y-1">
              {/* Language switcher mobile */}
              <button
                onClick={() => setLang(lang === "bn" ? "en" : "bn")}
                className="flex items-center gap-2 w-full py-3 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                <Globe className="w-4 h-4" />
                {lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
              </button>
              {navLinks.map((link) => (
                <div key={link.label}>
                  <a href={link.href}
                    className="block py-3 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                    onClick={() => !link.children && setMobileOpen(false)}>
                    {link.label}
                  </a>
                  {link.children && (
                    <div className="pl-4 space-y-1">
                      {link.children.map((child) => (
                        <a key={child.label} href={child.href}
                          className="block py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileOpen(false)}>
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 space-y-2">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                    className="block text-center text-sm gradient-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold">
                    {tr("nav.dashboard")}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="block text-center text-sm border border-border text-foreground px-4 py-3 rounded-xl font-semibold">
                      {tr("nav.login")}
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}
                      className="block text-center text-sm gradient-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold">
                      {tr("nav.signup")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
