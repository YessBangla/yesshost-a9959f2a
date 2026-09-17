import { motion } from "framer-motion";
import { Search, Palette, Star, Eye, ShoppingCart, Sparkles, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/formatPrice";

const defaultCategoryLabels: Record<string, { bn: string; en: string }> = {
  business: { bn: "ব্যবসা/কর্পোরেট", en: "Business" },
  ecommerce: { bn: "ই-কমার্স", en: "E-Commerce" },
  portfolio: { bn: "পোর্টফোলিও", en: "Portfolio" },
  restaurant: { bn: "রেস্টুরেন্ট", en: "Restaurant" },
  blog: { bn: "ব্লগ", en: "Blog" },
  landing: { bn: "ল্যান্ডিং পেইজ", en: "Landing Page" },
  education: { bn: "শিক্ষা", en: "Education" },
  healthcare: { bn: "স্বাস্থ্যসেবা", en: "Healthcare" },
  news: { bn: "নিউজ/ম্যাগাজিন", en: "News/Magazine" },
  agency: { bn: "এজেন্সি", en: "Agency" },
  realestate: { bn: "রিয়েল এস্টেট", en: "Real Estate" },
  travel: { bn: "ট্রাভেল/হোটেল", en: "Travel/Hotel" },
};

const ThemeStore = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { addItem, isInCart } = useCart();
  const [themes, setThemes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [siteContent, setSiteContent] = useState<any>(null);

  useEffect(() => {
    // Fetch themes and page content in parallel
    Promise.all([
      supabase.from("themes").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("site_content").select("*").eq("page", "theme_store").eq("is_active", true).order("sort_order"),
    ]).then(([themesRes, contentRes]) => {
      setThemes(themesRes.data || []);
      const contents = contentRes.data || [];
      const hero = contents.find((c: any) => c.section_key === "hero");
      const cats = contents.find((c: any) => c.section_key === "categories");
      setSiteContent({ hero, categories: cats });
      setLoading(false);
    });
  }, []);

  // Dynamic category labels: merge DB overrides with defaults, only show categories that have themes
  const categoryLabels = useMemo(() => {
    const dbLabels = siteContent?.categories?.metadata?.labels || {};
    const merged = { ...defaultCategoryLabels, ...dbLabels };
    // Only include categories that actually have themes
    const activeCategories = new Set(themes.map((t) => t.category));
    const result: Record<string, { bn: string; en: string }> = {};
    for (const [key, label] of Object.entries(merged)) {
      if (activeCategories.has(key)) {
        result[key] = label as { bn: string; en: string };
      }
    }
    return result;
  }, [themes, siteContent]);

  // Hero content from DB or fallback
  const heroTitle = siteContent?.hero
    ? (bn ? siteContent.hero.title_bn : siteContent.hero.title_en)
    : (bn ? "ওয়েবসাইট থিম বান্ডেল" : "Website Theme Bundle");
  const heroDesc = siteContent?.hero
    ? (bn ? siteContent.hero.content_bn : siteContent.hero.content_en)
    : (bn
      ? "প্রফেশনাল রেডিমেড থিম বেছে নিন — হোস্টিং সহ বান্ডেল অফারে সাশ্রয় করুন!"
      : "Choose professional ready-made themes — save with hosting bundle offers!");

  const filtered = useMemo(() => {
    return themes.filter((t) => {
      const matchCategory = activeCategory === "all" || t.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = t.name.toLowerCase().includes(q) ||
        (t.description_bn || "").toLowerCase().includes(q) ||
        (t.description_en || "").toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [themes, activeCategory, search]);

  return (
    <PublicLayout>
      <SEOHead title="Theme Store - Yess Host" description="Browse professional ready-made website themes. Business, eCommerce, portfolio and more — with hosting bundle offers." canonical="/themes" />
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
              {heroTitle}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {heroDesc}
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={bn ? "থিম সার্চ করুন..." : "Search themes..."}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </motion.div>
        </section>

        {/* Category Filter - corporate scrollable rail on mobile, centered wrap on desktop */}
        <section className="mb-8 md:mb-10 sticky top-14 lg:top-16 z-30 bg-background/90 backdrop-blur-md border-y border-border/60 md:border-0 md:bg-transparent md:backdrop-blur-none md:static">
          <div className="container mx-auto px-0 md:px-4 py-2.5 md:py-0">
            <div className="relative">
              {/* edge fades (mobile only) */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />

              <div className="flex flex-nowrap md:justify-start gap-2 overflow-x-auto no-scrollbar px-4 md:px-2 py-1 snap-x snap-mandatory scroll-smooth">

                {[
                  { key: "all", label: bn ? "সকল" : "All", count: themes.length },
                  ...Object.entries(categoryLabels).map(([key, label]) => ({
                    key,
                    label: bn ? label.bn : label.en,
                    count: themes.filter((t) => t.category === key).length,
                  })),
                ].map((cat) => {
                  const active = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      aria-pressed={active}
                      className={`shrink-0 snap-start inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {cat.label}
                      <span
                        className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-[11px] font-bold tabular-nums ${
                          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
                    <div className="h-5 bg-secondary/50 rounded-sm w-2/3" />
                    <div className="h-4 bg-secondary/50 rounded-sm w-full" />
                    <div className="h-8 bg-secondary/50 rounded-sm w-1/3" />
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
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <Link
                        to={`/themes/${theme.slug}`}
                        className="px-4 py-2.5 rounded-xl bg-secondary/90 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {bn ? "বিস্তারিত" : "Details"}
                      </Link>
                      {(() => {
                        const hovCartId = `theme-${theme.id}`;
                        return isInCart(hovCartId) ? (
                          <div className="px-4 py-2.5 rounded-xl bg-secondary/90 text-foreground text-sm font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            {bn ? "কার্টে আছে" : "In Cart"}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem({
                                id: hovCartId,
                                type: "theme",
                                name: theme.name,
                                description: bn ? "ওয়েবসাইট থিম" : "Website Theme",
                                price_bdt: String(theme.discount_price_bdt || theme.price_bdt),
                                theme_id: theme.id,
                                theme_slug: theme.slug,
                                thumbnail_url: theme.thumbnail_url,
                              });
                            }}
                            className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-xs shadow-primary/20"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {bn ? "কার্টে যোগ করুন" : "Add to Cart"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {bn
                          ? (categoryLabels[theme.category]?.bn || defaultCategoryLabels[theme.category]?.bn || theme.category)
                          : (categoryLabels[theme.category]?.en || defaultCategoryLabels[theme.category]?.en || theme.category)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-foreground">{theme.name}</h3>
                      {theme.preview_url && (
                        <Link
                          to={`/themes/${theme.slug}/demo`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          {bn ? "ডেমো দেখুন" : "Live Demo"}
                        </Link>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {bn ? theme.description_bn : theme.description_en}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-primary">
                          ৳{formatAmount(theme.discount_price_bdt || theme.price_bdt, lang)}
                        </span>
                        {theme.discount_price_bdt && (
                          <span className="text-sm text-muted-foreground line-through">
                            ৳{formatAmount(theme.price_bdt, lang)}
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
                            ? `হোস্টিং বান্ডেল: ৳${formatAmount(theme.hosting_bundle_price_bdt, lang)}`
                            : `Hosting Bundle: ৳${formatAmount(theme.hosting_bundle_price_bdt, lang)}`}
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
                          className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-xs shadow-primary/20"
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
