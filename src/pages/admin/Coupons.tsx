import { useCallback, useEffect, useMemo, useState } from "react";
import { Tag, Plus, Pencil, Trash2, Copy, Download, RefreshCw, CirclePercent, ShoppingCart, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: 0,
  max_uses: 0,
  is_active: true,
  expires_at: "",
};

const AdminCoupons = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCoupons = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data as any as Coupon[]) || []);
    if (loadError) setError(bn ? "কুপনের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" : "Coupon data could not be loaded. Please try again.");
    setLoading(false);
  }, [bn]);

  useEffect(() => { void fetchCoupons(); }, [fetchCoupons]);
  useEffect(() => { setPage(1); }, [search, status, pageSize]);

  const stateOf = (coupon: Coupon) => !coupon.is_active ? "inactive" : coupon.expires_at && Date.parse(coupon.expires_at) < Date.now() ? "expired" : coupon.max_uses && coupon.used_count >= coupon.max_uses ? "exhausted" : "active";
  const filtered = useMemo(() => coupons.filter(c => {
    const query = search.trim().toLowerCase();
    return (!query || c.code.toLowerCase().includes(query) || (c.description || "").toLowerCase().includes(query)) && (status === "all" || stateOf(c) === status);
  }), [coupons, search, status]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => stateOf(c) === "active").length;
  const totalUsed = coupons.reduce((s, c) => s + c.used_count, 0);
  const expiringSoon = coupons.filter(c => c.expires_at && Date.parse(c.expires_at) >= Date.now() && Date.parse(c.expires_at) <= Date.now() + 30 * 86400000).length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount || 0,
      max_discount_amount: c.max_discount_amount || 0,
      max_uses: c.max_uses || 0,
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast({ title: bn ? "কোড দিন" : "Enter code", variant: "destructive" });
      return;
    }
    if (form.discount_value <= 0) {
      toast({ title: bn ? "ডিসকাউন্ট মান দিন" : "Enter discount value", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || null,
      max_discount_amount: form.max_discount_amount || null,
      max_uses: form.max_uses || null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: bn ? "ত্রুটি!" : "Error!", description: error.message, variant: "destructive" });
    } else {
      toast({ title: bn ? "সফল!" : "Success!" });
      setDialogOpen(false);
      void fetchCoupons(true);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast({ title: bn ? "ডিলিট ব্যর্থ" : "Delete failed", variant: "destructive" });
    } else {
      toast({ title: bn ? "ডিলিট হয়েছে" : "Deleted" });
      void fetchCoupons(true);
    }
  };

  const toggleActive = async (c: Coupon) => {
    const { error: actionError } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (actionError) { toast({ title: bn ? "স্ট্যাটাস বদলানো যায়নি" : "Status update failed", variant: "destructive" }); return; }
    void fetchCoupons(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: bn ? "কপি হয়েছে!" : "Copied!" });
  };

  const exportRows = () => downloadCsv("yesshost-coupons", ["code", "description", "discount_type", "discount_value", "used", "limit", "status", "expires"], filtered.map(c => [c.code, c.description || "", c.discount_type, c.discount_value, c.used_count, c.max_uses || "unlimited", stateOf(c), csvDate(c.expires_at)]));

  return (
    <div className="staff-console space-y-5">
      <StaffPageHeader title={bn ? "কুপন অপারেশনস" : "Coupon Operations"} description={bn ? "প্রচার, ব্যবহার সীমা ও মেয়াদ এক জায়গা থেকে নিয়ন্ত্রণ করুন" : "Control promotions, usage limits and expiry from one workspace"} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void fetchCoupons()} disabled={loading}><RefreshCw className="size-4" />{bn ? "রিফ্রেশ" : "Refresh"}</Button><Button variant="outline" onClick={exportRows} disabled={!filtered.length}><Download className="size-4" />CSV</Button><Button onClick={openCreate}><Plus className="size-4" />{bn ? "নতুন কুপন" : "New Coupon"}</Button></div>} />
      <StaffMetricStrip metrics={[
        { label: bn ? "মোট কুপন" : "TOTAL COUPONS", value: totalCoupons, detail: bn ? "তৈরি করা" : "created", icon: Tag },
        { label: bn ? "সক্রিয়" : "ACTIVE", value: activeCoupons, detail: bn ? "বর্তমানে ব্যবহারযোগ্য" : "currently usable", icon: CirclePercent, tone: "success" },
        { label: bn ? "মোট ব্যবহার" : "TOTAL USES", value: totalUsed, detail: bn ? "চেকআউট প্রয়োগ" : "checkout uses", icon: ShoppingCart },
        { label: bn ? "শীঘ্র মেয়াদ শেষ" : "EXPIRING SOON", value: expiringSoon, detail: bn ? "পরবর্তী ৩০ দিন" : "next 30 days", icon: Timer, tone: "warning" },
      ]} />

      <section className="staff-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row">
          <StaffSearch value={search} onChange={setSearch} placeholder={bn ? "কোড বা বিবরণ খুঁজুন" : "Search code or description"} />
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-11 w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn ? "সব স্ট্যাটাস" : "All statuses"}</SelectItem><SelectItem value="active">{bn ? "সক্রিয়" : "Active"}</SelectItem><SelectItem value="inactive">{bn ? "নিষ্ক্রিয়" : "Inactive"}</SelectItem><SelectItem value="expired">{bn ? "মেয়াদোত্তীর্ণ" : "Expired"}</SelectItem><SelectItem value="exhausted">{bn ? "সীমা পূর্ণ" : "Limit reached"}</SelectItem></SelectContent></Select>
        </div>
        {loading ? <div className="p-4"><StaffLoading rows={6} /></div> : error ? <StaffEmpty icon={Tag} title={bn ? "তথ্য লোড হয়নি" : "Data unavailable"} description={error} /> : paged.length === 0 ? <StaffEmpty icon={Tag} title={bn ? "কোনো কুপন পাওয়া যায়নি" : "No coupons found"} description={bn ? "সার্চ বা স্ট্যাটাস ফিল্টার পরিবর্তন করুন।" : "Try changing the search or status filter."} /> : <div className="divide-y divide-border">
            {paged.map(c => (
              <article key={c.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.is_active ? "bg-primary/10" : "bg-muted"}`}>
                      <Tag className={`w-5 h-5 ${c.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground font-mono">{c.code}</span>
                        <Button size="icon" variant="ghost" onClick={() => copyCode(c.code)} aria-label={bn ? "কোড কপি" : "Copy code"}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{stateOf(c)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.discount_type === "percentage" ? `${formatPrice(c.discount_value, lang)}%` : `৳${formatPrice(c.discount_value, lang)}`}
                        {c.max_discount_amount ? ` (max ৳${formatPrice(c.max_discount_amount, lang)})` : ""}
                        {c.description ? ` — ${c.description}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{c.used_count}</p>
                      <p className="text-[10px] text-muted-foreground">{c.max_uses ? `/ ${c.max_uses}` : (bn ? "ব্যবহার" : "uses")}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Button size="sm" variant={c.is_active ? "outline" : "default"} onClick={() => void toggleActive(c)}>{c.is_active ? (bn ? "বন্ধ করুন" : "Deactivate") : (bn ? "সক্রিয় করুন" : "Activate")}</Button>
                       <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label={bn ? "সম্পাদনা" : "Edit"}>
                        <Pencil className="w-4 h-4" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => void handleDelete(c.id)} aria-label={bn ? "মুছুন" : "Delete"}>
                        <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </div>

                {/* Extra info row */}
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
                  {c.min_order_amount ? <span>{bn ? "সর্বনিম্ন:" : "Min:"} ৳{formatPrice(c.min_order_amount, lang)}</span> : null}
                  {c.expires_at && (
                    <span className={new Date(c.expires_at) < new Date() ? "text-destructive" : ""}>
                      {bn ? "মেয়াদ:" : "Expires:"} {new Date(c.expires_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                  <span>{bn ? "তৈরি:" : "Created:"} {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
               </article>
            ))}
        </div>}
      </section>
      <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 25, 50]} />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? (bn ? "কুপন এডিট" : "Edit Coupon") : (bn ? "নতুন কুপন তৈরি" : "Create New Coupon")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "কুপন কোড" : "Coupon Code"}</label>
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                maxLength={30}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "বিবরণ" : "Description"}</label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder={bn ? "ঐচ্ছিক বিবরণ" : "Optional description"}
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "ডিসকাউন্ট টাইপ" : "Discount Type"}</label>
                <select
                  value={form.discount_type}
                  onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden"
                >
                  <option value="percentage">{bn ? "শতকরা (%)" : "Percentage (%)"}</option>
                  <option value="fixed">{bn ? "নির্দিষ্ট (৳)" : "Fixed (৳)"}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  {form.discount_type === "percentage" ? (bn ? "শতকরা হার" : "Percentage") : (bn ? "পরিমাণ (৳)" : "Amount (৳)")}
                </label>
                <input
                  type="number"
                  value={form.discount_value || ""}
                  onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                  min={0}
                  max={form.discount_type === "percentage" ? 100 : 999999}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "সর্বনিম্ন অর্ডার (৳)" : "Min Order (৳)"}</label>
                <input
                  type="number"
                  value={form.min_order_amount || ""}
                  onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                  min={0}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "সর্বোচ্চ ছাড় (৳)" : "Max Discount (৳)"}</label>
                <input
                  type="number"
                  value={form.max_discount_amount || ""}
                  onChange={e => setForm({ ...form, max_discount_amount: Number(e.target.value) })}
                  min={0}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "সর্বোচ্চ ব্যবহার" : "Max Uses"}</label>
                <input
                  type="number"
                  value={form.max_uses || ""}
                  onChange={e => setForm({ ...form, max_uses: Number(e.target.value) })}
                  min={0}
                  placeholder={bn ? "০ = সীমাহীন" : "0 = unlimited"}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{bn ? "মেয়াদ শেষ" : "Expires At"}</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="rounded-sm"
                id="coupon-active"
              />
              <label htmlFor="coupon-active" className="text-sm text-foreground">{bn ? "সক্রিয়" : "Active"}</label>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (bn ? "সেভ হচ্ছে…" : "Saving…") : (editingId ? (bn ? "আপডেট করুন" : "Update") : (bn ? "তৈরি করুন" : "Create"))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
