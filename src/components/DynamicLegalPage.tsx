import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";

const DynamicLegalPage = ({ pageKey, fallbackTitle, fallbackSections, seoDescription }: {
  pageKey: string;
  fallbackTitle: { bn: string; en: string };
  fallbackSections: { title_bn: string; title_en: string; content_bn: string; content_en: string }[];
  seoDescription?: string;
}) => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", pageKey).eq("is_active", true).order("sort_order")
      .then(({ data }) => setContent(data || []));
  }, [pageKey]);

  const get = (key: string) => content.find(c => c.section_key === key);
  const hero = get("hero");
  const title = hero ? (bn ? hero.title_bn : hero.title_en) : (bn ? fallbackTitle.bn : fallbackTitle.en);

  const sections = useMemo(() => {
    const item = get("sections");
    if (item?.metadata?.sections) return item.metadata.sections;
    return fallbackSections;
  }, [content]);

  return (
    <PublicLayout>
      <SEOHead title={`${title} - Yess Host`} description={seoDescription || `${fallbackTitle.en} - Yess Host Bangladesh hosting provider.`} canonical={`/${pageKey}`} />
      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-6 text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mb-8">{bn ? "সর্বশেষ আপডেট: মার্চ ২০২৬" : "Last updated: March 2026"}</p>
            <div className="space-y-6">
              {sections.map((s: any, i: number) => (
                <div key={i} className="glass-card p-5">
                  <h2 className="text-lg font-bold text-foreground mb-2">{bn ? s.title_bn : s.title_en}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{bn ? s.content_bn : s.content_en}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default DynamicLegalPage;
