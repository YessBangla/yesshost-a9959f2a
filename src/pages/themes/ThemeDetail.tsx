import { motion } from "framer-motion";
import {
  ArrowLeft, Eye, ShoppingCart, Check, Star, Package, Server, Shield, Globe, ChevronRight, Zap, Store,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { buyTheme } from "@/lib/theme-store.functions";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/formatPrice";

const categoryLabels: Record<string, { bn: string; en: string }> = {
  business: { bn: "ব্যবসা/কর্পোরেট", en: "Business" },
  ecommerce: { bn: "ই-কমার্স", en: "E-Commerce" },
  portfolio: { bn: "পোর্টফোলিও", en: "Portfolio" },
  restaurant: { bn: "রেস্টুরেন্ট", en: "Restaurant" },
  blog: { bn: "ব্লগ", en: "Blog" },
  landing: { bn: "ল্যান্ডিং পেইজ", en: "Landing Page" },
  education: { bn: "শিক্ষা", en: "Education" },
  healthcare: { bn: "স্বাস্থ্যসেবা", en: "Healthcare" },
  news: { bn: "নিউজ পোর্টাল", en: "News" },
  agency: { bn: "এজেন্সি", en: "Agency" },
  realestate: { bn: "রিয়েল এস্টেট", en: "Real Estate" },
  travel: { bn: "ট্রাভেল", en: "Travel" },
};

const ThemeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const { addItem, isInCart } = useCart();
  const bn = lang === "bn";
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [includeHosting, setIncludeHosting] = useState(false);
  const [seller, setSeller] = useState<{ display_name: string; slug: string; logo_url: string | null } | null>(null);
  const [buying, setBuying] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const buy = useServerFn(buyTheme);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("themes")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(async ({ data }) => {
        setTheme(data);
        setLoading(false);
        if (data?.seller_user_id) {
          const { data: sp } = await supabase
            .from("theme_seller_profiles")
            .select("display_name,slug,logo_url")
            .eq("user_id", data.seller_user_id)
            .eq("is_public", true)
            .maybeSingle();
          setSeller(sp ?? null);
        }
      });
  }, [slug]);

  const handleBuyNow = async () => {
    if (!theme) return;
    if (!user) {
      toast.error(bn ? "কেনার জন্য প্রথমে লগইন করুন" : "Please sign in to purchase");
      navigate("/login");
      return;
    }
    setBuying(true);
    try {
      const res = await buy({ data: { themeId: theme.id, includeHosting } });
      toast.success(
        bn
          ? `ইনভয়েস ${res.invoiceNumber} তৈরি হয়েছে — পরিশোধ করলেই ডাউনলোড খুলে যাবে`
          : `Invoice ${res.invoiceNumber} created — download unlocks after payment`,
      );
      navigate("/dashboard/billing");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      toast.error(
        msg.includes("already_owned")
          ? bn ? "আপনি ইতিমধ্যে এই থিমটি কিনেছেন" : "You already own this theme"
          : bn ? "কেনা সম্পন্ন করা যায়নি, আবার চেষ্টা করুন" : "Could not complete the purchase, please try again",
      );
    } finally {
      setBuying(false);
    }
  };

  const currentPrice = theme?.discount_price_bdt || theme?.price_bdt || 0;
  const totalPrice = includeHosting && theme?.hosting_bundle_price_bdt
    ? theme.hosting_bundle_price_bdt
    : currentPrice;

  const cartId = theme ? `theme-${theme.id}${includeHosting ? "-bundle" : ""}` : "";

  const handleAddToCart = () => {
    if (!theme) return;
    addItem({
      id: cartId,
      type: "theme",
      name: theme.name,
      description: includeHosting
        ? (bn ? "থিম + হোস্টিং বান্ডেল" : "Theme + Hosting Bundle")
        : (bn ? "ওয়েবসাইট থিম" : "Website Theme"),
      price_bdt: String(totalPrice),
      theme_id: theme.id,
      theme_slug: theme.slug,
      include_hosting: includeHosting,
      thumbnail_url: theme.thumbnail_url,
    });
  };

  const inCart = isInCart(cartId);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-24 pb-16 container mx-auto px-4">
          <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
            <div className="h-8 bg-secondary/50 rounded-sm w-1/3" />
            <div className="h-64 bg-secondary/50 rounded-2xl" />
            <div className="h-6 bg-secondary/50 rounded-sm w-2/3" />
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
      <SEOHead title={`${theme.name} Theme - Yess Host`} description={bn ? (theme.description_bn || `${theme.name} থিম - Yess Host`) : (theme.description_en || `${theme.name} theme - professional website template from Yess Host.`)} canonical={`/themes/${theme.slug}`} />
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
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img src={theme.thumbnail_url} alt={theme.name} className="w-full h-auto object-cover" />
                {theme.preview_url && (
                  <Link to={`/themes/${theme.slug}/demo`} className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-lg">
                    <Eye className="w-4 h-4" /> {bn ? "লাইভ প্রিভিউ" : "Live Preview"}
                  </Link>
                )}
              </div>
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-3">{bn ? "বিবরণ" : "Description"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{bn ? theme.description_bn : theme.description_en}</p>
              </div>
              {features.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">{bn ? "ফিচারসমূহ" : "Features"}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />{f}
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
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-primary">৳{formatAmount(currentPrice, lang)}</span>
                  {theme.discount_price_bdt && (
                    <span className="text-lg text-muted-foreground line-through">৳{formatAmount(theme.price_bdt, lang)}</span>
                  )}
                </div>

                {/* Hosting Bundle */}
                {theme.hosting_bundle_price_bdt && (
                  <div
                    onClick={() => setIncludeHosting(!includeHosting)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${includeHosting ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-bold text-foreground text-sm">{bn ? "হোস্টিং বান্ডেল" : "Hosting Bundle"}</span>
                      </div>
                      <span className="text-lg font-extrabold text-primary">৳{formatAmount(theme.hosting_bundle_price_bdt, lang)}</span>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      {bundleFeatures.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary shrink-0" />{f}
                        </div>
                      ))}
                    </div>
                    {includeHosting && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1">
                          <Star className="w-3 h-3" />{bn ? "বান্ডেল নির্বাচিত!" : "Bundle selected!"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <span className="font-semibold text-foreground">{bn ? "মোট" : "Total"}</span>
                  <span className="text-2xl font-extrabold text-foreground">৳{formatAmount(totalPrice, lang)}</span>
                </div>

                {/* Live Demo Button */}
                {theme.preview_url && (
                  <Link
                    to={`/themes/${theme.slug}/demo`}
                    className="w-full py-4 text-base font-semibold rounded-xl flex items-center justify-center gap-2 transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-primary/30 shadow-md"
                  >
                    <Eye className="w-5 h-5" />
                    {bn ? "ডেমো দেখুন" : "View Demo"}
                  </Link>
                )}

                {/* Buy Now */}
                <button
                  onClick={() => void handleBuyNow()}
                  disabled={buying}
                  className="w-full bg-primary text-primary-foreground py-4 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-60"
                >
                  <Zap className="w-5 h-5" />
                  {buying ? (bn ? "প্রসেস হচ্ছে..." : "Processing...") : bn ? "এখনই কিনুন" : "Buy Now"}
                </button>

                {seller && (
                  <Link
                    to={`/sellers/${seller.slug}`}
                    className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {seller.logo_url ? (
                      <img src={seller.logo_url} alt={seller.display_name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <Store className="w-4 h-4 text-primary" />
                    )}
                    <span>{bn ? "সেলার: " : "Seller: "}<strong className="text-foreground">{seller.display_name}</strong></span>
                  </Link>
                )}

                {/* Add to Cart Button */}
                {inCart ? (
                  <div className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-secondary text-foreground border border-border font-semibold">
                    <Check className="w-5 h-5 text-primary" />
                    {bn ? "কার্টে যোগ হয়েছে" : "Added to Cart"}
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full gradient-primary text-primary-foreground py-4 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {bn ? "কার্টে যোগ করুন" : "Add to Cart"}
                  </button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  {bn ? "কার্টে যোগ করে চেকআউট থেকে পেমেন্ট করুন।" : "Add to cart and pay from checkout."}
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
    </PublicLayout>
  );
};

export default ThemeDetail;
