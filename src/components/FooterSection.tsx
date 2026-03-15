import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import bkashLogo from "@/assets/partners/bkash.png";
import nagadLogo from "@/assets/partners/nagad.png";
import { Mail, Phone, CreditCard, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FooterSection = () => {
  const { tr, lang } = useLanguage();

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

  const payments = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard"];

  return (
    <footer className="border-t border-border py-10 sm:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="col-span-2">
            <img src={logoWhite} alt="YessHost" className="h-10 mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {tr("footer.desc")}
            </p>
            <div className="space-y-2">
              <a href="tel:+8809638205205" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" /> +88 096 38 205 205 (10AM-8PM)
              </a>
              <a href="mailto:support@yesshost.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" /> support@yesshost.com
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 mb-8">
          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">{tr("footer.paymentMethods")}</p>
          <div className="flex flex-wrap gap-2">
            {payments.map((p) => (
              <span key={p} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-muted-foreground border border-border">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} YessHost.com — {tr("footer.allRights")}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-muted-foreground">{tr("footer.allSystems")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
