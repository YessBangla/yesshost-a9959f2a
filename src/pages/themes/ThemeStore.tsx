import { motion } from "framer-motion";
import { Search, Palette, Star, Eye, ShoppingCart, Sparkles, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";

const categoryLabels: Record<string, { bn: string; en: string }> = {
  all: { bn: "সকল", en: "All" },
  business: { bn: "ব্যবসা/কর্পোরেট", en: "Business" },
  ecommerce: { bn: "ই-কমার্স", en: "E-Commerce" },
  portfolio: { bn: "পোর্টফোলিও", en: "Portfolio" },
  restaurant: { bn: "রেস্টুরেন্ট", en: "Restaurant" },
  blog: { bn: "ব্লগ", en: "Blog" },
  landing: { bn: "ল্যান্ডিং পেইজ", en: "Landing Page" },
};

const ThemeStore = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { addItem, isInCart } = useCart();
  const [themes, setThemes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("themes")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setThemes(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return themes.filter((t) => {
      const matchCategory = activeCategory === "all" || t.category === activeCategory;
      const matchSearch = (bn ? t.description_bn : t.description_en || t.name)
        .toLowerCase()
        .includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [themes, activeCategory, search, bn]);

  return (
    <PublicLayout>
      <div className="pt-20 lg:pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Palette className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "ওয়েবসাইট থিম বান্ডেল" : "Website Theme Bundle"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {bn
                ? "প্রফেশনাল রেডিমেড থিম বেছে নিন — হোস্টিং সহ বান্ডেল অফারে সাশ্রয় করুন!"
                : "Choose professional ready-made themes — save with hosting bundle offers!"}
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={bn ? "থিম সার্চ করুন..." : "Search themes..."}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </motion.div>
        </section>

        {/* Category Filter */}
        <section className="container mx-auto px-4 mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === key
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {bn ? label.bn : label.en}
              </button>
            ))}
          </div>
        </section>

        {/* Theme Grid */}
        <section className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-0 overflow-hidden animate-pulse">
                  <div className="h-48 bg-secondary/50" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-secondary/50 rounded w-2/3" />
                    <div className="h-4 bg-secondary/50 rounded w-full" />
                    <div className="h-8 bg-secondary/50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{bn ? "কোনো থিম পাওয়া যায়নি" : "No themes found"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filtered.map((theme, i) => (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-0 overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={theme.thumbnail_url}
                      alt={theme.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {theme.is_featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="gradient-primary text-primary-foreground border-0 gap-1">
                          <Sparkles className="w-3 h-3" /> {bn ? "ফিচার্ড" : "Featured"}
                        </Badge>
                      </div>
                    )}
                    {theme.discount_price_bdt && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="destructive" className="border-0">
                          {Math.round(((theme.price_bdt - theme.discount_price_bdt) / theme.price_bdt) * 100)}% OFF
                        </Badge>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      {theme.preview_url && (
                        <a
                          href={theme.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                      )}
                      <Link
                        to={`/themes/${theme.slug}`}
                        className="p-3 rounded-xl bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {bn
                          ? categoryLabels[theme.category]?.bn
                          : categoryLabels[theme.category]?.en}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {bn ? theme.description_bn : theme.description_en}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-primary">
                          ৳{theme.discount_price_bdt || theme.price_bdt}
                        </span>
                        {theme.discount_price_bdt && (
                          <span className="text-sm text-muted-foreground line-through">
                            ৳{theme.price_bdt}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/themes/${theme.slug}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {bn ? "বিস্তারিত →" : "Details →"}
                      </Link>
                    </div>
                    {theme.hosting_bundle_price_bdt && (
                      <div className="mb-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {bn
                            ? `হোস্টিং বান্ডেল: ৳${theme.hosting_bundle_price_bdt}`
                            : `Hosting Bundle: ৳${theme.hosting_bundle_price_bdt}`}
                        </p>
                      </div>
                    )}
                    {(() => {
                      const cartId = `theme-${theme.id}`;
                      const inCart = isInCart(cartId);
                      return inCart ? (
                        <div className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 bg-secondary text-foreground border border-border text-sm font-semibold">
                          <Check className="w-4 h-4 text-primary" />
                          {bn ? "কার্টে আছে" : "In Cart"}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            addItem({
                              id: cartId,
                              type: "theme",
                              name: theme.name,
                              description: bn ? "ওয়েবসাইট থিম" : "Website Theme",
                              price_bdt: String(theme.discount_price_bdt || theme.price_bdt),
                              theme_id: theme.id,
                              theme_slug: theme.slug,
                              thumbnail_url: theme.thumbnail_url,
                            });
                          }}
                          className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-sm shadow-primary/20"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {bn ? "কার্টে যোগ করুন" : "Add to Cart"}
                        </button>
                      );
                    })()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
};

export default ThemeStore;
