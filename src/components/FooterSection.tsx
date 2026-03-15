import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import bkashLogo from "@/assets/partners/bkash.png";
import nagadLogo from "@/assets/partners/nagad.png";
import { Mail, Phone, CreditCard, Wallet, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const FooterSection = () => {
  const { tr, lang } = useLanguage();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const footerLinks: Record<string, { label: string; href: string }[]> = {
    [tr("footer.hosting")]: [
      { label: tr("nav.basicHosting"), href: "/services/basic-hosting" },
      { label: tr("nav.proHosting"), href: "/services/pro-hosting" },
      { label: tr("nav.premiumHosting"), href: "/services/premium-hosting" },
      { label: tr("nav.bdixHosting"), href: "/services/bdix-hosting" },
      { label: tr("nav.reseller"), href: "/services/linux-reseller" },
    ],
    [tr("footer.services")]: [
      { label: tr("footer.domainReg"), href: "/services/domain" },
      { label: tr("footer.vpsServer"), href: "/services/usa-vps" },
      { label: tr("footer.dedicatedServer"), href: "/services/dedicated" },
      { label: tr("nav.emailHosting"), href: "/services/email-hosting" },
      { label: tr("footer.radioHosting"), href: "/services/radio-hosting" },
      { label: tr("footer.graphicsDesign"), href: "/services/graphics-design" },
    ],
    [tr("footer.support")]: [
      { label: tr("footer.knowledgeBase"), href: "/knowledge-base" },
      { label: tr("footer.contactUs"), href: "/contact" },
      { label: lang === "bn" ? "পেমেন্ট মেথড" : "Payment Methods", href: "/payment" },
      { label: tr("footer.supportTicket"), href: "/dashboard/support" },
      { label: tr("footer.liveChat"), href: "/contact" },
    ],
    [tr("footer.company")]: [
      { label: tr("footer.aboutUs"), href: "/about" },
      { label: tr("footer.affiliate"), href: "/affiliate" },
      { label: tr("footer.tos"), href: "/terms" },
      { label: tr("footer.refund"), href: "/refund" },
      { label: tr("footer.privacy"), href: "/privacy" },
    ],
  };

  const payments = [
    { name: "bKash", logo: bkashLogo, type: "logo" },
    { name: "Nagad", logo: nagadLogo, type: "logo" },
    { name: "Rocket", icon: Wallet, type: "icon" },
    { name: "Visa", icon: CreditCard, type: "icon" },
    { name: "Mastercard", icon: CreditCard, type: "icon" },
  ];

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <footer className="border-t border-border py-8 sm:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Top: Logo + Contact */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8 mb-6 sm:mb-10">
          <div className="sm:flex-[2]">
            <img src={logoWhite} alt="YessHost" className="h-8 sm:h-10 mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 max-w-sm">
              {tr("footer.desc")}
            </p>
            <div className="flex flex-wrap gap-3 sm:flex-col sm:gap-2">
              <a href="tel:+8809638205205" className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> +88 096 38 205 205
              </a>
              <a href="mailto:support@yesshost.com" className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> support@yesshost.com
              </a>
            </div>
          </div>
        </div>

        {/* Links: Accordion on mobile, Grid on desktop */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold text-foreground mb-3 sm:mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile accordion links */}
        <div className="sm:hidden divide-y divide-border/60 border-y border-border/60 mb-6">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <button
                onClick={() => toggleSection(title)}
                className="flex items-center justify-between w-full py-3 text-sm font-semibold text-foreground"
              >
                {title}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openSection === title ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${openSection === title ? "max-h-60 pb-3" : "max-h-0"}`}>
                <ul className="space-y-2 pl-1">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="border-t border-border pt-5 sm:pt-8 mb-5 sm:mb-8">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 font-semibold uppercase tracking-wider">{tr("footer.paymentMethods")}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {payments.map((p) => (
              <Link
                key={p.name}
                to="/payment"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors border border-border group"
              >
                {p.type === "logo" ? (
                  <img src={p.logo} alt={p.name} className="h-4 sm:h-5 w-auto object-contain grayscale group-hover:grayscale-0 transition-all" />
                ) : (
                  <p.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-5 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[11px] sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} YessHost.com — {tr("footer.allRights")}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{tr("footer.allSystems")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;