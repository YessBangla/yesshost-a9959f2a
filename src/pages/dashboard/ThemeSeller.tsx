import { useEffect, useMemo, useState } from "react";
import {
  Palette, Plus, Trash2, Loader2, Upload, ImagePlus, FileArchive, X, Save,
  TrendingUp, Wallet, ShoppingBag, Clock, CheckCircle2, AlertCircle, Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { formatAmount } from "@/lib/formatPrice";
import EmptyState from "@/components/EmptyState";
import { BillingSkeleton } from "@/components/DashboardSkeleton";
import DataToolbar from "@/components/DataToolbar";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

const approvalMeta: Record<string, { bn: string; en: string; cls: string }> = {
  pending: { bn: "পর্যালোচনায়", en: "In review", cls: "bg-warning/10 text-warning" },
  approved: { bn: "অনুমোদিত", en: "Approved", cls: "bg-success/10 text-success" },
  rejected: { bn: "বাতিল", en: "Rejected", cls: "bg-destructive/10 text-destructive" },
};

const MIN_PAYOUT = 500;
const MAX_IMAGE_MB = 5;
const MAX_ZIP_MB = 200;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
const ARCHIVE_EXT = [".zip", ".rar", ".7z", ".tar", ".gz"];
const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

const emptyForm = {
  name: "", slug: "", category: "business", description_bn: "", description_en: "",
  price_bdt: "", discount_price_bdt: "", preview_url: "", thumbnail_url: "", file_path: "",
};

const ThemeSeller = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showPayout, setShowPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", method: "bkash", account: "" });
  const [requesting, setRequesting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: myThemes } = await supabase
      .from("themes").select("*").eq("seller_user_id", user.id)
      .order("created_at", { ascending: false });
    const ids = (myThemes || []).map(t => t.id);
    const [{ data: orders }, { data: po }] = await Promise.all([
      ids.length
        ? supabase.from("theme_orders").select("*").in("theme_id", ids).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("theme_seller_payouts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setThemes(myThemes || []);
    setSales(orders || []);
    setPayouts(po || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const themeById = useMemo(() => Object.fromEntries(themes.map(t => [t.id, t])), [themes]);

  const paidSales = useMemo(() => sales.filter(s => s.status === "paid" || !!s.paid_at), [sales]);

  const earningsOf = (sale: any) => {
    const rate = Number(themeById[sale.theme_id]?.commission_rate ?? 30);
    return Number(sale.amount_bdt) * (1 - rate / 100);
  };

  const gross = paidSales.reduce((s, o) => s + Number(o.amount_bdt), 0);
  const net = paidSales.reduce((s, o) => s + earningsOf(o), 0);
  const commission = gross - net;
  const paidOut = payouts.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount_bdt), 0);
  const pendingOut = payouts.filter(p => p.status === "requested" || p.status === "approved").reduce((s, p) => s + Number(p.amount_bdt), 0);
  const available = Math.max(0, net - paidOut - pendingOut);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter(s => {
      const name = themeById[s.theme_id]?.name || "";
      const okSearch = !q || [name, s.status, s.payment_method, String(s.amount_bdt)]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      const okStatus = statusFilter === "all"
        || (statusFilter === "paid" ? (s.status === "paid" || !!s.paid_at) : s.status === statusFilter);
      return okSearch && okStatus;
    });
  }, [sales, search, statusFilter, themeById]);

  const saleFilters = useMemo(() => ([
    { value: "all", label: bn ? "সব" : "All", count: sales.length },
    { value: "paid", label: bn ? "পরিশোধিত" : "Paid", count: paidSales.length },
    { value: "pending", label: bn ? "অপেক্ষমাণ" : "Pending", count: sales.filter(s => s.status === "pending").length },
  ]), [sales, paidSales, bn]);

  const exportSales = () => downloadCsv(
    "yesshost-theme-sales",
    ["date", "theme", "amount_bdt", "commission_pct", "earning_bdt", "status", "payment_method"],
    filteredSales.map(s => [
      csvDate(s.created_at),
      themeById[s.theme_id]?.name || "",
      s.amount_bdt,
      themeById[s.theme_id]?.commission_rate ?? 30,
      earningsOf(s).toFixed(2),
      s.status,
      s.payment_method || "",
    ]),
  );

  // ---------- uploads ----------
  const safeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");

  const validateFile = (file: File, kind: "image" | "archive"): string | null => {
    if (file.size === 0) return bn ? "ফাইলটি খালি — সঠিক ফাইল বাছুন।" : "This file is empty — choose a valid file.";
    if (kind === "image") {
      if (!IMAGE_TYPES.includes(file.type)) {
        return bn ? "শুধু ছবি আপলোড করা যাবে (JPG, PNG, WebP, GIF, SVG)।" : "Only image files are allowed (JPG, PNG, WebP, GIF, SVG).";
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        return bn ? `ছবিটি ${mb(file.size)} MB — সর্বোচ্চ ${MAX_IMAGE_MB} MB।` : `This image is ${mb(file.size)} MB — the limit is ${MAX_IMAGE_MB} MB.`;
      }
      return null;
    }
    const lower = file.name.toLowerCase();
    if (!ARCHIVE_EXT.some(ext => lower.endsWith(ext))) {
      return bn ? "থিম প্যাকেজ অবশ্যই ZIP (বা RAR/7Z) হতে হবে।" : "The theme package must be a ZIP (or RAR/7Z).";
    }
    if (file.size > MAX_ZIP_MB * 1024 * 1024) {
      return bn ? `ফাইলটি ${mb(file.size)} MB — সর্বোচ্চ ${MAX_ZIP_MB} MB।` : `The file is ${mb(file.size)} MB — the limit is ${MAX_ZIP_MB} MB.`;
    }
    return null;
  };

  const uploadFile = async (bucket: string, file: File) => {
    const path = `${user?.id}/${Date.now()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  };

  const onThumb = async (file: File) => {
    const invalid = validateFile(file, "image");
    if (invalid) { toast({ title: bn ? "ছবিটি গ্রহণ করা যায়নি" : "Image not accepted", description: invalid, variant: "destructive" }); return; }
    setUploading("thumb");
    try {
      const path = await uploadFile("theme-images", file);
      const { data } = supabase.storage.from("theme-images").getPublicUrl(path);
      setForm((f: any) => ({ ...f, thumbnail_url: data.publicUrl }));
      toast({ title: bn ? "ছবি আপলোড হয়েছে" : "Image uploaded" });
    } catch (e: any) {
      toast({ title: bn ? "আপলোড ব্যর্থ" : "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(null);
  };

  const onZip = async (file: File) => {
    const invalid = validateFile(file, "archive");
    if (invalid) { toast({ title: bn ? "ফাইলটি গ্রহণ করা যায়নি" : "File not accepted", description: invalid, variant: "destructive" }); return; }
    setUploading("zip");
    try {
      const path = await uploadFile("theme-files", file);
      setForm((f: any) => ({ ...f, file_path: path }));
      toast({ title: bn ? `থিম ফাইল আপলোড হয়েছে (${mb(file.size)} MB)` : `Theme file uploaded (${mb(file.size)} MB)` });
    } catch (e: any) {
      toast({ title: bn ? "আপলোড ব্যর্থ" : "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(null);
  };

  // ---------- submit theme ----------
  const submitTheme = async () => {
    if (!user) return;
    const price = Number(form.price_bdt);
    if (!form.name.trim() || !price) {
      toast({ title: bn ? "থিমের নাম ও দাম দিন" : "Theme name and price are required", variant: "destructive" });
      return;
    }
    if (!form.thumbnail_url) {
      toast({ title: bn ? "থিমের একটি ছবি দিন" : "Please upload a theme image", variant: "destructive" });
      return;
    }
    if (!form.file_path) {
      toast({ title: bn ? "থিমের ZIP ফাইল আপলোড করুন" : "Please upload the theme ZIP file", variant: "destructive" });
      return;
    }
    const slug = (form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")) + "-" + Date.now().toString(36);
    setSaving(true);
    const { error } = await supabase.from("themes").insert({
      name: form.name.trim(),
      slug,
      category: form.category as any,
      description_bn: form.description_bn || null,
      description_en: form.description_en || null,
      price_bdt: price,
      discount_price_bdt: form.discount_price_bdt ? Number(form.discount_price_bdt) : null,
      preview_url: form.preview_url || null,
      thumbnail_url: form.thumbnail_url,
      file_path: form.file_path,
      seller_user_id: user.id,
      approval_status: "pending",
      is_active: false,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: bn ? "জমা দেওয়া যায়নি" : "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: bn ? "থিম জমা হয়েছে" : "Theme submitted",
      description: bn ? "অনুমোদনের পর আপনার থিম মার্কেটপ্লেসে বিক্রির জন্য দেখা যাবে।" : "Once approved it will go on sale in the marketplace.",
    });
    setShowAdd(false);
    setForm({ ...emptyForm });
    load();
  };

  const deleteTheme = async (theme: any) => {
    if (!confirm(bn ? `"${theme.name}" মুছে ফেলতে চান?` : `Delete "${theme.name}"?`)) return;
    setDeletingId(theme.id);
    try {
      if (theme.file_path) await supabase.storage.from("theme-files").remove([theme.file_path]);
      const { error } = await supabase.from("themes").delete().eq("id", theme.id);
      if (error) throw error;
      toast({ title: bn ? "থিম মুছে ফেলা হয়েছে" : "Theme deleted" });
      load();
    } catch (e: any) {
      toast({ title: bn ? "মুছে ফেলা যায়নি" : "Delete failed", description: e.message, variant: "destructive" });
    }
    setDeletingId(null);
  };

  // ---------- payout ----------
  const requestPayout = async () => {
    if (!user) return;
    const amount = Number(payoutForm.amount);
    if (!amount || amount < MIN_PAYOUT) {
      toast({ title: bn ? `সর্বনিম্ন ৳${MIN_PAYOUT} উত্তোলন করা যাবে` : `Minimum payout is ৳${MIN_PAYOUT}`, variant: "destructive" });
      return;
    }
    if (amount > available) {
      toast({ title: bn ? "আপনার ব্যালেন্সের চেয়ে বেশি" : "Amount exceeds your balance", variant: "destructive" });
      return;
    }
    if (!payoutForm.account.trim()) {
      toast({ title: bn ? "অ্যাকাউন্ট নম্বর দিন" : "Enter your account details", variant: "destructive" });
      return;
    }
    setRequesting(true);
    const { error } = await supabase.from("theme_seller_payouts").insert({
      user_id: user.id, amount_bdt: amount, method: payoutForm.method,
      account_details: payoutForm.account.trim(), status: "requested",
    });
    setRequesting(false);
    if (error) {
      toast({ title: bn ? "অনুরোধ পাঠানো যায়নি" : "Request failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: bn ? "উত্তোলনের অনুরোধ পাঠানো হয়েছে" : "Payout request sent" });
    setShowPayout(false);
    setPayoutForm({ amount: "", method: "bkash", account: "" });
    load();
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30";
  const fmt = (n: number) => `৳${formatAmount(n, lang)}`;

  if (loading) return <BillingSkeleton />;

  const stats = [
    { label: bn ? "মোট বিক্রি" : "Total Sales", value: String(paidSales.length), icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
    { label: bn ? "মোট আয় (গ্রস)" : "Gross Revenue", value: fmt(gross), icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: bn ? "আপনার আয় (নিট)" : "Your Earnings", value: fmt(net), icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: bn ? "উত্তোলনযোগ্য" : "Available", value: fmt(available), icon: CheckCircle2, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bn ? "থিম বিক্রেতা ড্যাশবোর্ড" : "Theme Seller Dashboard"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bn ? "নিজের থিম দাম দিয়ে বিক্রি করুন, বিক্রির রিপোর্ট ও আয় দেখুন" : "Sell your own themes, track sales and earnings"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPayout(true)} className="gap-2">
            <Send className="w-4 h-4" />
            {bn ? "আয় উত্তোলন" : "Withdraw"}
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {bn ? "থিম বিক্রি করুন" : "Sell a Theme"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <span>
          {bn
            ? `প্ল্যাটফর্ম কমিশন বাদ দিয়ে বিক্রির টাকা আপনার আয়ে যোগ হয়। এ পর্যন্ত কমিশন: ${fmt(commission)} • পরিশোধিত: ${fmt(paidOut)} • প্রক্রিয়াধীন: ${fmt(pendingOut)}। সর্বনিম্ন ৳${MIN_PAYOUT} উত্তোলন করা যায়।`
            : `Earnings are credited after the platform commission. Commission so far: ${fmt(commission)} • Paid out: ${fmt(paidOut)} • In process: ${fmt(pendingOut)}. Minimum withdrawal ৳${MIN_PAYOUT}.`}
        </span>
      </div>

      {/* My themes */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">{bn ? "আমার থিম" : "My Themes"}</h2>
        {themes.length === 0 ? (
          <EmptyState
            icon={Palette}
            title={bn ? "এখনো কোনো থিম নেই" : "No themes yet"}
            description={bn ? "\"থিম বিক্রি করুন\" চেপে আপনার প্রথম থিম জমা দিন" : "Click \"Sell a Theme\" to submit your first theme"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(t => {
              const themeSales = paidSales.filter(s => s.theme_id === t.id);
              const earned = themeSales.reduce((sum, s) => sum + earningsOf(s), 0);
              const meta = approvalMeta[t.approval_status] || approvalMeta.pending;
              return (
                <div key={t.id} className="glass-card rounded-xl overflow-hidden">
                  <div className="aspect-video bg-secondary/40 overflow-hidden">
                    {t.thumbnail_url
                      ? <img src={t.thumbnail_url} alt={t.name} loading="lazy" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Palette className="w-8 h-8 text-muted-foreground" /></div>}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{categoryLabels[t.category]?.[bn ? "bn" : "en"] || t.category}</p>
                      </div>
                      <Badge className={meta.cls} variant="secondary">{bn ? meta.bn : meta.en}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{bn ? "দাম" : "Price"}: <span className="text-foreground font-semibold">{fmt(Number(t.price_bdt))}</span></span>
                      <span>{bn ? "কমিশন" : "Commission"}: {t.commission_rate ?? 30}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{bn ? "বিক্রি" : "Sold"}: <span className="text-foreground font-semibold">{themeSales.length}</span></span>
                      <span className="text-muted-foreground">{bn ? "আয়" : "Earned"}: <span className="text-success font-semibold">{fmt(earned)}</span></span>
                    </div>
                    {t.approval_status === "rejected" && t.approval_note && (
                      <p className="text-xs text-destructive">{t.approval_note}</p>
                    )}
                    {t.approval_status !== "approved" && (
                      <button
                        onClick={() => deleteTheme(t)}
                        disabled={deletingId === t.id}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      >
                        {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {bn ? "মুছে ফেলুন" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sales report */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">{bn ? "বিক্রির রিপোর্ট" : "Sales Report"}</h2>
        {sales.length > 0 && (
          <div className="mb-4">
            <DataToolbar
              search={search}
              onSearch={setSearch}
              placeholder={bn ? "থিম, অবস্থা বা পরিমাণ খুঁজুন..." : "Search theme, status or amount..."}
              filters={saleFilters}
              activeFilter={statusFilter}
              onFilter={setStatusFilter}
              onExport={exportSales}
              onRefresh={load}
              resultCount={filteredSales.length}
            />
          </div>
        )}
        {sales.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={bn ? "এখনো কোনো বিক্রি হয়নি" : "No sales yet"}
            description={bn ? "থিম অনুমোদিত হলে বিক্রি এখানে দেখা যাবে" : "Sales appear here once your themes are approved"}
          />
        ) : filteredSales.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
            {bn ? "এই ফিল্টারে কোনো বিক্রি নেই" : "No sales match this filter"}
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    {[bn ? "তারিখ" : "Date", bn ? "থিম" : "Theme", bn ? "বিক্রয় মূল্য" : "Amount", bn ? "আপনার আয়" : "Your earning", bn ? "অবস্থা" : "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(s => {
                    const isPaid = s.status === "paid" || !!s.paid_at;
                    return (
                      <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/10">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-4 py-3 text-foreground">{themeById[s.theme_id]?.name || "—"}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">{fmt(Number(s.amount_bdt))}</td>
                        <td className="px-4 py-3 text-success font-semibold">{isPaid ? fmt(earningsOf(s)) : "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={isPaid ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                            {isPaid ? (bn ? "পরিশোধিত" : "Paid") : (bn ? "অপেক্ষমাণ" : "Pending")}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payout history */}
      {payouts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">{bn ? "উত্তোলনের ইতিহাস" : "Withdrawal History"}</h2>
          <div className="space-y-2.5">
            {payouts.map(p => (
              <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{fmt(Number(p.amount_bdt))} · {p.method}</p>
                  <p className="text-xs text-muted-foreground">{p.account_details} · {new Date(p.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p>
                </div>
                <Badge variant="secondary" className={p.status === "paid" ? "bg-success/10 text-success" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                  {p.status === "paid" ? (bn ? "পরিশোধিত" : "Paid")
                    : p.status === "rejected" ? (bn ? "বাতিল" : "Rejected")
                    : p.status === "approved" ? (bn ? "অনুমোদিত" : "Approved")
                    : (bn ? "অনুরোধকৃত" : "Requested")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add theme dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-foreground">{bn ? "নতুন থিম বিক্রির জন্য জমা দিন" : "Submit a theme for sale"}</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "থিমের নাম *" : "Theme name *"}</label>
                <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "ক্যাটাগরি" : "Category"}</label>
                <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabels[c][bn ? "bn" : "en"]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "বিক্রয় মূল্য (৳) *" : "Selling price (৳) *"}</label>
                <input type="number" min={0} className={inputClass} value={form.price_bdt} onChange={e => setForm({ ...form, price_bdt: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "ছাড় মূল্য (৳)" : "Discount price (৳)"}</label>
                <input type="number" min={0} className={inputClass} value={form.discount_price_bdt} onChange={e => setForm({ ...form, discount_price_bdt: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "বিবরণ (বাংলা)" : "Description (Bangla)"}</label>
                <textarea rows={3} className={inputClass} value={form.description_bn} onChange={e => setForm({ ...form, description_bn: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "বিবরণ (ইংরেজি)" : "Description (English)"}</label>
                <textarea rows={3} className={inputClass} value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "ডেমো লিংক" : "Demo URL"}</label>
              <input className={inputClass} placeholder="https://" value={form.preview_url} onChange={e => setForm({ ...form, preview_url: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "থিমের ছবি *" : "Theme image *"}</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer text-sm text-muted-foreground hover:bg-secondary/40">
                  {uploading === "thumb" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  <span className="truncate">{form.thumbnail_url ? (bn ? "ছবি যুক্ত হয়েছে" : "Image added") : (bn ? "ছবি বাছুন" : "Choose image")}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onThumb(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "থিম ফাইল (ZIP) *" : "Theme file (ZIP) *"}</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer text-sm text-muted-foreground hover:bg-secondary/40">
                  {uploading === "zip" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                  <span className="truncate">{form.file_path ? (bn ? "ফাইল যুক্ত হয়েছে" : "File added") : (bn ? "ZIP বাছুন" : "Choose ZIP")}</span>
                  <input type="file" accept=".zip,.rar,.7z,.tar,.gz" className="hidden" onChange={e => e.target.files?.[0] && onZip(e.target.files[0])} />
                </label>
              </div>
            </div>

            {form.thumbnail_url && (
              <img src={form.thumbnail_url} alt="preview" className="w-full max-h-52 object-cover rounded-lg border border-border" />
            )}

            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {bn ? "জমা দেওয়ার পর অ্যাডমিন পর্যালোচনা করে অনুমোদন দিলে থিমটি মার্কেটপ্লেসে বিক্রি শুরু হবে।" : "After submission an admin reviews it; once approved your theme goes on sale in the marketplace."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="gap-2"><X className="w-4 h-4" />{bn ? "বাতিল" : "Cancel"}</Button>
              <Button onClick={submitTheme} disabled={saving || !!uploading} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {bn ? "জমা দিন" : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payout dialog */}
      <Dialog open={showPayout} onOpenChange={setShowPayout}>
        <DialogContent className="max-w-md bg-card">
          <h3 className="text-lg font-bold text-foreground mb-1">{bn ? "আয় উত্তোলনের অনুরোধ" : "Request a withdrawal"}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {bn ? `উত্তোলনযোগ্য ব্যালেন্স: ${fmt(available)}` : `Available balance: ${fmt(available)}`}
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "পরিমাণ (৳)" : "Amount (৳)"}</label>
              <input type="number" min={MIN_PAYOUT} className={inputClass} value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "মাধ্যম" : "Method"}</label>
              <select className={inputClass} value={payoutForm.method} onChange={e => setPayoutForm({ ...payoutForm, method: e.target.value })}>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">{bn ? "ব্যাংক" : "Bank"}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{bn ? "অ্যাকাউন্ট নম্বর / তথ্য" : "Account number / details"}</label>
              <input className={inputClass} value={payoutForm.account} onChange={e => setPayoutForm({ ...payoutForm, account: e.target.value })} />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowPayout(false)}>{bn ? "বাতিল" : "Cancel"}</Button>
              <Button onClick={requestPayout} disabled={requesting} className="gap-2">
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {bn ? "অনুরোধ পাঠান" : "Send request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThemeSeller;
