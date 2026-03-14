import logoWhite from "@/assets/logo-white.png";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Hosting: ["Basic Web Hosting", "Pro Web Hosting", "Premium Hosting", "BDIX Hosting", "Reseller Hosting"],
  Services: ["Domain Registration", "VPS Server", "Dedicated Server", "Email Hosting", "Radio Hosting", "Graphics Design"],
  Support: ["Knowledge Base", "Contact Us", "Support Ticket", "Live Chat"],
  Company: ["About Us", "Affiliate", "Terms of Service", "Refund Policy", "Privacy Policy"],
};

const payments = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard"];

const FooterSection = () => {
  return (
    <footer className="border-t border-border py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <img src={logoWhite} alt="PutulHost" className="h-10 mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Premium Quality Domain & Web Hosting Service। ২৪/৭ সাপোর্ট, ৯৯.৯% আপটাইম গ্যারান্টি।
            </p>
            <div className="space-y-2">
              <a href="tel:+8809638205205" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" /> +88 096 38 205 205 (10AM-8PM)
              </a>
              <a href="mailto:support@putulhost.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" /> support@putulhost.com
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="border-t border-border pt-8 mb-8">
          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Payment Methods</p>
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
            © {new Date().getFullYear()} PutulHost.com — All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
