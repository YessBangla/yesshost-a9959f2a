import logoWhite from "@/assets/logo-white.png";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Hosting: ["Shared Hosting", "Cloud Hosting", "VPS Hosting", "WordPress Hosting", "Reseller Hosting"],
  Services: ["Domain Registration", "SSL Certificates", "Web Development", "Email Hosting"],
  Support: ["Knowledge Base", "Status Page", "Contact Us", "Community"],
  Company: ["About Us", "Blog", "Affiliates", "Terms & Conditions", "Privacy Policy"],
};

const payments = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "PayPal"];

const FooterSection = () => {
  return (
    <footer className="border-t border-border py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <img src={logoWhite} alt="YessHost" className="h-10 mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ওয়েব হোস্টিং সেবা। ২৪/৭ সাপোর্ট, ৯৯.৯৯% আপটাইম গ্যারান্টি।
            </p>
            <div className="space-y-2">
              <a href="tel:+8801234567890" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" /> +880 1234-567890
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
            © {new Date().getFullYear()} YessHost.com — All rights reserved.
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
