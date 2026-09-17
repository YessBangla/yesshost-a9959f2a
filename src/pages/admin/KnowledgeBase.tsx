import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface KbCategory {
  id: string;
  slug: string;
  icon: string;
  title_bn: string;
  title_en: string;
  sort_order: number;
  is_active: boolean;
}

interface KbArticle {
  id: string;
  slug: string;
  category_id: string;
  title_bn: string;
  title_en: string;
  content_bn: string;
  content_en: string;
  sort_order: number;
  is_active: boolean;
}

const AdminKnowledgeBase = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<KbArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ slug: "", icon: "BookOpen", title_bn: "", title_en: "", sort_order: 0 });
  const [editingCat, setEditingCat] = useState<KbCategory | null>(null);

  const fetchData = async () => {
    const [catRes, artRes] = await Promise.all([
      supabase.from("kb_categories").select("*").order("sort_order"),
      supabase.from("kb_articles").select("*").order("sort_order"),
    ]);
    setCategories((catRes.data as KbCategory[]) || []);
    setArticles((artRes.data as KbArticle[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Category CRUD
  const saveCat = async () => {
    setSaving(true);
    if (editingCat) {
      const { error } = await supabase.from("kb_categories").update(catForm).eq("id", editingCat.id);
      if (error) toast.error(bn ? "আপডেট ব্যর্থ" : "Update failed");
      else toast.success(bn ? "ক্যাটাগরি আপডেট হয়েছে" : "Category updated");
    } else {
      const { error } = await supabase.from("kb_categories").insert(catForm);
      if (error) toast.error(error.message);
      else toast.success(bn ? "ক্যাটাগরি তৈরি হয়েছে" : "Category created");
    }
    setSaving(false);
    setShowCatForm(false);
    setEditingCat(null);
    setCatForm({ slug: "", icon: "BookOpen", title_bn: "", title_en: "", sort_order: 0 });
    fetchData();
  };

  const deleteCat = async (id: string) => {
    if (!confirm(bn ? "এই ক্যাটাগরি এবং সকল আর্টিকেল ডিলিট হবে?" : "Delete this category and all its articles?")) return;
    await supabase.from("kb_categories").delete().eq("id", id);
    toast.success(bn ? "ক্যাটাগরি ডিলিট হয়েছে" : "Category deleted");
    fetchData();
  };

  const startEditCat = (cat: KbCategory) => {
    setEditingCat(cat);
    setCatForm({ slug: cat.slug, icon: cat.icon, title_bn: cat.title_bn, title_en: cat.title_en, sort_order: cat.sort_order });
    setShowCatForm(true);
  };

  // Article CRUD
  const saveArticle = async () => {
    if (!editingArticle) return;
    setSaving(true);
    const data = {
      slug: editingArticle.slug,
      category_id: editingArticle.category_id,
      title_bn: editingArticle.title_bn,
      title_en: editingArticle.title_en,
      content_bn: editingArticle.content_bn,
      content_en: editingArticle.content_en,
      sort_order: editingArticle.sort_order,
      is_active: editingArticle.is_active,
    };

    if (isNew) {
      const { error } = await supabase.from("kb_articles").insert(data);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(bn ? "আর্টিকেল তৈরি হয়েছে" : "Article created");
    } else {
      const { error } = await supabase.from("kb_articles").update(data).eq("id", editingArticle.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(bn ? "আর্টিকেল আপডেট হয়েছে" : "Article updated");
    }
    setSaving(false);
    setEditingArticle(null);
    setIsNew(false);
    fetchData();
  };

  const deleteArticle = async (id: string) => {
    if (!confirm(bn ? "আর্টিকেলটি ডিলিট করবেন?" : "Delete this article?")) return;
    await supabase.from("kb_articles").delete().eq("id", id);
    toast.success(bn ? "আর্টিকেল ডিলিট হয়েছে" : "Article deleted");
    fetchData();
  };

  const startNewArticle = (categoryId: string) => {
    setIsNew(true);
    setEditingArticle({
      id: "",
      slug: "",
      category_id: categoryId,
      title_bn: "",
      title_en: "",
      content_bn: "",
      content_en: "",
      sort_order: 0,
      is_active: true,
    });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const iconOptions = ["Server", "Globe", "Mail", "Shield", "BookOpen"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{bn ? "নলেজ বেস" : "Knowledge Base"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bn ? `${categories.length}টি ক্যাটাগরি, ${articles.length}টি আর্টিকেল` : `${categories.length} categories, ${articles.length} articles`}
          </p>
        </div>
        <button
          onClick={() => { setShowCatForm(true); setEditingCat(null); setCatForm({ slug: "", icon: "BookOpen", title_bn: "", title_en: "", sort_order: 0 }); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-xs hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> {bn ? "নতুন ক্যাটাগরি" : "New Category"}
        </button>
      </div>

      {/* Category Form Modal */}
      <AnimatePresence>
        {showCatForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{editingCat ? (bn ? "ক্যাটাগরি এডিট" : "Edit Category") : (bn ? "নতুন ক্যাটাগরি" : "New Category")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={catForm.title_en} onChange={e => setCatForm({ ...catForm, title_en: e.target.value })} placeholder="Title (English)"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={catForm.title_bn} onChange={e => setCatForm({ ...catForm, title_bn: e.target.value })} placeholder="টাইটেল (বাংলা)"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} placeholder="slug (e.g. hosting-guide)"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <select value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30">
                {iconOptions.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input type="number" value={catForm.sort_order} onChange={e => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} placeholder="Sort Order"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveCat} disabled={saving || !catForm.slug || !catForm.title_en}
                className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> {bn ? "সেভ" : "Save"}
              </button>
              <button onClick={() => { setShowCatForm(false); setEditingCat(null); }}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center gap-2">
                <X className="w-3.5 h-3.5" /> {bn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Editor Modal */}
      <AnimatePresence>
        {editingArticle && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{isNew ? (bn ? "নতুন আর্টিকেল" : "New Article") : (bn ? "আর্টিকেল এডিট" : "Edit Article")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={editingArticle.title_en} onChange={e => setEditingArticle({ ...editingArticle, title_en: e.target.value })} placeholder="Title (English)"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={editingArticle.title_bn} onChange={e => setEditingArticle({ ...editingArticle, title_bn: e.target.value })} placeholder="টাইটেল (বাংলা)"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={editingArticle.slug} onChange={e => setEditingArticle({ ...editingArticle, slug: e.target.value })} placeholder="slug (e.g. upload-via-cpanel)"
                className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <div className="flex items-center gap-3">
                <input type="number" value={editingArticle.sort_order} onChange={e => setEditingArticle({ ...editingArticle, sort_order: Number(e.target.value) })} placeholder="Sort"
                  className="w-20 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={editingArticle.is_active} onChange={e => setEditingArticle({ ...editingArticle, is_active: e.target.checked })}
                    className="rounded-sm" />
                  {bn ? "সক্রিয়" : "Active"}
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Content (English) — Markdown</label>
                <textarea value={editingArticle.content_en} onChange={e => setEditingArticle({ ...editingArticle, content_en: e.target.value })}
                  rows={8} className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground font-mono outline-hidden focus:ring-2 focus:ring-primary/30 resize-y" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{bn ? "কন্টেন্ট (বাংলা) — মার্কডাউন" : "Content (Bengali) — Markdown"}</label>
                <textarea value={editingArticle.content_bn} onChange={e => setEditingArticle({ ...editingArticle, content_bn: e.target.value })}
                  rows={8} className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground font-mono outline-hidden focus:ring-2 focus:ring-primary/30 resize-y" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveArticle} disabled={saving || !editingArticle.slug || !editingArticle.title_en}
                className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> {saving ? (bn ? "সেভ হচ্ছে..." : "Saving...") : (bn ? "সেভ" : "Save")}
              </button>
              <button onClick={() => { setEditingArticle(null); setIsNew(false); }}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center gap-2">
                <X className="w-3.5 h-3.5" /> {bn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories with Articles */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catArticles = articles.filter(a => a.category_id === cat.id);
          const isExpanded = expandedCat === cat.id;

          return (
            <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Category Row */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{bn ? cat.title_bn : cat.title_en}</span>
                  <span className="text-xs text-muted-foreground">({catArticles.length})</span>
                  {!cat.is_active && <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded-sm font-medium">Inactive</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={e => { e.stopPropagation(); startEditCat(cat); }}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); deleteCat(cat.id); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Articles List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/50 overflow-hidden">
                    <div className="px-4 py-3 space-y-1.5">
                      {catArticles.map(art => (
                        <div key={art.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground truncate">{bn ? art.title_bn : art.title_en}</span>
                            {!art.is_active && <span className="text-[9px] px-1 py-0.5 bg-destructive/10 text-destructive rounded-sm shrink-0">Off</span>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setEditingArticle(art); setIsNew(false); }}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteArticle(art.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      {catArticles.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">{bn ? "কোনো আর্টিকেল নেই" : "No articles yet"}</p>
                      )}
                      <button onClick={() => startNewArticle(cat.id)}
                        className="flex items-center gap-2 text-xs text-primary font-medium py-2 hover:underline">
                        <Plus className="w-3.5 h-3.5" /> {bn ? "নতুন আর্টিকেল" : "Add Article"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
