import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Star, Server, Globe, Shield, Zap, Clock, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const iconMap: Record<string, typeof Server> = { Server, Globe, Shield, Zap, Clock, Headphones };

const ServiceDetail = () => {
  const { slug } = useParams();
  const { lang, tr } = useLanguage();
  const isBn = lang === "bn";

  const [plans, setPlans] = useState<any[]>([]);
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      supabase.from("pricing_plans").select("*").eq("slug", slug).eq("is_active", true).order("sort_order"),
      supabase.from("site_content").select("*").eq("page", "services").eq("section_key", slug).eq("is_active", true).maybeSingle(),
    ]).then(([plansRes, infoRes]) => {
      setPlans(plansRes.data || []);
      setServiceInfo(infoRes.data);
      setLoading(false);
    });
  }, [slug]);

  const title = serviceInfo ? (isBn ? serviceInfo.title_bn : serviceInfo.title_en) : slug;
  const description = serviceInfo ? (isBn ? serviceInfo.content_bn : serviceInfo.content_en) : "";
  const ServiceIcon = serviceInfo?.metadata?.icon ? (iconMap[serviceInfo.metadata.icon] || Globe) : Globe;

  const highlights = useMemo(() => {
    if (!serviceInfo?.metadata?.highlights) return [];
    return serviceInfo.metadata.highlights.map((h: any) => ({
      icon: iconMap[h.icon] || Zap,
      label: isBn ? h.label_bn : h.label_en,
    }));
  }, [serviceInfo, isBn]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!serviceInfo && plans.length === 0) {
    return (
      <PublicLayout>
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{isBn ? "পেইজ পাওয়া যায়নি" : "Page Not Found"}</h1>
          <Link to="/" className="text-primary hover:underline">{isBn ? "হোমপেইজে ফিরুন" : "Go Home"}</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: brandCurve }}
            className="text-center max-w-3xl mx-auto"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {isBn ? "হোমপেইজ" : "Home"}
            </Link>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <ServiceIcon className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {description}
            </p>
          </motion.div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 mt-10"
            >
              {highlights.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-sm">
                  <h.icon className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{h.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Plans */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={`relative rounded-2xl overflow-hidden ${plan.is_highlighted ? "glass-card-elevated glow-border" : "glass-card"}`}
                >
                  {plan.is_highlighted && <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />}
                  {plan.is_highlighted && (
                    <div className="absolute -top-0 right-4 flex items-center gap-1 px-3 py-1.5 gradient-primary text-primary-foreground text-xs font-bold rounded-b-lg">
                      <Star className="w-3 h-3 fill-current" /> {tr("pricing.popular")}
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
                    {plan.subtitle && <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>}
                    <div className="flex items-baseline gap-1 my-4">
                      <span className="text-4xl md:text-5xl font-extrabold tabular-nums text-foreground">৳{plan.price_bdt}</span>
                      <span className="text-sm text-muted-foreground">{tr("pricing.mo")}</span>
                    </div>
                    {plan.annual_price_bdt && (
                      <p className="text-xs text-muted-foreground mb-4">৳{plan.annual_price_bdt} {tr("pricing.billedAnnually")}</p>
                    )}
                    <ul className="space-y-3 mb-8">
                      {features.map((f: string) => (
                        <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/signup"
                      className={`w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        plan.is_highlighted
                          ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      {tr("pricing.orderNow")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
      <FooterSection />
    </div>
  );
};

export default ServiceDetail;
