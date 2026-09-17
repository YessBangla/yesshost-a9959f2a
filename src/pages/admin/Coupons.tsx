import { useState, useEffect } from "react";
import { Tag, Plus, Pencil, Trash2, Loader2, Search, ToggleLeft, ToggleRight, Copy, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

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

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data as any as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.is_active).length;
  const totalUsed = coupons.reduce((s, c) => s + c.used_count, 0);

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
      fetchCoupons();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast({ title: bn ? "ডিলিট ব্যর্থ" : "Delete failed", variant: "destructive" });
    } else {
      toast({ title: bn ? "ডিলিট হয়েছে" : "Deleted" });
      fetchCoupons();
    }
  };

  const toggleActive = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    fetchCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: bn ? "কপি হয়েছে!" : "Copied!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            {bn ? "কুপন ম্যানেজমেন্ট" : "Coupon Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{bn ? "প্রোমো কোড তৈরি ও ম্যানেজ করুন" : "Create and manage promo codes"}</p>
        </div>
        <button onClick={openCreate} className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> {bn ? "নতুন কুপন" : "New Coupon"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: bn ? "মোট কুপন" : "Total Coupons", value: totalCoupons, color: "text-primary" },
          { label: bn ? "সক্রিয়" : "Active", value: activeCoupons, color: "text-green-500" },
          { label: bn ? "মোট ব্যবহার" : "Total Uses", value: totalUsed, color: "text-orange-500" },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4 text-center">
            <BarChart3 className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={bn ? "কুপন খুঁজুন..." : "Search coupons..."}
          maxLength={50}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-xl">
          <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{bn ? "কোনো কুপন পাওয়া যায়নি" : "No coupons found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.is_active ? "bg-primary/10" : "bg-muted"}`}>
                      <Tag className={`w-5 h-5 ${c.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground font-mono">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {!c.is_active && (
                          <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm font-medium">
                            {bn ? "নিষ্ক্রিয়" : "Inactive"}
                          </span>
                        )}
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
                      <button onClick={() => toggleActive(c)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title={c.is_active ? "Deactivate" : "Activate"}>
                        {c.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? (bn ? "আপডেট করুন" : "Update") : (bn ? "তৈরি করুন" : "Create"))}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
