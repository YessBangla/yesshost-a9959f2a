import { motion } from "framer-motion";
import {
  ArrowLeft, Eye, ShoppingCart, Check, Star, Package, Server, Shield, Globe, ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const categoryLabels: Record<string, { bn: string; en: string }> = {
  business: { bn: "ব্যবসা/কর্পোরেট", en: "Business" },
  ecommerce: { bn: "ই-কমার্স", en: "E-Commerce" },
  portfolio: { bn: "পোর্টফোলিও", en: "Portfolio" },
  restaurant: { bn: "রেস্টুরেন্ট", en: "Restaurant" },
  blog: { bn: "ব্লগ", en: "Blog" },
  landing: { bn: "ল্যান্ডিং পেইজ", en: "Landing Page" },
};

const ThemeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bn = lang === "bn";
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [includeHosting, setIncludeHosting] = useState(false);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("themes")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        setTheme(data);
        setLoading(false);
      });
  }, [slug]);

  const currentPrice = theme?.discount_price_bdt || theme?.price_bdt || 0;
  const totalPrice = includeHosting && theme?.hosting_bundle_price_bdt
    ? theme.hosting_bundle_price_bdt
    : currentPrice;

  const handleOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setOrdering(true);
    const { error } = await supabase.from("theme_orders").insert({
      user_id: user.id,
      theme_id: theme.id,
      amount_bdt: totalPrice,
      include_hosting: includeHosting,
      status: "pending",
    });
    setOrdering(false);
    if (error) {
      toast({ title: bn ? "ত্রুটি হয়েছে" : "Error occurred", variant: "destructive" });
    } else {
      toast({
        title: bn ? "অর্ডার সফল!" : "Order placed!",
        description: bn
          ? "আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।"
          : "Our team will contact you shortly.",
      });
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-24 pb-16 container mx-auto px-4">
          <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
            <div className="h-8 bg-secondary/50 rounded w-1/3" />
            <div className="h-64 bg-secondary/50 rounded-2xl" />
            <div className="h-6 bg-secondary/50 rounded w-2/3" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!theme) {
    return (
      <PublicLayout>
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-lg">{bn ? "থিম পাওয়া যায়নি" : "Theme not found"}</p>
          <Link to="/themes" className="text-primary hover:underline mt-4 inline-block">
            {bn ? "সকল থিম দেখুন" : "View all themes"}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const features = Array.isArray(theme.features) ? theme.features : [];
  const bundleFeatures = Array.isArray(theme.hosting_bundle_features) ? theme.hosting_bundle_features : [];

  return (
    <PublicLayout>
      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/themes" className="hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> {bn ? "সকল থিম" : "All Themes"}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{theme.name}</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Preview & Features */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 space-y-6">
              {/* Thumbnail */}
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img src={theme.thumbnail_url} alt={theme.name} className="w-full h-auto object-cover" />
                {theme.preview_url && (
                  <a
                    href={theme.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-lg"
                  >
                    <Eye className="w-4 h-4" /> {bn ? "লাইভ প্রিভিউ" : "Live Preview"}
                  </a>
                )}
              </div>

              {/* Description */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-3">{bn ? "বিবরণ" : "Description"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bn ? theme.description_bn : theme.description_en}
                </p>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">{bn ? "ফিচারসমূহ" : "Features"}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right: Pricing Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
              <div className="glass-card p-6 sticky top-28 space-y-5">
                <div>
                  <Badge variant="outline" className="mb-3">
                    {bn ? categoryLabels[theme.category]?.bn : categoryLabels[theme.category]?.en}
                  </Badge>
                  <h1 className="text-2xl font-extrabold text-foreground">{theme.name}</h1>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-primary">৳{currentPrice}</span>
                  {theme.discount_price_bdt && (
                    <span className="text-lg text-muted-foreground line-through">৳{theme.price_bdt}</span>
                  )}
                </div>

                {/* Hosting Bundle */}
                {theme.hosting_bundle_price_bdt && (
                  <div
                    onClick={() => setIncludeHosting(!includeHosting)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      includeHosting
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-bold text-foreground text-sm">
                          {bn ? "হোস্টিং বান্ডেল" : "Hosting Bundle"}
                        </span>
                      </div>
                      <span className="text-lg font-extrabold text-primary">
                        ৳{theme.hosting_bundle_price_bdt}
                      </span>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      {bundleFeatures.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    {includeHosting && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {bn
                            ? `সাশ্রয় করুন ৳${currentPrice + (theme.hosting_bundle_price_bdt - currentPrice > 0 ? 0 : Math.abs(theme.hosting_bundle_price_bdt - currentPrice))}`
                            : "Bundle selected!"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <span className="font-semibold text-foreground">{bn ? "মোট" : "Total"}</span>
                  <span className="text-2xl font-extrabold text-foreground">৳{totalPrice}</span>
                </div>

                {/* Order Button */}
                <Button
                  onClick={handleOrder}
                  disabled={ordering}
                  className="w-full gradient-primary text-primary-foreground py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {ordering
                    ? (bn ? "প্রসেসিং..." : "Processing...")
                    : (bn ? "অর্ডার করুন" : "Order Now")}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {bn
                    ? "অর্ডার করার পর আমাদের টিম আপনার সাথে যোগাযোগ করবে পেমেন্ট ও সেটআপের জন্য।"
                    : "After ordering, our team will contact you for payment and setup."}
                </p>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  {[
                    { icon: Shield, label: bn ? "নিরাপদ" : "Secure" },
                    { icon: Server, label: bn ? "দ্রুত" : "Fast" },
                    { icon: Globe, label: bn ? "24/7 সাপোর্ট" : "24/7 Support" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 text-center">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default ThemeDetail;
