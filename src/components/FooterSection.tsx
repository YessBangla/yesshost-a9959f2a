import logoWhite from "@/assets/logo-white.png";

const footerLinks = {
  Product: ["Shared Hosting", "VPS Hosting", "Dedicated Servers", "Domain Names", "SSL Certificates"],
  Company: ["About Us", "Blog", "Affiliates", "Contact Us"],
  Support: ["Knowledge Base", "Web Development Services", "Status Page", "Community"],
  Legal: ["Terms & Condition", "Privacy Policy", "SLA", "GDPR"],
};

const FooterSection = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img src={logoWhite} alt="YessHost" className="h-10 mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Yes, It's a Super Hosting Solution! Enterprise-grade hosting for the modern web.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} YessHost.com, All rights reserved.
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
