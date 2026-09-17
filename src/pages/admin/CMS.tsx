import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CMSSkeleton } from "@/components/DashboardSkeleton";
import {
  Plus, Pencil, Trash2, Save, X, FileText, MessageSquare,
  HelpCircle, Layout, Eye, EyeOff, GripVertical, Search, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/formatPrice";

type Tab = "content" | "plans" | "testimonials" | "faqs" | "domains";

const AdminCMS = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("content");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [contents, setContents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [domainPrices, setDomainPrices] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<any>({});

  const fetchAll = async () => {
    setLoading(true);
    const [c, p, t, f, d] = await Promise.all([
      supabase.from("site_content").select("*").order("page").order("sort_order"),
      supabase.from("pricing_plans").select("*").order("category").order("sort_order"),
      supabase.from("testimonials").select("*").order("sort_order"),
      supabase.from("faqs").select("*").order("sort_order"),
      (supabase.from("domain_pricing" as any) as any).select("*").order("sort_order"),
    ]);
    setContents(c.data || []);
    setPlans(p.data || []);
    setTestimonials(t.data || []);
    setFaqs(f.data || []);
    setDomainPrices(d.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const startEdit = (item: any) => { setEditingId(item.id); setEditForm({ ...item }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (table: string) => {
    const { id, created_at, ...rest } = editForm;
    if (table === "pricing_plans" && typeof rest.features === "string") {
      try { rest.features = JSON.parse(rest.features); } catch { /* keep */ }
    }
    if (table === "site_content" && typeof rest.metadata === "string") {
      try { rest.metadata = JSON.parse(rest.metadata); } catch { /* keep */ }
    }
    await (supabase.from(table as any) as any).update(rest).eq("id", id);
    toast({ title: isBn ? "সফলভাবে আপডেট হয়েছে" : "Updated successfully" });
    cancelEdit();
    fetchAll();
  };

  const deleteItem = async (table: string, id: string) => {
    await (supabase.from(table as any) as any).delete().eq("id", id);
    toast({ title: isBn ? "সফলভাবে মুছে ফেলা হয়েছে" : "Deleted successfully" });
    fetchAll();
  };

  const addItem = async (table: string) => {
    const form = { ...addForm };
    if (table === "pricing_plans" && typeof form.features === "string") {
      try { form.features = JSON.parse(form.features); } catch { form.features = []; }
    }
    await (supabase.from(table as any) as any).insert(form);
    toast({ title: isBn ? "সফলভাবে যোগ করা হয়েছে" : "Added successfully" });
    setShowAdd(false);
    setAddForm({});
    fetchAll();
  };

  const tabs: { key: Tab; label: string; labelEn: string; icon: typeof FileText; count: number }[] = [
    { key: "content", label: "সাইট কন্টেন্ট", labelEn: "Site Content", icon: Layout, count: contents.length },
    { key: "plans", label: "প্রাইসিং", labelEn: "Pricing", icon: FileText, count: plans.length },
    { key: "domains", label: "ডোমেইন মূল্য", labelEn: "Domain Pricing", icon: Globe, count: domainPrices.length },
    { key: "testimonials", label: "টেস্টিমোনিয়াল", labelEn: "Testimonials", icon: MessageSquare, count: testimonials.length },
    { key: "faqs", label: "FAQ", labelEn: "FAQs", icon: HelpCircle, count: faqs.length },
  ];

  const tableForTab: Record<Tab, string> = { content: "site_content", plans: "pricing_plans", testimonials: "testimonials", faqs: "faqs", domains: "domain_pricing" };

  const InputField = ({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) => (
    <div>
      <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 resize-none transition-all" />
      ) : (
        <input value={value || ""} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all" />
      )}
    </div>
  );

  if (loading) return <CMSSkeleton />;

  const getAddDefaults = (): any => {
    switch (tab) {
      case "content": return { page: "home", section_key: "", title_bn: "", title_en: "", content_bn: "", content_en: "", is_active: true, sort_order: 0 };
      case "plans": return { category: "web", slug: "", name: "", price_bdt: "", annual_price_bdt: "", subtitle: "", features: "[]", is_highlighted: false, is_active: true, sort_order: 0 };
      case "domains": return { ext: "", registration_bdt: "", renewal_bdt: "", transfer_bdt: "", is_popular: false, is_active: true, sort_order: 0 };
      case "testimonials": return { name: "", company: "", rating: 5, content_bn: "", content_en: "", is_active: true, sort_order: 0 };
      case "faqs": return { question_bn: "", question_en: "", answer_bn: "", answer_en: "", category: "general", is_active: true, sort_order: 0 };
    }
  };

  const renderContent = () => {
    const filteredContents = contents.filter(c =>
      !search || (c.title_bn || "").includes(search) || (c.title_en || "").toLowerCase().includes(search.toLowerCase()) || c.page.includes(search)
    );
    return (
      <div className="space-y-3">
        {filteredContents.map(item => (
          <motion.div key={item.id} layout className="glass-card rounded-xl overflow-hidden">
            {editingId === item.id ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Page" value={editForm.page} onChange={v => setEditForm({ ...editForm, page: v })} />
                  <InputField label="Section Key" value={editForm.section_key} onChange={v => setEditForm({ ...editForm, section_key: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={isBn ? "শিরোনাম (বাংলা)" : "Title (BN)"} value={editForm.title_bn} onChange={v => setEditForm({ ...editForm, title_bn: v })} />
                  <InputField label={isBn ? "শিরোনাম (English)" : "Title (EN)"} value={editForm.title_en} onChange={v => setEditForm({ ...editForm, title_en: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={isBn ? "কন্টেন্ট (বাংলা)" : "Content (BN)"} value={editForm.content_bn} onChange={v => setEditForm({ ...editForm, content_bn: v })} multiline />
                  <InputField label={isBn ? "কন্টেন্ট (English)" : "Content (EN)"} value={editForm.content_en} onChange={v => setEditForm({ ...editForm, content_en: v })} multiline />
                </div>
                <InputField
                  label={isBn ? "মেটাডাটা (JSON)" : "Metadata (JSON)"}
                  value={typeof editForm.metadata === "string" ? editForm.metadata : JSON.stringify(editForm.metadata || {}, null, 2)}
                  onChange={v => setEditForm({ ...editForm, metadata: v })}
                  multiline
                />
                <div className="flex gap-2 pt-1">
                  <button onClick={() => saveEdit("site_content")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"><Save className="w-3.5 h-3.5" /> {isBn ? "সেভ" : "Save"}</button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"><X className="w-3.5 h-3.5" /> {isBn ? "বাতিল" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-[10px] font-mono">{item.page}</Badge>
                    {!item.is_active && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title_bn || item.title_en || item.section_key}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.section_key} • {(item.content_bn || item.content_en || "").slice(0, 60)}...</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(item)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteItem("site_content", item.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPlans = () => {
    const filteredPlans = plans.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlans.map(plan => (
          <motion.div key={plan.id} layout className="glass-card rounded-xl overflow-hidden">
            {editingId === plan.id ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <InputField label="Category" value={editForm.category} onChange={v => setEditForm({ ...editForm, category: v })} />
                  <InputField label="Slug" value={editForm.slug} onChange={v => setEditForm({ ...editForm, slug: v })} />
                  <InputField label="Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InputField label={isBn ? "মাসিক মূল্য" : "Monthly Price"} value={editForm.price_bdt} onChange={v => setEditForm({ ...editForm, price_bdt: v })} />
                  <InputField label={isBn ? "বার্ষিক মূল্য" : "Annual Price"} value={editForm.annual_price_bdt} onChange={v => setEditForm({ ...editForm, annual_price_bdt: v })} />
                  <InputField label="Subtitle" value={editForm.subtitle} onChange={v => setEditForm({ ...editForm, subtitle: v })} />
                </div>
                <InputField label="Features (JSON)" value={typeof editForm.features === "string" ? editForm.features : JSON.stringify(editForm.features)} onChange={v => setEditForm({ ...editForm, features: v })} multiline />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editForm.is_highlighted} onChange={e => setEditForm({ ...editForm, is_highlighted: e.target.checked })} className="rounded-sm" /> {isBn ? "হাইলাইটেড" : "Highlighted"}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} className="rounded-sm" /> {isBn ? "সক্রিয়" : "Active"}
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit("pricing_plans")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Save className="w-3.5 h-3.5" /> {isBn ? "সেভ" : "Save"}</button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold"><X className="w-3.5 h-3.5" /> {isBn ? "বাতিল" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono">{plan.category}</Badge>
                      {plan.is_highlighted && <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">⭐ Popular</Badge>}
                      {!plan.is_active && <Badge variant="destructive" className="text-[10px]">{isBn ? "নিষ্ক্রিয়" : "Inactive"}</Badge>}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    {plan.subtitle && <p className="text-xs text-muted-foreground">{plan.subtitle}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(plan)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteItem("pricing_plans", plan.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-primary">৳{formatPrice(plan.price_bdt, lang)}</span>
                  <span className="text-xs text-muted-foreground">/{isBn ? "মাস" : "mo"}</span>
                  {plan.annual_price_bdt && <span className="text-xs text-muted-foreground ml-2">• ৳{formatPrice(plan.annual_price_bdt, lang)}/{isBn ? "বছর" : "yr"}</span>}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTestimonials = () => {
    const filteredTest = testimonials.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTest.map(t => (
          <motion.div key={t.id} layout className="glass-card rounded-xl overflow-hidden">
            {editingId === t.id ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <InputField label={isBn ? "নাম" : "Name"} value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
                  <InputField label={isBn ? "কোম্পানি" : "Company"} value={editForm.company} onChange={v => setEditForm({ ...editForm, company: v })} />
                  <InputField label="Rating (1-5)" value={String(editForm.rating)} onChange={v => setEditForm({ ...editForm, rating: parseInt(v) || 5 })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={isBn ? "কন্টেন্ট (বাংলা)" : "Content (BN)"} value={editForm.content_bn} onChange={v => setEditForm({ ...editForm, content_bn: v })} multiline />
                  <InputField label={isBn ? "কন্টেন্ট (English)" : "Content (EN)"} value={editForm.content_en} onChange={v => setEditForm({ ...editForm, content_en: v })} multiline />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit("testimonials")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Save className="w-3.5 h-3.5" /> {isBn ? "সেভ" : "Save"}</button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold"><X className="w-3.5 h-3.5" /> {isBn ? "বাতিল" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="p-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">{t.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.company || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(t)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteItem("testimonials", t.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.content_bn || t.content_en}</p>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < (t.rating || 5) ? "text-warning" : "text-muted"}`}>★</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderFaqs = () => {
    const filteredFaqs = faqs.filter(f => !search || (f.question_bn || "").includes(search) || (f.question_en || "").toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => (
          <motion.div key={faq.id} layout className="glass-card rounded-xl overflow-hidden">
            {editingId === faq.id ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={isBn ? "প্রশ্ন (বাংলা)" : "Question (BN)"} value={editForm.question_bn} onChange={v => setEditForm({ ...editForm, question_bn: v })} />
                  <InputField label={isBn ? "প্রশ্ন (English)" : "Question (EN)"} value={editForm.question_en} onChange={v => setEditForm({ ...editForm, question_en: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={isBn ? "উত্তর (বাংলা)" : "Answer (BN)"} value={editForm.answer_bn} onChange={v => setEditForm({ ...editForm, answer_bn: v })} multiline />
                  <InputField label={isBn ? "উত্তর (English)" : "Answer (EN)"} value={editForm.answer_en} onChange={v => setEditForm({ ...editForm, answer_en: v })} multiline />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit("faqs")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Save className="w-3.5 h-3.5" /> {isBn ? "সেভ" : "Save"}</button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold"><X className="w-3.5 h-3.5" /> {isBn ? "বাতিল" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg font-bold text-muted-foreground/30 tabular-nums w-8 text-center shrink-0">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{faq.question_bn || faq.question_en}</p>
                    <p className="text-xs text-muted-foreground truncate">{faq.answer_bn || faq.answer_en}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{faq.category || "general"}</Badge>
                  <button onClick={() => startEdit(faq)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteItem("faqs", faq.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderDomains = () => {
    const filtered = domainPrices.filter(d =>
      !search || d.ext.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="space-y-2">
        {filtered.map((dp: any, index: number) => (
          <motion.div key={dp.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
            className="glass-card rounded-xl border border-border/30 overflow-hidden">
            {editingId === dp.id ? (
              <div className="p-4 space-y-3 bg-secondary/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InputField label="Extension" value={editForm.ext} onChange={v => setEditForm({ ...editForm, ext: v })} />
                  <InputField label={isBn ? "রেজিস্ট্রেশন (BDT)" : "Registration (BDT)"} value={editForm.registration_bdt} onChange={v => setEditForm({ ...editForm, registration_bdt: v })} />
                  <InputField label={isBn ? "রিনিউয়াল (BDT)" : "Renewal (BDT)"} value={editForm.renewal_bdt} onChange={v => setEditForm({ ...editForm, renewal_bdt: v })} />
                  <InputField label={isBn ? "ট্রান্সফার (BDT)" : "Transfer (BDT)"} value={editForm.transfer_bdt} onChange={v => setEditForm({ ...editForm, transfer_bdt: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Sort Order" value={String(editForm.sort_order || 0)} onChange={v => setEditForm({ ...editForm, sort_order: parseInt(v) || 0 })} />
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editForm.is_popular || false} onChange={e => setEditForm({ ...editForm, is_popular: e.target.checked })} className="rounded-sm" />
                      {isBn ? "জনপ্রিয়" : "Popular"}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editForm.is_active !== false} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} className="rounded-sm" />
                      {isBn ? "সক্রিয়" : "Active"}
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit("domain_pricing")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"><Save className="w-3.5 h-3.5" /> {isBn ? "সেভ" : "Save"}</button>
                  <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"><X className="w-3.5 h-3.5" /> {isBn ? "বাতিল" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="text-sm font-bold text-foreground w-12">{dp.ext}</span>
                  {dp.is_popular && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{isBn ? "জনপ্রিয়" : "Popular"}</Badge>}
                   <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>৳{formatPrice(dp.registration_bdt, lang)}</span>
                    <span>৳{formatPrice(dp.renewal_bdt, lang)}</span>
                    <span>৳{formatPrice(dp.transfer_bdt, lang)}</span>
                  </div>
                  {!dp.is_active && <Badge variant="outline" className="text-[10px] text-destructive">{isBn ? "নিষ্ক্রিয়" : "Inactive"}</Badge>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(dp)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteItem("domain_pricing", dp.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isBn ? "কন্টেন্ট ম্যানেজমেন্ট" : "Content Management"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isBn ? "সাইটের সকল ডায়নামিক কন্টেন্ট পরিচালনা করুন" : "Manage all dynamic site content"}</p>
      </div>

      {/* Tabs + Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-border/50">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowAdd(false); cancelEdit(); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBn ? t.label : t.labelEn}</span>
              <span className="text-[10px] opacity-60">({t.count})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isBn ? "সার্চ..." : "Search..."}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddForm(getAddDefaults()); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> {isBn ? "যোগ করুন" : "Add New"}
          </button>
        </div>
      </div>

      {/* Add Form Dialog */}
      <Dialog open={showAdd} onOpenChange={open => { if (!open) { setShowAdd(false); setAddForm({}); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isBn ? "নতুন আইটেম যোগ করুন" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {Object.entries(addForm).filter(([k]) => k !== "is_active" && k !== "is_highlighted").map(([key, val]) => (
              <InputField
                key={key}
                label={key.replace(/_/g, " ")}
                value={String(val || "")}
                onChange={v => setAddForm({ ...addForm, [key]: key === "sort_order" || key === "rating" ? parseInt(v) || 0 : v })}
                multiline={key.includes("content") || key.includes("answer") || key === "features"}
              />
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => addItem(tableForTab[tab])} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><Save className="w-4 h-4" /> {isBn ? "সেভ করুন" : "Save"}</button>
              <button onClick={() => { setShowAdd(false); setAddForm({}); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold"><X className="w-4 h-4" /> {isBn ? "বাতিল" : "Cancel"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tab Content */}
      {tab === "content" && renderContent()}
      {tab === "plans" && renderPlans()}
      {tab === "domains" && renderDomains()}
      {tab === "testimonials" && renderTestimonials()}
      {tab === "faqs" && renderFaqs()}
    </div>
  );
};

export default AdminCMS;
