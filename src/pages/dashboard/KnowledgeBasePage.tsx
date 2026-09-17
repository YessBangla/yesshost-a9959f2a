import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import EmptyState from "@/components/EmptyState";

const DashboardKnowledgeBase = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      const okCat = activeCat === "all" || a.category_id === activeCat;
      const okSearch =
        !q ||
        String(a.title_bn || "").toLowerCase().includes(q) ||
        String(a.title_en || "").toLowerCase().includes(q);
      return okCat && okSearch;
    });
  }, [articles, search, activeCat]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "নলেজবেস" : "Knowledgebase"}</h1>
        <p className="text-sm text-muted-foreground">
          {bn ? "হোস্টিং, ডোমেইন ও cPanel সংক্রান্ত গাইড" : "Guides for hosting, domains and cPanel"}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={bn ? "আর্টিকেল খুঁজুন..." : "Search articles..."}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[{ id: "all", title_en: "All", title_bn: "সব" }, ...categories].map((c: any) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold border ${
              activeCat === c.id
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary/40 text-muted-foreground border-border"
            }`}
          >
            {bn ? c.title_bn : c.title_en}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl h-16 animate-pulse bg-secondary/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={bn ? "কোনো আর্টিকেল পাওয়া যায়নি" : "No articles found"}
          description={bn ? "অন্য কিছু লিখে খুঁজে দেখুন" : "Try a different search term"}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={`/knowledge-base/${a.slug}`}
              className="glass-card rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{bn ? a.title_bn : a.title_en}</h3>
                  {(a.excerpt_bn || a.excerpt_en) && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{bn ? a.excerpt_bn : a.excerpt_en}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardKnowledgeBase;
