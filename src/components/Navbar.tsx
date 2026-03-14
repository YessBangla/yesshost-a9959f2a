import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, MessageCircle } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";

const navLinks = [
  { label: "Home", href: "#" },
  {
    label: "Hosting",
    href: "#pricing",
    children: [
      { label: "Shared Hosting", href: "#pricing" },
      { label: "Cloud Hosting", href: "#pricing" },
      { label: "VPS Hosting", href: "#pricing" },
      { label: "WordPress Hosting", href: "#pricing" },
      { label: "Reseller Hosting", href: "#pricing" },
    ],
  },
  { label: "Domain", href: "#domain" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center">
          <img src={logoWhite} alt="YessHost" className="h-9" />
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
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                {link.label}
                {link.children && <ChevronDown className="w-3.5 h-3.5" />}
              </a>

              {/* Dropdown */}
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
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden xl:inline">+880 1234-567890</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-primary-foreground px-5 py-2.5 rounded-xl font-semibold gradient-primary hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <MessageCircle className="w-4 h-4" />
            Live Chat
          </a>
          <a
            href="#"
            className="text-sm px-5 py-2.5 rounded-xl font-semibold border border-border hover:bg-secondary/60 text-foreground transition-all"
          >
            Client Area
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-foreground p-2 rounded-lg hover:bg-secondary/60 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <a
                    href={link.href}
                    className="block py-3 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                    onClick={() => !link.children && setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                  {link.children && (
                    <div className="pl-4 space-y-1">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 space-y-2">
                <a
                  href="#"
                  className="block text-center text-sm gradient-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold"
                >
                  Live Chat
                </a>
                <a
                  href="#"
                  className="block text-center text-sm border border-border text-foreground px-4 py-3 rounded-xl font-semibold"
                >
                  Client Area
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
