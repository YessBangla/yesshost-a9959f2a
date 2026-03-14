const footerLinks = {
  Product: ["Shared Hosting", "VPS Hosting", "Dedicated Servers", "Domain Names", "SSL Certificates"],
  Company: ["About Us", "Blog", "Careers", "Contact"],
  Support: ["Knowledge Base", "API Docs", "Status Page", "Community"],
  Legal: ["Privacy Policy", "Terms of Service", "SLA", "GDPR"],
};

const FooterSection = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">H</span>
              </div>
              <span className="text-foreground font-display font-semibold text-lg tracking-tight">HostForge</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enterprise-grade hosting infrastructure for the modern web.
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
            © 2026 HostForge. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
