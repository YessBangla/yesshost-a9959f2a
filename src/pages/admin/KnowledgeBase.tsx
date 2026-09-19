import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronUp, FolderOpen,
  RefreshCw, Eye, EyeOff, FileText, CheckCircle2, Languages, Download,
} from "lucide-react";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  StaffPageHeader, StaffMetricStrip, StaffSearch, StaffLoading, StaffEmpty,
  type StaffMetric,
} from "@/components/staff/StaffConsole";
import DataPagination from "@/components/DataPagination";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  const [error, setError] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<KbArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ slug: "", icon: "BookOpen", title_bn: "", title_en: "", sort_order: 0 });
  const [editingCat, setEditingCat] = useState<KbCategory | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [catRes, artRes] = await Promise.all([
      supabase.from("kb_categories").select("*").order("sort_order"),
      supabase.from("kb_articles").select("*").order("sort_order"),
    ]);
    if (catRes.error || artRes.error) {
      setError(bn ? "তথ্য লোড করা যায়নি" : "Could not load knowledge base data");
    } else {
      setError(null);
    }
    setCategories((catRes.data as KbCategory[]) || []);
    setArticles((artRes.data as KbArticle[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { setPage(1); }, [search, status]);

  // Category CRUD
  const saveCat = async () => {
    setSaving(true);
    if (editingCat) {
      const { error: updateError } = await supabase.from("kb_categories").update(catForm).eq("id", editingCat.id);
      if (updateError) toast.error(bn ? "আপডেট ব্যর্থ" : "Update failed");
      else toast.success(bn ? "ক্যাটাগরি আপডেট হয়েছে" : "Category updated");
    } else {
      const { error: insertError } = await supabase.from("kb_categories").insert(catForm);
      if (insertError) toast.error(insertError.message);
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

  const toggleCat = async (cat: KbCategory) => {
    const next = !cat.is_active;
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: next } : c)));
    const { error: toggleError } = await supabase.from("kb_categories").update({ is_active: next }).eq("id", cat.id);
    if (toggleError) {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: cat.is_active } : c)));
      toast.error(bn ? "স্ট্যাটাস পরিবর্তন ব্যর্থ" : "Status change failed");
      return;
    }
    toast.success(next ? (bn ? "ক্যাটাগরি প্রকাশিত" : "Category published") : (bn ? "ক্যাটাগরি লুকানো হয়েছে" : "Category hidden"));
  };

  const toggleArticle = async (art: KbArticle) => {
    const next = !art.is_active;
    setArticles((prev) => prev.map((a) => (a.id === art.id ? { ...a, is_active: next } : a)));
    const { error: toggleError } = await supabase.from("kb_articles").update({ is_active: next }).eq("id", art.id);
    if (toggleError) {
      setArticles((prev) => prev.map((a) => (a.id === art.id ? { ...a, is_active: art.is_active } : a)));
      toast.error(bn ? "স্ট্যাটাস পরিবর্তন ব্যর্থ" : "Status change failed");
      return;
    }
    toast.success(next ? (bn ? "আর্টিকেল প্রকাশিত" : "Article published") : (bn ? "আর্টিকেল ড্রাফটে গেছে" : "Article unpublished"));
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
      const { error: insertError } = await supabase.from("kb_articles").insert(data);
      if (insertError) { toast.error(insertError.message); setSaving(false); return; }
      toast.success(bn ? "আর্টিকেল তৈরি হয়েছে" : "Article created");
    } else {
      const { error: updateError } = await supabase.from("kb_articles").update(data).eq("id", editingArticle.id);
      if (updateError) { toast.error(updateError.message); setSaving(false); return; }
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

  const matchesArticle = (a: KbArticle) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || a.title_en.toLowerCase().includes(q) || a.title_bn.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
    const matchStatus = status === "all" || (status === "published" ? a.is_active : !a.is_active);
    return matchSearch && matchStatus;
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((cat) => {
      const catMatch = !q || cat.title_en.toLowerCase().includes(q) || cat.title_bn.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
      const hasArticles = articles.some((a) => a.category_id === cat.id && matchesArticle(a));
      if (status !== "all") return hasArticles;
      return catMatch || hasArticles;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, articles, search, status]);

  const pagedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

  const publishedArticles = articles.filter((a) => a.is_active).length;
  const bilingual = articles.filter((a) => a.title_bn.trim() && a.content_bn.trim()).length;
  const publishRate = articles.length ? Math.round((publishedArticles / articles.length) * 100) : 0;

  const metrics: StaffMetric[] = [
    { label: bn ? "ক্যাটাগরি" : "Categories", value: categories.length, detail: bn ? `${categories.filter(c => c.is_active).length} সক্রিয়` : `${categories.filter(c => c.is_active).length} active`, icon: FolderOpen },
    { label: bn ? "আর্টিকেল" : "Articles", value: articles.length, detail: bn ? "মোট কনটেন্ট" : "total content", icon: FileText },
    { label: bn ? "প্রকাশিত" : "Published", value: `${publishRate}%`, detail: bn ? `${publishedArticles}টি লাইভ` : `${publishedArticles} live`, icon: CheckCircle2, tone: "success" },
    { label: bn ? "দ্বিভাষিক" : "Bilingual", value: bilingual, detail: bn ? "বাংলা + ইংরেজি" : "BN + EN complete", icon: Languages, tone: articles.length && bilingual < articles.length ? "warning" : "primary" },
  ];

  const iconOptions = ["Server", "Globe", "Mail", "Shield", "BookOpen"];

  return (
    <div className="staff-console space-y-6">
      <StaffPageHeader
        title={bn ? "নলেজ বেস অপারেশনস" : "Knowledge Base Operations"}
        description={bn ? "ক্যাটাগরি, আর্টিকেল ও প্রকাশনার অবস্থা এক জায়গা থেকে পরিচালনা করুন।" : "Manage categories, articles and publishing status from one workspace."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> {bn ? "রিফ্রেশ" : "Refresh"}
            </Button>
            <Button
              variant="outline"
              className="h-11"
              disabled={!articles.length}
              onClick={() => {
                const catName = (id: string) => categories.find((c) => c.id === id)?.title_en || "";
                downloadCsv(
                  "yesshost-knowledge-base",
                  ["title_en", "title_bn", "slug", "category", "status"],
                  articles.map((a) => [a.title_en, a.title_bn, a.slug, catName(a.category_id), a.is_active ? "published" : "draft"]),
                );
                toast.success(bn ? "CSV ডাউনলোড হয়েছে" : "CSV downloaded");
              }}
            >
              <Download className="size-4" /> CSV
            </Button>
            <Button
              className="h-11"
              onClick={() => { setShowCatForm(true); setEditingCat(null); setCatForm({ slug: "", icon: "BookOpen", title_bn: "", title_en: "", sort_order: 0 }); }}
            >
              <Plus className="size-4" /> {bn ? "নতুন ক্যাটাগরি" : "New Category"}
            </Button>
          </div>
        }
      />

      <StaffMetricStrip metrics={metrics} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <StaffSearch
          value={search}
          onChange={setSearch}
          placeholder={bn ? "ক্যাটাগরি, আর্টিকেল বা slug খুঁজুন..." : "Search categories, articles or slug..."}
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="h-11 sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{bn ? "সব স্ট্যাটাস" : "All statuses"}</SelectItem>
            <SelectItem value="published">{bn ? "প্রকাশিত" : "Published"}</SelectItem>
            <SelectItem value="draft">{bn ? "ড্রাফট" : "Draft"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="staff-panel p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Category Form */}
      <AnimatePresence>
        {showCatForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="staff-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{editingCat ? (bn ? "ক্যাটাগরি এডিট" : "Edit Category") : (bn ? "নতুন ক্যাটাগরি" : "New Category")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={catForm.title_en} onChange={e => setCatForm({ ...catForm, title_en: e.target.value })} placeholder="Title (English)"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={catForm.title_bn} onChange={e => setCatForm({ ...catForm, title_bn: e.target.value })} placeholder="টাইটেল (বাংলা)"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} placeholder="slug (e.g. hosting-guide)"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <select value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30">
                {iconOptions.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input type="number" value={catForm.sort_order} onChange={e => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} placeholder="Sort Order"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-2">
              <Button className="h-11" onClick={saveCat} disabled={saving || !catForm.slug || !catForm.title_en}>
                <Save className="size-4" /> {saving ? (bn ? "সেভ হচ্ছে..." : "Saving...") : (bn ? "সেভ" : "Save")}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => { setShowCatForm(false); setEditingCat(null); }}>
                <X className="size-4" /> {bn ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Editor */}
      <AnimatePresence>
        {editingArticle && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="staff-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{isNew ? (bn ? "নতুন আর্টিকেল" : "New Article") : (bn ? "আর্টিকেল এডিট" : "Edit Article")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={editingArticle.title_en} onChange={e => setEditingArticle({ ...editingArticle, title_en: e.target.value })} placeholder="Title (English)"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={editingArticle.title_bn} onChange={e => setEditingArticle({ ...editingArticle, title_bn: e.target.value })} placeholder="টাইটেল (বাংলা)"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <input value={editingArticle.slug} onChange={e => setEditingArticle({ ...editingArticle, slug: e.target.value })} placeholder="slug (e.g. upload-via-cpanel)"
                className="h-11 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
              <div className="flex items-center gap-3">
                <input type="number" value={editingArticle.sort_order} onChange={e => setEditingArticle({ ...editingArticle, sort_order: Number(e.target.value) })} placeholder="Sort"
                  className="h-11 w-20 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={editingArticle.is_active} onChange={e => setEditingArticle({ ...editingArticle, is_active: e.target.checked })}
                    className="rounded-sm" />
                  {bn ? "প্রকাশিত" : "Published"}
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
              <Button className="h-11" onClick={saveArticle} disabled={saving || !editingArticle.slug || !editingArticle.title_en}>
                <Save className="size-4" /> {saving ? (bn ? "সেভ হচ্ছে..." : "Saving...") : (bn ? "সেভ" : "Save")}
              </Button>
              <Button variant="outline" className="h-11" onClick={() => { setEditingArticle(null); setIsNew(false); }}>
                <X className="size-4" /> {bn ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories with Articles */}
      {loading ? (
        <StaffLoading rows={5} />
      ) : filteredCategories.length === 0 ? (
        <div className="staff-panel">
          <StaffEmpty
            icon={BookOpen}
            title={bn ? "কোনো ফলাফল নেই" : "Nothing to show"}
            description={bn ? "অনুসন্ধান বা ফিল্টার বদলে দেখুন, অথবা নতুন ক্যাটাগরি তৈরি করুন।" : "Adjust your search or filters, or create a new category."}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {pagedCategories.map((cat) => {
            const catArticles = articles.filter(a => a.category_id === cat.id && matchesArticle(a));
            const isExpanded = expandedCat === cat.id;

            return (
              <div key={cat.id} className="staff-panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <FolderOpen className="size-4 shrink-0 text-primary" />
                    <span className="truncate text-sm font-bold text-foreground">{bn ? cat.title_bn : cat.title_en}</span>
                    <span className="text-xs text-muted-foreground">({catArticles.length})</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {cat.is_active ? (bn ? "প্রকাশিত" : "Published") : (bn ? "লুকানো" : "Hidden")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={e => { e.stopPropagation(); toggleCat(cat); }}
                      aria-label={cat.is_active ? "Hide category" : "Publish category"}
                      className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                      {cat.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); startEditCat(cat); }}
                      aria-label="Edit category"
                      className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><Pencil className="size-4" /></button>
                    <button onClick={e => { e.stopPropagation(); deleteCat(cat.id); }}
                      aria-label="Delete category"
                      className="inline-flex size-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                    {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 overflow-hidden">
                      <div className="px-4 py-3 space-y-1.5">
                        {catArticles.map(art => (
                          <div key={art.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-secondary/30 transition-colors">
                            <div className="flex min-w-0 items-center gap-2">
                              <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm text-foreground">{bn ? (art.title_bn || art.title_en) : art.title_en}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${art.is_active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                                {art.is_active ? (bn ? "প্রকাশিত" : "Published") : (bn ? "ড্রাফট" : "Draft")}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button onClick={() => toggleArticle(art)}
                                aria-label={art.is_active ? "Unpublish article" : "Publish article"}
                                className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                                {art.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                              </button>
                              <button onClick={() => { setEditingArticle(art); setIsNew(false); }}
                                aria-label="Edit article"
                                className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><Pencil className="size-4" /></button>
                              <button onClick={() => deleteArticle(art.id)}
                                aria-label="Delete article"
                                className="inline-flex size-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                            </div>
                          </div>
                        ))}
                        {catArticles.length === 0 && (
                          <p className="py-2 text-xs text-muted-foreground">{bn ? "কোনো আর্টিকেল নেই" : "No articles yet"}</p>
                        )}
                        <button onClick={() => startNewArticle(cat.id)}
                          className="flex min-h-11 items-center gap-2 text-xs font-medium text-primary hover:underline">
                          <Plus className="size-4" /> {bn ? "নতুন আর্টিকেল" : "Add Article"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <DataPagination
            total={filteredCategories.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1); }}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
};

export default AdminKnowledgeBase;
