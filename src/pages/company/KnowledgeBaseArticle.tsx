import { useParams, Link } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

const KnowledgeBaseArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [article, setArticle] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("kb_articles")
      .select("*, kb_categories(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setArticle(data);
          setCategory((data as any).kb_categories);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-20 lg:pt-24 pb-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!article) {
    return (
      <PublicLayout>
        <SEOHead title="Article Not Found - Yess Host" description="The requested article was not found." />
        <div className="pt-20 lg:pt-24 pb-16 container mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{bn ? "আর্টিকেল পাওয়া যায়নি" : "Article Not Found"}</h1>
          <p className="text-muted-foreground mb-6">{bn ? "এই আর্টিকেলটি খুঁজে পাওয়া যায়নি।" : "This article could not be found."}</p>
          <Link to="/knowledge-base" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> {bn ? "নলেজ বেসে ফিরে যান" : "Back to Knowledge Base"}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const content = bn ? article.content_bn : article.content_en;
  const categoryName = category ? (bn ? category.title_bn : category.title_en) : "";

  return (
    <PublicLayout>
      <SEOHead
        title={`${bn ? article.title_bn : article.title_en} - Yess Host`}
        description={`${bn ? article.title_bn : article.title_en} - ${bn ? "বিস্তারিত গাইড" : "Detailed guide"}`}
        canonical={`/knowledge-base/${slug}`}
      />
      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Link to="/knowledge-base" className="hover:text-primary transition-colors">
                {bn ? "নলেজ বেস" : "Knowledge Base"}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-muted-foreground/70">{categoryName}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium truncate">{bn ? article.title_bn : article.title_en}</span>
            </div>
          </motion.div>

          {/* Article */}
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8">
            <div className="mb-6 pb-6 border-b border-border/50">
              {categoryName && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                  {categoryName}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                {bn ? article.title_bn : article.title_en}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {bn ? "৫ মিনিটে পড়ুন" : "5 min read"}</span>
              </div>
            </div>

            {/* Content rendered as simple markdown */}
            <div className="prose prose-sm max-w-none text-foreground">
              {content.split("\n").map((line: string, i: number) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={i} />;
                if (trimmed.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{trimmed.slice(3)}</h2>;
                if (trimmed.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">{trimmed.slice(4)}</h3>;
                if (trimmed.startsWith("> ")) return <blockquote key={i} className="border-l-4 border-primary/30 pl-4 py-2 my-3 bg-primary/5 rounded-r-lg text-sm text-muted-foreground italic">{trimmed.slice(2)}</blockquote>;
                if (/^\d+\.\s/.test(trimmed)) return <p key={i} className="text-sm leading-relaxed ml-4 my-1">{trimmed}</p>;
                if (trimmed.startsWith("- ")) return <p key={i} className="text-sm leading-relaxed ml-4 my-1">• {trimmed.slice(2)}</p>;
                const parts = trimmed.split(/(`[^`]+`)/);
                return (
                  <p key={i} className="text-sm leading-relaxed my-2">
                    {parts.map((part: string, j: number) =>
                      part.startsWith("`") && part.endsWith("`")
                        ? <code key={j} className="px-1.5 py-0.5 rounded-sm bg-secondary text-primary text-xs font-mono">{part.slice(1, -1)}</code>
                        : part.replace(/\*\*([^*]+)\*\*/g, "").length !== part.length
                          ? <span key={j} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
                          : <span key={j}>{part}</span>
                    )}
                  </p>
                );
              })}
            </div>
          </motion.article>

          <div className="mt-6">
            <Link to="/knowledge-base"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> {bn ? "নলেজ বেসে ফিরে যান" : "Back to Knowledge Base"}
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default KnowledgeBaseArticle;
