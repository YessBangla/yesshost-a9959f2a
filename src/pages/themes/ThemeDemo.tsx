import { ArrowLeft, Clock, Palette } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";

const ThemeDemo = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <PublicLayout>
      <SEOHead title={bn ? "ডেমো শীঘ্রই আসছে - Yess Host" : "Demo Coming Soon - Yess Host"} description="Theme demo coming soon." />
      <div className="pt-24 pb-20 min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-3">
            {bn ? "শীঘ্রই আসছে!" : "Coming Soon!"}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {bn
              ? "এই থিমের লাইভ ডেমো এখনও প্রস্তুত হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
              : "The live demo for this theme is still being prepared. Please check back soon."}
          </p>
          <Link
            to={slug ? `/themes/${slug}` : "/themes"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {bn ? "থিমে ফিরে যান" : "Back to Theme"}
          </Link>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default ThemeDemo;
