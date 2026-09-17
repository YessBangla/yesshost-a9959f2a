import { motion } from "framer-motion";
import { Search, BookOpen, Server, Globe, Mail, Shield, HelpCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

const iconMap: Record<string, any> = { Server, Globe, Mail, Shield, BookOpen };

const KnowledgeBase = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("kb_categories").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("kb_articles").select("*").eq("is_active", true).order("sort_order"),
    ]).then(([catRes, artRes]) => {
      setCategories(catRes.data || []);
      setArticles(artRes.data || []);
      setLoading(false);
    });
  }, []);

  const grouped = useMemo(() => {
    return categories.map((cat) => {
      const catArticles = articles
        .filter((a) => a.category_id === cat.id)
        .filter((a) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return a.title_bn.toLowerCase().includes(q) || a.title_en.toLowerCase().includes(q);
        });
      return { ...cat, articles: catArticles };
    }).filter((cat) => cat.articles.length > 0);
  }, [categories, articles, search]);

  return (
    <PublicLayout>
      <SEOHead title="Knowledge Base - Yess Host" description="Hosting guides, tutorials and FAQs. Learn about cPanel, FTP, SSL, DNS, email setup and more." canonical="/knowledge-base" />
      <div className="pt-20 lg:pt-24 pb-16">
        <section className="container mx-auto px-4 text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4"><BookOpen className="w-10 h-10 text-primary" /></div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "নলেজ বেস" : "Knowledge Base"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              {bn ? "হোস্টিং, ডোমেইন ও সার্ভার সংক্রান্ত সকল গাইড ও টিউটোরিয়াল।" : "All guides and tutorials related to hosting, domain and server."}
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={bn ? "আর্টিকেল সার্চ করুন..." : "Search articles..."}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
            </div>
          </motion.div>
        </section>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <section className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {grouped.map((cat, i) => {
                const Icon = iconMap[cat.icon] || BookOpen;
                return (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-primary/10"><Icon className="w-5 h-5 text-primary" /></div>
                      <h2 className="text-lg font-bold text-foreground">{bn ? cat.title_bn : cat.title_en}</h2>
                    </div>
                    <ul className="space-y-2">
                      {cat.articles.map((a: any) => (
                        <li key={a.id}>
                          <Link to={`/knowledge-base/${a.slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5">
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            {bn ? a.title_bn : a.title_en}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
              {grouped.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{bn ? "কোনো আর্টিকেল পাওয়া যায়নি" : "No articles found"}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
};

export default KnowledgeBase;
