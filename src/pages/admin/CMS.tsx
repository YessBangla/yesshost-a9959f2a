import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, FileText, MessageSquare, HelpCircle, Layout, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

type Tab = "content" | "plans" | "testimonials" | "faqs";

const AdminCMS = () => {
  const { tr } = useLanguage();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("content");
  const [loading, setLoading] = useState(true);

  // Data states
  const [contents, setContents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<any>({});

  const fetchAll = async () => {
    setLoading(true);
    const [c, p, t, f] = await Promise.all([
      supabase.from("site_content").select("*").order("page").order("sort_order"),
      supabase.from("pricing_plans").select("*").order("category").order("sort_order"),
      supabase.from("testimonials").select("*").order("sort_order"),
      supabase.from("faqs").select("*").order("sort_order"),
    ]);
    setContents(c.data || []);
    setPlans(p.data || []);
    setTestimonials(t.data || []);
    setFaqs(f.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const startEdit = (item: any) => { setEditingId(item.id); setEditForm({ ...item }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (table: string) => {
    const { id, created_at, ...rest } = editForm;
    if (table === "pricing_plans" && typeof rest.features === "string") {
      try { rest.features = JSON.parse(rest.features); } catch { /* keep as is */ }
    }
    await supabase.from(table).update(rest).eq("id", id);
    toast({ title: "সফলভাবে আপডেট হয়েছে" });
    cancelEdit();
    fetchAll();
  };

  const deleteItem = async (table: string, id: string) => {
    await supabase.from(table).delete().eq("id", id);
    toast({ title: "সফলভাবে মুছে ফেলা হয়েছে" });
    fetchAll();
  };

  const addItem = async (table: string) => {
    const form = { ...addForm };
    if (table === "pricing_plans" && typeof form.features === "string") {
      try { form.features = JSON.parse(form.features); } catch { form.features = []; }
    }
    await supabase.from(table).insert(form);
    toast({ title: "সফলভাবে যোগ করা হয়েছে" });
    setShowAdd(false);
    setAddForm({});
    fetchAll();
  };

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "content", label: "সাইট কন্টেন্ট", icon: Layout },
    { key: "plans", label: "প্রাইসিং প্ল্যান", icon: FileText },
    { key: "testimonials", label: "টেস্টিমোনিয়াল", icon: MessageSquare },
    { key: "faqs", label: "FAQ", icon: HelpCircle },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const InputField = ({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      ) : (
        <input value={value || ""} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      )}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{contents.length} টি কন্টেন্ট</p>
        <button onClick={() => { setShowAdd(true); setAddForm({ page: "home", section_key: "", title_bn: "", title_en: "", content_bn: "", content_en: "", is_active: true, sort_order: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> যোগ করুন
        </button>
      </div>
      {contents.map(item => (
        <div key={item.id} className="glass-card p-4">
          {editingId === item.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Page" value={editForm.page} onChange={v => setEditForm({ ...editForm, page: v })} />
                <InputField label="Section Key" value={editForm.section_key} onChange={v => setEditForm({ ...editForm, section_key: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Title (BN)" value={editForm.title_bn} onChange={v => setEditForm({ ...editForm, title_bn: v })} />
                <InputField label="Title (EN)" value={editForm.title_en} onChange={v => setEditForm({ ...editForm, title_en: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Content (BN)" value={editForm.content_bn} onChange={v => setEditForm({ ...editForm, content_bn: v })} multiline />
                <InputField label="Content (EN)" value={editForm.content_en} onChange={v => setEditForm({ ...editForm, content_en: v })} multiline />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit("site_content")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"><Save className="w-3 h-3" /> সেভ</button>
                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"><X className="w-3 h-3" /> বাতিল</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{item.page}</span>
                  <span className="text-xs text-muted-foreground">{item.section_key}</span>
                  {!item.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">নিষ্ক্রিয়</span>}
                </div>
                <p className="text-sm font-medium text-foreground">{item.title_bn || item.title_en}</p>
                <p className="text-xs text-muted-foreground truncate">{item.content_bn || item.content_en}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteItem("site_content", item.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPlans = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{plans.length} টি প্ল্যান</p>
        <button onClick={() => { setShowAdd(true); setAddForm({ category: "web", slug: "", name: "", price_bdt: "", annual_price_bdt: "", subtitle: "", features: "[]", is_highlighted: false, is_active: true, sort_order: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> প্ল্যান যোগ করুন
        </button>
      </div>
      {plans.map(plan => (
        <div key={plan.id} className="glass-card p-4">
          {editingId === plan.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Category" value={editForm.category} onChange={v => setEditForm({ ...editForm, category: v })} />
                <InputField label="Slug" value={editForm.slug} onChange={v => setEditForm({ ...editForm, slug: v })} />
                <InputField label="Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Price (BDT)" value={editForm.price_bdt} onChange={v => setEditForm({ ...editForm, price_bdt: v })} />
                <InputField label="Annual Price" value={editForm.annual_price_bdt} onChange={v => setEditForm({ ...editForm, annual_price_bdt: v })} />
                <InputField label="Subtitle" value={editForm.subtitle} onChange={v => setEditForm({ ...editForm, subtitle: v })} />
              </div>
              <InputField label="Features (JSON array)" value={typeof editForm.features === "string" ? editForm.features : JSON.stringify(editForm.features)} onChange={v => setEditForm({ ...editForm, features: v })} multiline />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.is_highlighted} onChange={e => setEditForm({ ...editForm, is_highlighted: e.target.checked })} /> হাইলাইটেড
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} /> সক্রিয়
                </label>
                <InputField label="Sort Order" value={String(editForm.sort_order || 0)} onChange={v => setEditForm({ ...editForm, sort_order: parseInt(v) || 0 })} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit("pricing_plans")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"><Save className="w-3 h-3" /> সেভ</button>
                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"><X className="w-3 h-3" /> বাতিল</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{plan.category}</span>
                  <span className="text-sm font-bold text-foreground">{plan.name}</span>
                  {plan.is_highlighted && <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">⭐ Popular</span>}
                  {!plan.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">নিষ্ক্রিয়</span>}
                </div>
                <p className="text-sm text-muted-foreground">৳{plan.price_bdt}/মাস {plan.annual_price_bdt ? `• ৳${plan.annual_price_bdt}/বছর` : ""}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(plan)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteItem("pricing_plans", plan.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTestimonials = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{testimonials.length} টি টেস্টিমোনিয়াল</p>
        <button onClick={() => { setShowAdd(true); setAddForm({ name: "", company: "", rating: 5, content_bn: "", content_en: "", is_active: true, sort_order: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> যোগ করুন
        </button>
      </div>
      {testimonials.map(t => (
        <div key={t.id} className="glass-card p-4">
          {editingId === t.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
                <InputField label="Company" value={editForm.company} onChange={v => setEditForm({ ...editForm, company: v })} />
                <InputField label="Rating (1-5)" value={String(editForm.rating)} onChange={v => setEditForm({ ...editForm, rating: parseInt(v) || 5 })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Content (BN)" value={editForm.content_bn} onChange={v => setEditForm({ ...editForm, content_bn: v })} multiline />
                <InputField label="Content (EN)" value={editForm.content_en} onChange={v => setEditForm({ ...editForm, content_en: v })} multiline />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit("testimonials")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"><Save className="w-3 h-3" /> সেভ</button>
                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"><X className="w-3 h-3" /> বাতিল</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{t.name} <span className="font-normal text-muted-foreground">— {t.company}</span></p>
                <p className="text-xs text-muted-foreground truncate">{t.content_bn}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(t)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteItem("testimonials", t.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderFaqs = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{faqs.length} টি FAQ</p>
        <button onClick={() => { setShowAdd(true); setAddForm({ question_bn: "", question_en: "", answer_bn: "", answer_en: "", category: "general", is_active: true, sort_order: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> যোগ করুন
        </button>
      </div>
      {faqs.map(faq => (
        <div key={faq.id} className="glass-card p-4">
          {editingId === faq.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Question (BN)" value={editForm.question_bn} onChange={v => setEditForm({ ...editForm, question_bn: v })} />
                <InputField label="Question (EN)" value={editForm.question_en} onChange={v => setEditForm({ ...editForm, question_en: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Answer (BN)" value={editForm.answer_bn} onChange={v => setEditForm({ ...editForm, answer_bn: v })} multiline />
                <InputField label="Answer (EN)" value={editForm.answer_en} onChange={v => setEditForm({ ...editForm, answer_en: v })} multiline />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit("faqs")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"><Save className="w-3 h-3" /> সেভ</button>
                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"><X className="w-3 h-3" /> বাতিল</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{faq.question_bn}</p>
                <p className="text-xs text-muted-foreground truncate">{faq.answer_bn}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(faq)} className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteItem("faqs", faq.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const tableForTab = { content: "site_content", plans: "pricing_plans", testimonials: "testimonials", faqs: "faqs" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Layout className="w-6 h-6" /> সাইট কন্টেন্ট ম্যানেজমেন্ট
        </h1>
        <p className="text-sm text-muted-foreground">সাইটের সকল ডায়নামিক কন্টেন্ট এখান থেকে পরিচালনা করুন</p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 rounded-xl glass-card w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowAdd(false); cancelEdit(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "gradient-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="glass-card p-5 border-2 border-primary/20">
          <h3 className="text-sm font-bold text-foreground mb-3">নতুন আইটেম যোগ করুন</h3>
          <div className="space-y-3">
            {Object.entries(addForm).filter(([k]) => k !== "is_active" && k !== "is_highlighted").map(([key, val]) => (
              <InputField key={key} label={key} value={String(val || "")}
                onChange={v => setAddForm({ ...addForm, [key]: key === "sort_order" || key === "rating" ? parseInt(v) || 0 : v })}
                multiline={key.includes("content") || key.includes("answer") || key === "features"} />
            ))}
            <div className="flex gap-2">
              <button onClick={() => addItem(tableForTab[tab])} className="flex items-center gap-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold"><Save className="w-4 h-4" /> সেভ করুন</button>
              <button onClick={() => { setShowAdd(false); setAddForm({}); }} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-semibold"><X className="w-4 h-4" /> বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {tab === "content" && renderContent()}
      {tab === "plans" && renderPlans()}
      {tab === "testimonials" && renderTestimonials()}
      {tab === "faqs" && renderFaqs()}
    </div>
  );
};

export default AdminCMS;
