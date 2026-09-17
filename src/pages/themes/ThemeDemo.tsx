import { ArrowLeft, Clock, Eye } from "lucide-react";
import { Link, useParams } from "@/lib/router-compat";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";

const ThemeDemo = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [theme, setTheme] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("themes")
      .select("name, slug, thumbnail_url, category")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => setTheme(data));
  }, [slug]);

  return (
    <PublicLayout>
      <SEOHead
        title={bn ? `${theme?.name || "থিম"} — ডেমো শীঘ্রই আসছে` : `${theme?.name || "Theme"} — Demo Coming Soon`}
        description="Theme demo coming soon."
      />
      <div className="pt-24 pb-20 min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto px-4"
        >
          {/* Theme thumbnail */}
          {theme?.thumbnail_url && (
            <div className="mb-6 rounded-2xl overflow-hidden border border-border shadow-lg mx-auto max-w-sm">
              <img
                src={theme.thumbnail_url}
                alt={theme.name}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>

          {theme?.name && (
            <p className="text-sm font-semibold text-primary mb-2">{theme.name}</p>
          )}

          <h1 className="text-3xl font-extrabold text-foreground mb-3">
            {bn ? "ডেমো শীঘ্রই আসছে!" : "Demo Coming Soon!"}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {bn
              ? `"${theme?.name || "এই থিম"}" এর লাইভ ডেমো এখনও প্রস্তুত হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।`
              : `The live demo for "${theme?.name || "this theme"}" is still being prepared. Please check back soon.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={slug ? `/themes/${slug}` : "/themes"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {bn ? "থিমে ফিরে যান" : "Back to Theme"}
            </Link>
            <Link
              to="/themes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all border border-border"
            >
              <Eye className="w-4 h-4" />
              {bn ? "সকল থিম দেখুন" : "Browse Themes"}
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default ThemeDemo;
