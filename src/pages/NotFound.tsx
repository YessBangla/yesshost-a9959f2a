import { Link, useLocation } from "@/lib/router-compat";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";
import PublicLayout from "@/components/PublicLayout";

const NotFound = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PublicLayout hideFooter>
      <SEOHead
        title={bn ? "পেজ পাওয়া যায়নি - Yess Host" : "Page Not Found - Yess Host"}
        description={bn ? "আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।" : "The page you are looking for could not be found."}
        noindex
      />
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <div className="relative mb-8">
            <span className="text-[120px] sm:text-[160px] font-display font-extrabold text-gradient-primary leading-none select-none">
              404
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
            {bn ? "পেজটি পাওয়া যায়নি" : "Page Not Found"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
            {bn
              ? "দুঃখিত, আপনি যে পেজটি খুঁজছেন তা সরানো হয়েছে, মুছে ফেলা হয়েছে অথবা কখনও ছিল না।"
              : "Sorry, the page you're looking for has been moved, deleted, or never existed."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm"
            >
              <Home className="w-4 h-4" />
              {bn ? "হোমপেজে যান" : "Go to Home"}
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-secondary/60 transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              {bn ? "সাপোর্টে যান" : "Get Help"}
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default NotFound;
