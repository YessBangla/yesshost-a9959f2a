import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Palette, Search, Eye, EyeOff, Star, Upload, ImagePlus, FileArchive, Download, Loader2, Power, Monitor, ExternalLink, AlertCircle } from "lucide-react";
import { ThemesSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORIES = ["business", "ecommerce", "portfolio", "restaurant", "blog", "landing", "education", "healthcare", "news", "agency", "realestate", "travel"] as const;

const categoryLabels: Record<string, { bn: string; en: string }> = {
  business: { bn: "ব্যবসা", en: "Business" },
  ecommerce: { bn: "ই-কমার্স", en: "E-Commerce" },
  portfolio: { bn: "পোর্টফোলিও", en: "Portfolio" },
  restaurant: { bn: "রেস্টুরেন্ট", en: "Restaurant" },
  blog: { bn: "ব্লগ", en: "Blog" },
  landing: { bn: "ল্যান্ডিং", en: "Landing" },
  education: { bn: "শিক্ষা", en: "Education" },
  healthcare: { bn: "স্বাস্থ্যসেবা", en: "Healthcare" },
  news: { bn: "নিউজ পোর্টাল", en: "News" },
  agency: { bn: "এজেন্সি", en: "Agency" },
  realestate: { bn: "রিয়েল এস্টেট", en: "Real Estate" },
  travel: { bn: "ট্রাভেল", en: "Travel" },
};

const emptyForm = {
  name: "", slug: "", category: "business" as typeof CATEGORIES[number],
  description_bn: "", description_en: "", price_bdt: 0, discount_price_bdt: null as number | null,
  preview_url: "", thumbnail_url: "", features: "[]", tags: "[]",
  hosting_bundle_price_bdt: null as number | null, hosting_bundle_features: "[]",
  screenshots: "[]", file_path: "" as string | null,
  is_active: true, is_featured: false, sort_order: 0,
};

const AdminThemes = () => {
  const { tr, lang } = useLanguage();
  const { toast } = useToast();
  const [themes, setThemes] = useState<Tables<"themes">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<any>({ ...emptyForm });

  const fetchThemes = async () => {
    setLoading(true);
    const { data } = await supabase.from("themes").select("*").order("sort_order").order("created_at", { ascending: false });
    setThemes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchThemes(); }, []);

  const parseJson = (val: any) => {
    if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
    return val;
  };

  const handleSave = async (isNew: boolean) => {
    const form = isNew ? { ...addForm } : { ...editForm };
    const { id, created_at, updated_at, ...rest } = form;
    rest.screenshots = parseJson(rest.screenshots ?? []);
    rest.features = parseJson(rest.features);
    rest.tags = parseJson(rest.tags);
    rest.hosting_bundle_features = parseJson(rest.hosting_bundle_features);
    rest.price_bdt = Number(rest.price_bdt) || 0;
    rest.discount_price_bdt = rest.discount_price_bdt ? Number(rest.discount_price_bdt) : null;
    rest.hosting_bundle_price_bdt = rest.hosting_bundle_price_bdt ? Number(rest.hosting_bundle_price_bdt) : null;
    rest.sort_order = Number(rest.sort_order) || 0;

    if (!rest.name || !rest.slug) {
      toast({ title: "নাম ও স্লাগ আবশ্যক", variant: "destructive" });
      return;
    }

    if (isNew) {
      const { error } = await supabase.from("themes").insert(rest as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "থিম সফলভাবে যোগ হয়েছে!" });
      setShowAdd(false);
      setAddForm({ ...emptyForm });
    } else {
      const { error } = await supabase.from("themes").update(rest as any).eq("id", id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "থিম আপডেট হয়েছে!" });
      setEditingId(null);
      setEditForm({});
    }
    fetchThemes();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" থিমটি ডিলিট করতে চান?`)) return;
    await supabase.from("themes").delete().eq("id", id);
    toast({ title: "থিম ডিলিট হয়েছে!" });
    fetchThemes();
  };

  const filtered = themes.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase());
    const matchCat = filterCat === "all" || t.category === filterCat;
    return matchSearch && matchCat;
  });

  const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";

  const safeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");

  const uploadToBucket = async (bucket: string, file: File) => {
    const path = `${Date.now()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  };

  const handleThumbUpload = async (file: File, form: any, setForm: (f: any) => void) => {
    setUploading("thumb");
    try {
      const path = await uploadToBucket("theme-images", file);
      const { data } = supabase.storage.from("theme-images").getPublicUrl(path);
      setForm({ ...form, thumbnail_url: data.publicUrl });
      toast({ title: "থাম্বনেইল আপলোড হয়েছে!" });
    } catch (e: any) {
      toast({ title: "আপলোড ব্যর্থ", description: e.message, variant: "destructive" });
    }
    setUploading(null);
  };

  const handleShotsUpload = async (files: FileList, form: any, setForm: (f: any) => void) => {
    setUploading("shots");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = await uploadToBucket("theme-images", file);
        urls.push(supabase.storage.from("theme-images").getPublicUrl(path).data.publicUrl);
      }
      const current = parseJson(form.screenshots ?? []) || [];
      setForm({ ...form, screenshots: JSON.stringify([...current, ...urls]) });
      toast({ title: `${urls.length} টি স্ক্রিনশট আপলোড হয়েছে!` });
    } catch (e: any) {
      toast({ title: "আপলোড ব্যর্থ", description: e.message, variant: "destructive" });
    }
    setUploading(null);
  };

  const handleThemeFileUpload = async (file: File, form: any, setForm: (f: any) => void) => {
    setUploading("file");
    try {
      const path = await uploadToBucket("theme-files", file);
      setForm({ ...form, file_path: path });
      toast({ title: "থিম ফাইল আপলোড হয়েছে!" });
    } catch (e: any) {
      toast({ title: "আপলোড ব্যর্থ", description: e.message, variant: "destructive" });
    }
    setUploading(null);
  };

  const downloadThemeFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("theme-files").createSignedUrl(path, 300);
    if (error || !data) { toast({ title: "ডাউনলোড লিংক তৈরি হয়নি", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  const ThemeForm = ({ form, setForm, onSave, onCancel }: { form: any; setForm: (f: any) => void; onSave: () => void; onCancel: () => void }) => (
    <div className="glass-card p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">থিমের নাম *</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="ProBusiness Theme" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Slug *</label>
          <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="pro-business" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">ক্যাটাগরি</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
            {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabels[c]?.[lang] || c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">বিবরণ (BN)</label>
          <textarea value={form.description_bn || ""} onChange={e => setForm({ ...form, description_bn: e.target.value })} rows={2} className={inputClass + " resize-none"} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (EN)</label>
          <textarea value={form.description_en || ""} onChange={e => setForm({ ...form, description_en: e.target.value })} rows={2} className={inputClass + " resize-none"} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">মূল্য (৳)</label>
          <input type="number" value={form.price_bdt} onChange={e => setForm({ ...form, price_bdt: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">ডিসকাউন্ট মূল্য</label>
          <input type="number" value={form.discount_price_bdt || ""} onChange={e => setForm({ ...form, discount_price_bdt: e.target.value || null })} className={inputClass} placeholder="ঐচ্ছিক" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">বান্ডেল মূল্য</label>
          <input type="number" value={form.hosting_bundle_price_bdt || ""} onChange={e => setForm({ ...form, hosting_bundle_price_bdt: e.target.value || null })} className={inputClass} placeholder="ঐচ্ছিক" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
          <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">প্রিভিউ লিংক</label>
          <input value={form.preview_url || ""} onChange={e => setForm({ ...form, preview_url: e.target.value })} className={inputClass} placeholder="https://" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail URL</label>
          <input value={form.thumbnail_url || ""} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} className={inputClass} placeholder="https:// অথবা নিচে আপলোড করুন" />
        </div>
      </div>

      {/* Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Thumbnail upload */}
        <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground"><ImagePlus className="w-3.5 h-3.5" /> থাম্বনেইল আপলোড</div>
          {form.thumbnail_url && <img src={form.thumbnail_url} alt="thumbnail preview" className="w-full h-20 object-cover rounded-lg border border-border" />}
          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold cursor-pointer min-h-[44px]">
            {uploading === "thumb" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} ছবি বাছুন
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f, form, setForm); e.target.value = ""; }} />
          </label>
        </div>

        {/* Screenshots upload */}
        <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground"><ImagePlus className="w-3.5 h-3.5" /> স্ক্রিনশট আপলোড</div>
          <div className="flex flex-wrap gap-1.5">
            {(parseJson(form.screenshots ?? []) || []).map((url: string, i: number) => (
              <div key={i} className="relative">
                <img src={url} alt={`screenshot ${i + 1}`} className="w-12 h-9 object-cover rounded border border-border" />
                <button type="button" onClick={() => {
                  const list = (parseJson(form.screenshots ?? []) || []).filter((_: string, j: number) => j !== i);
                  setForm({ ...form, screenshots: JSON.stringify(list) });
                }} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-destructive-foreground">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold cursor-pointer min-h-[44px]">
            {uploading === "shots" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} একাধিক ছবি
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const fs = e.target.files; if (fs?.length) handleShotsUpload(fs, form, setForm); e.target.value = ""; }} />
          </label>
        </div>

        {/* Theme package upload */}
        <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground"><FileArchive className="w-3.5 h-3.5" /> থিম ফাইল (ZIP)</div>
          {form.file_path ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="truncate flex-1">{form.file_path}</span>
              <button type="button" onClick={() => downloadThemeFile(form.file_path)} className="p-1 rounded hover:bg-secondary/60"><Download className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setForm({ ...form, file_path: null })} className="p-1 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">সর্বোচ্চ ২০০ MB</p>
          )}
          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold cursor-pointer min-h-[44px]">
            {uploading === "file" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} ফাইল বাছুন
            <input type="file" accept=".zip,.rar,.7z,application/zip" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThemeFileUpload(f, form, setForm); e.target.value = ""; }} />
          </label>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Features (JSON)</label>
          <textarea value={typeof form.features === "string" ? form.features : JSON.stringify(form.features)} onChange={e => setForm({ ...form, features: e.target.value })} rows={2} className={inputClass + " resize-none font-mono text-xs"} placeholder='["Responsive", "SEO"]' />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (JSON)</label>
          <textarea value={typeof form.tags === "string" ? form.tags : JSON.stringify(form.tags)} onChange={e => setForm({ ...form, tags: e.target.value })} rows={2} className={inputClass + " resize-none font-mono text-xs"} placeholder='["modern", "clean"]' />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Bundle Features (JSON)</label>
          <textarea value={typeof form.hosting_bundle_features === "string" ? form.hosting_bundle_features : JSON.stringify(form.hosting_bundle_features)} onChange={e => setForm({ ...form, hosting_bundle_features: e.target.value })} rows={2} className={inputClass + " resize-none font-mono text-xs"} placeholder='["5GB SSD"]' />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" /> সক্রিয়
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" /> ফিচার্ড
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
          <Save className="w-4 h-4" /> সেভ করুন
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold">
          <X className="w-4 h-4" /> বাতিল
        </button>
      </div>
    </div>
  );

  if (loading) return <ThemesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="w-6 h-6" /> থিম ম্যানেজমেন্ট
          </h1>
          <p className="text-sm text-muted-foreground">মোট {themes.length} টি থিম</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddForm({ ...emptyForm }); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> নতুন থিম যোগ করুন
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="থিম সার্চ করুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">সব ক্যাটাগরি</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabels[c]?.[lang] || c}</option>)}
        </select>
      </div>

      {/* Add Form */}
      {showAdd && (
        <ThemeForm form={addForm} setForm={setAddForm} onSave={() => handleSave(true)} onCancel={() => { setShowAdd(false); setAddForm({ ...emptyForm }); }} />
      )}

      {/* Theme List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        {filtered.map(theme => (
          <div key={theme.id} className={editingId === theme.id ? "xl:col-span-2" : ""}>
            {editingId === theme.id ? (
              <ThemeForm form={editForm} setForm={setEditForm} onSave={() => handleSave(false)} onCancel={() => { setEditingId(null); setEditForm({}); }} />
            ) : (
              <div className="group glass-card px-3 py-2 rounded-lg hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-11 h-8 rounded-md bg-secondary/50 border border-border overflow-hidden shrink-0">
                    {theme.thumbnail_url ? (
                      <img src={theme.thumbnail_url} alt={theme.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] font-semibold text-foreground truncate">{theme.name}</span>
                      <span className="text-[10px] px-1.5 py-px rounded bg-primary/10 text-primary font-medium shrink-0">
                        {categoryLabels[theme.category]?.[lang] || theme.category}
                      </span>
                      {theme.is_featured && (
                        <Star className="w-3 h-3 text-primary shrink-0" />
                      )}
                      {!theme.is_active && (
                        <EyeOff className="w-3 h-3 text-destructive shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                      <span className="tabular-nums">
                        ৳{formatPrice(theme.discount_price_bdt || theme.price_bdt, lang)}
                        {theme.discount_price_bdt && <span className="line-through ml-1 opacity-60">৳{formatPrice(theme.price_bdt, lang)}</span>}
                      </span>
                      <span className="truncate">/{theme.slug}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    {theme.preview_url && (
                      <a href={theme.preview_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => { setEditingId(theme.id); setEditForm({ ...theme, features: JSON.stringify(theme.features), tags: JSON.stringify(theme.tags), hosting_bundle_features: JSON.stringify(theme.hosting_bundle_features), screenshots: JSON.stringify(theme.screenshots ?? []) }); setShowAdd(false); }}
                      className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(theme.id, theme.name)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="xl:col-span-2">
          <EmptyState
            icon={Palette}
            title={lang === "bn" ? "কোনো থিম পাওয়া যায়নি" : "No themes found"}
            description={lang === "bn" ? "নতুন থিম যোগ করুন অথবা সার্চ ফিল্টার পরিবর্তন করুন" : "Add a new theme or adjust your search filters"}
          />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminThemes;
