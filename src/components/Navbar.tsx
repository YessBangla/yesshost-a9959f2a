import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Web Hosting", href: "#pricing" },
  { label: "Domain", href: "#domain" },
  { label: "Features", href: "#features" },
  { label: "About Us", href: "#about" },
  { label: "Contact Us", href: "#contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center">
          <img src={logoWhite} alt="YessHost" className="h-10" />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#"
            className="text-sm bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:brightness-110 transition-all"
          >
            Client Area
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-surface border-t border-border px-4 pb-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#"
            className="block mt-2 text-center text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold"
          >
            Client Area
          </a>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
