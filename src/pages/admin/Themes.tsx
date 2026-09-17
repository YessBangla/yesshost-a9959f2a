import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Palette, Search, Eye, EyeOff, Star, Upload, ImagePlus, FileArchive, Download, Loader2, Power, Monitor, ExternalLink, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
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
  const [previewTheme, setPreviewTheme] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [sellerPayouts, setSellerPayouts] = useState<any[]>([]);

  const fetchThemes = async () => {
    setLoading(true);
    const [{ data }, { data: po }] = await Promise.all([
      supabase.from("themes").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("theme_seller_payouts").select("*").order("created_at", { ascending: false }),
    ]);
    setThemes(data || []);
    setSellerPayouts(po || []);
    setLoading(false);
  };

  useEffect(() => { fetchThemes(); }, []);

  const setApproval = async (theme: any, status: "approved" | "rejected") => {
    let note: string | null = null;
    if (status === "rejected") {
      note = window.prompt(lang === "bn" ? "বাতিলের কারণ লিখুন (বিক্রেতা দেখতে পাবেন)" : "Reason for rejection (visible to the seller)") || null;
    }
    setApprovingId(theme.id);
    const { error } = await supabase.from("themes")
      .update({ approval_status: status, approval_note: note, is_active: status === "approved" } as any)
      .eq("id", theme.id);
    setApprovingId(null);
    if (error) { toast({ title: lang === "bn" ? "সেভ হয়নি" : "Could not save", description: error.message, variant: "destructive" }); return; }
    toast({
      title: status === "approved"
        ? (lang === "bn" ? `"${theme.name}" অনুমোদিত ও মার্কেটপ্লেসে লাইভ` : `"${theme.name}" approved and live`)
        : (lang === "bn" ? `"${theme.name}" বাতিল করা হয়েছে` : `"${theme.name}" rejected`),
    });
    fetchThemes();
  };

  const setPayoutStatus = async (payout: any, status: "approved" | "paid" | "rejected") => {
    const { error } = await supabase.from("theme_seller_payouts")
      .update({ status, processed_at: status === "paid" ? new Date().toISOString() : null })
      .eq("id", payout.id);
    if (error) { toast({ title: lang === "bn" ? "সেভ হয়নি" : "Could not save", description: error.message, variant: "destructive" }); return; }
    toast({ title: lang === "bn" ? "অবস্থা আপডেট হয়েছে" : "Status updated" });
    fetchThemes();
  };

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

  const handleDelete = async (theme: Tables<"themes">) => {
    const msg = lang === "bn"
      ? `"${theme.name}" থিমটি স্থায়ীভাবে মুছে ফেলতে চান? আপলোড করা ফাইল ও ছবিও মুছে যাবে।`
      : `Permanently delete "${theme.name}"? Uploaded files and images will also be removed.`;
    if (!confirm(msg)) return;
    setDeletingId(theme.id);
    try {
      if (theme.file_path) {
        await supabase.storage.from("theme-files").remove([theme.file_path]);
      }
      const imgUrls = [theme.thumbnail_url, ...((theme.screenshots as any as string[]) || [])].filter(Boolean) as string[];
      const imgPaths = imgUrls
        .filter(u => u.includes("/theme-images/"))
        .map(u => decodeURIComponent(u.split("/theme-images/")[1].split("?")[0]));
      if (imgPaths.length) await supabase.storage.from("theme-images").remove(imgPaths);

      const { error } = await supabase.from("themes").delete().eq("id", theme.id);
      if (error) throw error;
      toast({ title: lang === "bn" ? "থিম মুছে ফেলা হয়েছে" : "Theme deleted" });
      if (previewTheme?.id === theme.id) setPreviewTheme(null);
      fetchThemes();
    } catch (e: any) {
      toast({ title: lang === "bn" ? "মুছে ফেলা যায়নি" : "Delete failed", description: e.message, variant: "destructive" });
    }
    setDeletingId(null);
  };

  const toggleActive = async (theme: Tables<"themes">) => {
    const next = !theme.is_active;
    setTogglingId(theme.id);
    setThemes(prev => prev.map(t => (t.id === theme.id ? { ...t, is_active: next } : t)));
    const { error } = await supabase.from("themes").update({ is_active: next }).eq("id", theme.id);
    setTogglingId(null);
    if (error) {
      setThemes(prev => prev.map(t => (t.id === theme.id ? { ...t, is_active: !next } : t)));
      toast({ title: lang === "bn" ? "পরিবর্তন সেভ হয়নি" : "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: next
        ? (lang === "bn" ? `"${theme.name}" এখন সাইটে লাইভ` : `"${theme.name}" is now live`)
        : (lang === "bn" ? `"${theme.name}" সাইট থেকে সরানো হয়েছে` : `"${theme.name}" hidden from site`),
    });
  };

  const filtered = themes.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase());
    const matchCat = filterCat === "all" || t.category === filterCat;
    return matchSearch && matchCat;
  });

  const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30";

  const safeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");

  const MAX_IMAGE_MB = 5;
  const MAX_ZIP_MB = 200;
  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
  const ARCHIVE_EXT = [".zip", ".rar", ".7z", ".tar", ".gz"];
  const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

  const showError = (title: string, description: string) =>
    toast({ title, description, variant: "destructive" });

  // returns an error message (localized) or null when the file is acceptable
  const validateFile = (file: File, kind: "image" | "archive"): string | null => {
    if (file.size === 0) {
      return lang === "bn" ? "ফাইলটি খালি — সঠিক ফাইল বাছুন।" : "This file is empty — choose a valid file.";
    }
    if (kind === "image") {
      if (!IMAGE_TYPES.includes(file.type)) {
        return lang === "bn"
          ? `শুধু ছবি আপলোড করা যাবে (JPG, PNG, WebP, GIF, SVG)। আপনি দিয়েছেন: ${file.name.split(".").pop()?.toUpperCase() || "অজানা"} ফাইল।`
          : `Only image files are allowed (JPG, PNG, WebP, GIF, SVG). You picked a ${file.name.split(".").pop()?.toUpperCase() || "unknown"} file.`;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        return lang === "bn"
          ? `ছবিটি ${mb(file.size)} MB — সর্বোচ্চ ${MAX_IMAGE_MB} MB পর্যন্ত আপলোড করা যাবে। ছবিটি ছোট করে আবার চেষ্টা করুন।`
          : `This image is ${mb(file.size)} MB — the limit is ${MAX_IMAGE_MB} MB. Please compress it and try again.`;
      }
      return null;
    }
    const lower = file.name.toLowerCase();
    if (!ARCHIVE_EXT.some(ext => lower.endsWith(ext))) {
      return lang === "bn"
        ? `থিম প্যাকেজ অবশ্যই ZIP (বা RAR/7Z) হতে হবে। আপনি "${file.name}" দিয়েছেন — ফাইলগুলো ZIP করে আবার আপলোড করুন।`
        : `The theme package must be a ZIP (or RAR/7Z). You picked "${file.name}" — please compress your files into a ZIP and retry.`;
    }
    if (file.size > MAX_ZIP_MB * 1024 * 1024) {
      return lang === "bn"
        ? `ফাইলটি ${mb(file.size)} MB — সর্বোচ্চ ${MAX_ZIP_MB} MB পর্যন্ত আপলোড করা যাবে। অপ্রয়োজনীয় ফাইল বাদ দিয়ে আবার চেষ্টা করুন।`
        : `The file is ${mb(file.size)} MB — the limit is ${MAX_ZIP_MB} MB. Remove unneeded files and try again.`;
    }
    return null;
  };

  const friendlyUploadError = (e: any) => {
    const msg = String(e?.message || "");
    if (/exceeded|too large|maximum size/i.test(msg)) {
      return lang === "bn" ? `ফাইলটি সার্ভারের সর্বোচ্চ সীমার (${MAX_ZIP_MB} MB) চেয়ে বড়।` : `The file exceeds the server limit (${MAX_ZIP_MB} MB).`;
    }
    if (/row-level security|not authorized|permission/i.test(msg)) {
      return lang === "bn" ? "আপলোডের অনুমতি নেই — অ্যাডমিন হিসেবে লগইন করা আছে কিনা দেখুন।" : "You do not have permission to upload — make sure you are signed in as an admin.";
    }
    if (/network|failed to fetch/i.test(msg)) {
      return lang === "bn" ? "ইন্টারনেট সংযোগে সমস্যা — আবার চেষ্টা করুন।" : "Network problem — please try again.";
    }
    return msg || (lang === "bn" ? "অজানা সমস্যা হয়েছে।" : "Something went wrong.");
  };

  const uploadToBucket = async (bucket: string, file: File) => {
    const path = `${Date.now()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  };

  const handleThumbUpload = async (file: File, form: any, setForm: (f: any) => void) => {
    const invalid = validateFile(file, "image");
    if (invalid) { showError(lang === "bn" ? "ছবিটি গ্রহণ করা যায়নি" : "Image not accepted", invalid); return; }
    setUploading("thumb");
    try {
      const path = await uploadToBucket("theme-images", file);
      const { data } = supabase.storage.from("theme-images").getPublicUrl(path);
      setForm({ ...form, thumbnail_url: data.publicUrl });
      toast({ title: lang === "bn" ? "থাম্বনেইল আপলোড হয়েছে!" : "Thumbnail uploaded!" });
    } catch (e: any) {
      showError(lang === "bn" ? "আপলোড ব্যর্থ" : "Upload failed", friendlyUploadError(e));
    }
    setUploading(null);
  };

  const handleShotsUpload = async (files: FileList, form: any, setForm: (f: any) => void) => {
    const list = Array.from(files);
    const rejected: string[] = [];
    const accepted = list.filter(f => {
      const invalid = validateFile(f, "image");
      if (invalid) { rejected.push(`${f.name}: ${invalid}`); return false; }
      return true;
    });
    if (rejected.length) showError(lang === "bn" ? `${rejected.length} টি ছবি বাদ পড়েছে` : `${rejected.length} image(s) skipped`, rejected.join("\n"));
    if (!accepted.length) return;
    setUploading("shots");
    try {
      const urls: string[] = [];
      for (const file of accepted) {
        const path = await uploadToBucket("theme-images", file);
        urls.push(supabase.storage.from("theme-images").getPublicUrl(path).data.publicUrl);
      }
      const current = parseJson(form.screenshots ?? []) || [];
      setForm({ ...form, screenshots: JSON.stringify([...current, ...urls]) });
      toast({ title: lang === "bn" ? `${urls.length} টি স্ক্রিনশট আপলোড হয়েছে!` : `${urls.length} screenshot(s) uploaded!` });
    } catch (e: any) {
      showError(lang === "bn" ? "আপলোড ব্যর্থ" : "Upload failed", friendlyUploadError(e));
    }
    setUploading(null);
  };

  const handleThemeFileUpload = async (file: File, form: any, setForm: (f: any) => void) => {
    const invalid = validateFile(file, "archive");
    if (invalid) { showError(lang === "bn" ? "ফাইলটি গ্রহণ করা যায়নি" : "File not accepted", invalid); return; }
    setUploading("file");
    try {
      const path = await uploadToBucket("theme-files", file);
      setForm({ ...form, file_path: path });
      toast({ title: lang === "bn" ? `থিম ফাইল আপলোড হয়েছে (${mb(file.size)} MB)` : `Theme file uploaded (${mb(file.size)} MB)` });
    } catch (e: any) {
      showError(lang === "bn" ? "আপলোড ব্যর্থ" : "Upload failed", friendlyUploadError(e));
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
                <img src={url} alt={`screenshot ${i + 1}`} className="w-12 h-9 object-cover rounded-sm border border-border" />
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
              <button type="button" onClick={() => downloadThemeFile(form.file_path)} className="p-1 rounded-sm hover:bg-secondary/60"><Download className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setForm({ ...form, file_path: null })} className="p-1 rounded-sm text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
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
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded-sm" /> সক্রিয়
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded-sm" /> ফিচার্ড
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30">
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
                      <span className="text-[10px] px-1.5 py-px rounded-sm bg-primary/10 text-primary font-medium shrink-0">
                        {categoryLabels[theme.category]?.[lang] || theme.category}
                      </span>
                      {theme.is_featured && (
                        <Star className="w-3 h-3 text-primary shrink-0" />
                      )}
                      {!theme.is_active && (
                        <EyeOff className="w-3 h-3 text-destructive shrink-0" />
                      )}
                      {(theme as any).seller_user_id && (
                        <span className={`text-[10px] px-1.5 py-px rounded-sm font-medium shrink-0 ${
                          (theme as any).approval_status === "approved" ? "bg-success/10 text-success"
                          : (theme as any).approval_status === "rejected" ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"}`}>
                          {(theme as any).approval_status === "approved" ? (lang === "bn" ? "বিক্রেতা · অনুমোদিত" : "Seller · Approved")
                            : (theme as any).approval_status === "rejected" ? (lang === "bn" ? "বিক্রেতা · বাতিল" : "Seller · Rejected")
                            : (lang === "bn" ? "বিক্রেতা · পর্যালোচনায়" : "Seller · In review")}
                        </span>
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
                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {(theme as any).seller_user_id && (theme as any).approval_status !== "approved" && (
                      <button
                        onClick={() => setApproval(theme, "approved")}
                        disabled={approvingId === theme.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-success/10 text-success hover:bg-success/20">
                        {approvingId === theme.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        {lang === "bn" ? "অনুমোদন" : "Approve"}
                      </button>
                    )}
                    {(theme as any).seller_user_id && (theme as any).approval_status !== "rejected" && (
                      <button
                        onClick={() => setApproval(theme, "rejected")}
                        disabled={approvingId === theme.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <XCircle className="w-3 h-3" />
                        {lang === "bn" ? "বাতিল" : "Reject"}
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewTheme(theme)}
                      title={lang === "bn" ? "লাইভ প্রিভিউ (প্রয়োগ ছাড়াই)" : "Live preview (without applying)"}
                      className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground">
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(theme)}
                      disabled={togglingId === theme.id}
                      title={theme.is_active ? (lang === "bn" ? "সাইট থেকে সরান" : "Remove from site") : (lang === "bn" ? "সাইটে প্রয়োগ করুন" : "Apply to site")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${theme.is_active ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                      {togglingId === theme.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                      {theme.is_active ? (lang === "bn" ? "লাইভ" : "Live") : (lang === "bn" ? "প্রয়োগ" : "Apply")}
                    </button>
                    <button onClick={() => { setEditingId(theme.id); setEditForm({ ...theme, features: JSON.stringify(theme.features), tags: JSON.stringify(theme.tags), hosting_bundle_features: JSON.stringify(theme.hosting_bundle_features), screenshots: JSON.stringify(theme.screenshots ?? []) }); setShowAdd(false); }}
                      className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(theme)} disabled={deletingId === theme.id} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive">
                      {deletingId === theme.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Seller payout requests */}
      {sellerPayouts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            {lang === "bn" ? "বিক্রেতার আয় উত্তোলনের অনুরোধ" : "Seller Payout Requests"}
          </h2>
          <div className="space-y-2">
            {sellerPayouts.map(p => (
              <div key={p.id} className="glass-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">৳{formatPrice(Number(p.amount_bdt), lang)} · {p.method}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.account_details} · {new Date(p.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-1 rounded-md font-semibold ${
                    p.status === "paid" ? "bg-success/10 text-success"
                    : p.status === "rejected" ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning"}`}>
                    {p.status}
                  </span>
                  {p.status !== "paid" && (
                    <>
                      {p.status === "requested" && (
                        <button onClick={() => setPayoutStatus(p, "approved")} className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20">
                          {lang === "bn" ? "অনুমোদন" : "Approve"}
                        </button>
                      )}
                      <button onClick={() => setPayoutStatus(p, "paid")} className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-success/10 text-success hover:bg-success/20">
                        {lang === "bn" ? "পরিশোধিত" : "Mark paid"}
                      </button>
                      {p.status !== "rejected" && (
                        <button onClick={() => setPayoutStatus(p, "rejected")} className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20">
                          {lang === "bn" ? "বাতিল" : "Reject"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Live preview (does not apply the theme) */}
      {previewTheme && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-xs flex items-center justify-center p-3" onClick={() => setPreviewTheme(null)}>
          <div className="bg-popover border border-border rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Monitor className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{previewTheme.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {lang === "bn" ? "লাইভ প্রিভিউ — সাইটে প্রয়োগ করা হয়নি" : "Live preview — not applied to the site"}
                </p>
              </div>
              <button
                onClick={() => toggleActive(previewTheme).then(() => setPreviewTheme({ ...previewTheme, is_active: !previewTheme.is_active }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${previewTheme.is_active ? "bg-secondary text-foreground" : "gradient-primary text-primary-foreground"}`}>
                <Power className="w-3.5 h-3.5" />
                {previewTheme.is_active ? (lang === "bn" ? "সাইট থেকে সরান" : "Remove from site") : (lang === "bn" ? "সাইটে প্রয়োগ করুন" : "Apply to site")}
              </button>
              <button onClick={() => setPreviewTheme(null)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {previewTheme.preview_url ? (
                <iframe
                  src={previewTheme.preview_url}
                  title={`${previewTheme.name} preview`}
                  className="w-full h-[70vh] bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  loading="lazy"
                />
              ) : (
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2 rounded-xl bg-secondary/50 border border-border p-3 text-xs text-muted-foreground">
                    <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
                    <span>
                      {lang === "bn"
                        ? "এই থিমের কোনো প্রিভিউ লিংক দেওয়া নেই, তাই আপলোড করা ছবিগুলো দেখানো হচ্ছে। সম্পাদনা করে প্রিভিউ লিংক যোগ করলে এখানে পুরো সাইট দেখা যাবে।"
                        : "No preview link is set for this theme, so the uploaded images are shown. Add a preview link while editing to see the full site here."}
                    </span>
                  </div>
                  {previewTheme.thumbnail_url && (
                    <img src={previewTheme.thumbnail_url} alt={`${previewTheme.name} thumbnail`} className="w-full rounded-xl border border-border" />
                  )}
                  {((previewTheme.screenshots as string[]) || []).map((url: string, i: number) => (
                    <img key={i} src={url} alt={`${previewTheme.name} screenshot ${i + 1}`} className="w-full rounded-xl border border-border" />
                  ))}
                </div>
              )}
            </div>

            {previewTheme.preview_url && (
              <div className="px-4 py-2.5 border-t border-border">
                <a href={previewTheme.preview_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <ExternalLink className="w-3.5 h-3.5" /> {lang === "bn" ? "নতুন ট্যাবে খুলুন" : "Open in new tab"}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThemes;
