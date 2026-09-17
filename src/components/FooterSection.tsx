import { Link } from "@/lib/router-compat";
import logoWhite from "@/assets/logo-white.png";
import bkashLogo from "@/assets/partners/bkash.png";
import nagadLogo from "@/assets/partners/nagad.png";
import { Mail, Phone, CreditCard, Wallet, ChevronDown, MapPin, Facebook, Youtube, MessageCircle, ArrowUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const FooterSection = () => {
  const { tr, lang } = useLanguage();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const bn = lang === "bn";

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
      { label: bn ? "পেমেন্ট মেথড" : "Payment Methods", href: "/payment" },
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[hsl(220,25%,8%)] text-white overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(260,30%,12%)]/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(260,100%,60%)]/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Main footer content */}
        <div className="container mx-auto px-4 pt-12 sm:pt-16 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="lg:col-span-4">
              <img src={logoWhite} alt="Yess Host" className="h-9 sm:h-10 mb-5" />
              <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-sm">
                {tr("footer.desc")}
              </p>

              {/* Contact info */}
              <div className="space-y-3 mb-6">
                <a href="tel:+8801805464343" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  +88 096 38 205 205
                </a>
                <a href="mailto:support@yesshost.com" className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  support@yesshost.com
                </a>
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {bn ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}
                </div>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-2">
              {[
                  { icon: Facebook, label: "Facebook", href: "https://facebook.com/yesshost" },
                  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@yesshost" },
                  { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/8801805464343" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links columns — desktop */}
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-6 lg:col-span-8">
              {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                  <h4 className="text-xs font-bold text-white/90 uppercase tracking-widest mb-4 pb-2 border-b border-white/[0.08]">
                    {title}
                  </h4>
                  <ul className="space-y-2.5">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          className="text-sm text-white/50 hover:text-white hover:pl-1 transition-all duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Mobile accordion links */}
            <div className="sm:hidden divide-y divide-white/[0.08] border-y border-white/[0.08] lg:col-span-8">
              {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                  <button
                    onClick={() => toggleSection(title)}
                    className="flex items-center justify-between w-full py-3.5 text-sm font-semibold text-white/90"
                  >
                    {title}
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${openSection === title ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${openSection === title ? "max-h-60 pb-3" : "max-h-0"}`}>
                    <ul className="space-y-2 pl-1">
                      {links.map((link) => (
                        <li key={link.label}>
                          <Link to={link.href} className="text-xs text-white/50 hover:text-white transition-colors">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment methods bar */}
        <div className="border-t border-white/[0.08]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">
                {tr("footer.paymentMethods")}
              </p>
              <div className="flex flex-wrap gap-2">
                {payments.map((p) => (
                  <Link
                    key={p.name}
                    to="/payment"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all group"
                  >
                    {p.type === "logo" ? (
                      <img src={p.logo} alt={p.name} className="h-4 sm:h-5 w-auto object-contain brightness-0 invert opacity-50 group-hover:opacity-80 transition-all" />
                    ) : p.icon ? (
                      <p.icon className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                    ) : null}
                    <span className="text-[11px] font-medium text-white/40 group-hover:text-white/70 transition-colors">{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] bg-black/20">
          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] sm:text-xs text-white/35 text-center sm:text-left">
              © {new Date().getFullYear()} YessHost.com — {tr("footer.allRights")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-white/40">{tr("footer.allSystems")}</span>
              </div>
              <button
                onClick={scrollToTop}
                className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.12] transition-all"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
