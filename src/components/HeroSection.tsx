import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Shield, Zap, Clock, Globe, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const iconMap: Record<string, typeof Globe> = { Globe, Clock, Zap, Shield };

const defaultDomainPrices = [
  { ext: ".top", price: "১৮০", popular: false },
  { ext: ".xyz", price: "২৯৫", popular: false },
  { ext: ".fun", price: "৩৮০", popular: false },
  { ext: ".shop", price: "৩৯০", popular: false },
  { ext: ".com", price: "৯৯০", popular: true },
];

const HeroSection = () => {
  const [domain, setDomain] = useState("");
  const { tr, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [siteContent, setSiteContent] = useState<any[]>([]);

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "home").eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setSiteContent(data || []));
  }, []);

  const getContent = (key: string) => siteContent.find(c => c.section_key === key) || null;

  const getText = (key: string, fallbackKey: string) => {
    const item = getContent(key);
    if (!item) return tr(fallbackKey);
    return lang === "bn" ? (item.title_bn || tr(fallbackKey)) : (item.title_en || tr(fallbackKey));
  };

  const domainPrices = useMemo(() => {
    const item = getContent("hero_domain_prices");
    if (item?.metadata?.prices) return item.metadata.prices;
    return defaultDomainPrices;
  }, [siteContent]);

  const stats = useMemo(() => {
    const item = getContent("hero_stats");
    if (item?.metadata?.stats) {
      return item.metadata.stats.map((s: any) => ({
        icon: iconMap[s.icon] || Globe,
        value: s.value,
        label: lang === "bn" ? s.label_bn : s.label_en,
      }));
    }
    return [
      { icon: Globe, value: "50K+", label: tr("hero.activeWebsites") },
      { icon: Clock, value: "99.9%", label: tr("hero.uptimeGuarantee") },
      { icon: Zap, value: "LiteSpeed", label: tr("hero.webServer") },
      { icon: Shield, value: "24/7", label: tr("hero.expertSupport") },
    ];
  }, [siteContent, lang]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Error", description: tr("auth.passwordMinError"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: tr("auth.accountCreated") });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Hero content + Domain search */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full glass-card text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-muted-foreground">{getText("hero_offer", "hero.offer")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: brandCurve, delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-extrabold tracking-tight leading-[1.1] mb-4"
            >
              {getText("hero_title1", "hero.title1")}
              <br />
              <span className="text-gradient-primary">{getText("hero_title2", "hero.title2")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve, delay: 0.2 }}
              className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
            >
              {getText("hero_subtitle", "hero.subtitle")}
            </motion.p>

            {/* Domain search */}
            <motion.div
              id="domain"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: brandCurve, delay: 0.3 }}
              className="max-w-lg mx-auto lg:mx-0 mb-6"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl glass-card-elevated">
                <div className="flex items-center gap-3 flex-1 px-4">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder={getText("hero_placeholder", "hero.placeholder")}
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-3"
                  />
                </div>
                <button className="shrink-0 flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                  {getText("hero_register", "hero.register")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Domain prices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: brandCurve, delay: 0.4 }}
              className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8"
            >
              {domainPrices.map((d: any) => (
                <div
                  key={d.ext}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs transition-all hover:scale-105 cursor-pointer ${
                    d.popular ? "glow-border" : ""
                  }`}
                >
                  <span className="font-bold text-foreground">{d.ext}</span>
                  <span className="text-muted-foreground">৳{d.price}</span>
                  {d.popular && (
                    <span className="text-[10px] font-bold gradient-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {tr("pricing.popular")}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: brandCurve, delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto lg:mx-0"
            >
              {stats.map((stat: any) => (
                <div key={stat.label} className="glass-card p-3 text-center group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-extrabold tabular-nums text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Registration form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: brandCurve, delay: 0.3 }}
            className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
          >
            {user ? (
              <div className="glass-card-elevated p-8 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {lang === "bn" ? "স্বাগতম!" : "Welcome!"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {lang === "bn" ? "আপনি ইতিমধ্যে লগইন আছেন।" : "You are already logged in."}
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  {tr("nav.dashboard")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="glass-card-elevated p-6 sm:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-foreground">
                    {tr("auth.createAccount")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tr("auth.createAccountSubtitle")}
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={tr("auth.fullNamePlaceholder")}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tr("auth.passwordMin")}
                      required
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {tr("auth.createAccount")}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  {tr("auth.hasAccount")}{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    {tr("auth.signIn")}
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
