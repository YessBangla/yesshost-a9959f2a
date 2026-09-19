import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarRange, Download, Plus, Receipt, RefreshCcw, SearchX, Trash2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader, StaffSearch } from "@/components/staff/StaffConsole";
import { downloadCsv } from "@/lib/export-csv";

type Expense = { id: string; title: string; category: string; amount_bdt: number; expense_date: string; vendor: string | null; note: string | null; created_at: string };

const categories = [
  { value: "server", bn: "সার্ভার ও ডেটাসেন্টার", en: "Servers & datacenter", code: "5000" },
  { value: "salary", bn: "বেতন", en: "Salaries", code: "5100" },
  { value: "marketing", bn: "মার্কেটিং", en: "Marketing", code: "5200" },
  { value: "software", bn: "সফটওয়্যার ও লাইসেন্স", en: "Software & licences", code: "5300" },
  { value: "office", bn: "অফিস", en: "Office", code: "5400" },
  { value: "other", bn: "অন্যান্য", en: "Other", code: "5900" },
];

const templates = [
  { bn: "অফিস ভাড়া", en: "Office rent", category: "office" },
  { bn: "বিদ্যুৎ বিল", en: "Electricity bill", category: "office" },
  { bn: "ইন্টারনেট বিল", en: "Internet bill", category: "office" },
  { bn: "মাসিক বেতন", en: "Monthly salary", category: "salary" },
  { bn: "সার্ভার ভাড়া", en: "Server rental", category: "server" },
  { bn: "বিজ্ঞাপন খরচ", en: "Advertising spend", category: "marketing" },
];

const emptyForm = { title: "", category: "office", amount: "", date: new Date().toISOString().slice(0, 10), vendor: "", note: "" };

const AdminExpenses = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const money = useCallback((value: number) => `৳${Math.round(value || 0).toLocaleString(bn ? "bn-BD" : "en-US")}`, [bn]);
  const catLabel = useCallback((value: string) => {
    const item = categories.find((entry) => entry.value === value);
    return item ? (bn ? item.bn : item.en) : value;
  }, [bn]);
  const catCode = (value: string) => categories.find((entry) => entry.value === value)?.code || "5900";

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("operating_expenses")
      .select("id,title,category,amount_bdt,expense_date,vendor,note,created_at")
      .order("expense_date", { ascending: false })
      .limit(1000);
    setExpenses((data || []) as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, category, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((item) => {
      const matchesText = !q || [item.title, item.vendor, item.note, catLabel(item.category), String(item.amount_bdt)].join(" ").toLowerCase().includes(q);
      return matchesText && (category === "all" || item.category === category);
    });
  }, [expenses, search, category, catLabel]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const metrics = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const yearKey = new Date().toISOString().slice(0, 4);
    const monthTotal = expenses.filter((item) => item.expense_date.startsWith(monthKey)).reduce((sum, item) => sum + Number(item.amount_bdt), 0);
    const yearTotal = expenses.filter((item) => item.expense_date.startsWith(yearKey)).reduce((sum, item) => sum + Number(item.amount_bdt), 0);
    const byCategory = new Map<string, number>();
    for (const item of expenses) byCategory.set(item.category, (byCategory.get(item.category) || 0) + Number(item.amount_bdt));
    const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    return [
      { label: bn ? "এ মাসের খরচ" : "THIS MONTH", value: money(monthTotal), detail: bn ? "চলতি মাস" : "current month", icon: CalendarRange, tone: "warning" as const },
      { label: bn ? "এ বছরের খরচ" : "THIS YEAR", value: money(yearTotal), detail: bn ? "চলতি বছর" : "current year", icon: Wallet },
      { label: bn ? "মোট এন্ট্রি" : "ENTRIES", value: String(expenses.length), detail: bn ? "খরচের রেকর্ড" : "expense records", icon: Receipt },
      { label: bn ? "সর্বোচ্চ খাত" : "TOP CATEGORY", value: top ? catLabel(top[0]) : "—", detail: top ? money(top[1]) : "—", icon: BookOpen },
    ];
  }, [expenses, bn, money, catLabel]);

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({ title: bn ? "তথ্য অসম্পূর্ণ" : "Missing details", description: bn ? "খরচের শিরোনাম ও সঠিক পরিমাণ দিন।" : "Enter a title and a valid amount.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("operating_expenses").insert({
      title: form.title.trim(),
      category: form.category,
      amount_bdt: amount,
      expense_date: form.date,
      vendor: form.vendor.trim() || null,
      note: form.note.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: bn ? "সংরক্ষণ হয়নি" : "Not saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: bn ? "খরচ যোগ হয়েছে" : "Expense recorded",
      description: bn ? `হিসাব খাতায় ${catCode(form.category)} খাতে স্বয়ংক্রিয়ভাবে বসে গেছে।` : `Automatically posted to ledger account ${catCode(form.category)}.`,
    });
    setForm({ ...emptyForm, category: form.category, date: form.date });
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("operating_expenses").delete().eq("id", id);
    if (error) {
      toast({ title: bn ? "মুছতে সমস্যা" : "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    toast({ title: bn ? "খরচ মুছে ফেলা হয়েছে" : "Expense removed", description: bn ? "হিসাব খাতা থেকেও এন্ট্রিটি সরে গেছে।" : "The ledger entry was reversed too." });
  };

  return (
    <div className="staff-console space-y-5">
      <StaffPageHeader
        title={bn ? "অফিস খরচ এন্ট্রি" : "Office Expense Entry"}
        description={bn ? "প্রতিটি খরচ সংরক্ষণের সাথে সাথেই সেন্ট্রাল একাউন্টসের হিসাব খাতায় স্বয়ংক্রিয়ভাবে বসে যাবে।" : "Every expense you save posts automatically into the Central Accounts ledger."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCcw className="size-4" />{bn ? "রিফ্রেশ" : "Refresh"}</Button>
            <Button onClick={() => downloadCsv("office-expenses", ["Date", "Title", "Category", "Ledger", "Vendor", "Amount", "Note"], filtered.map((item) => [item.expense_date, item.title, catLabel(item.category), catCode(item.category), item.vendor || "", item.amount_bdt, item.note || ""]))} disabled={!filtered.length}><Download className="size-4" />CSV</Button>
          </div>
        }
      />

      <StaffMetricStrip metrics={metrics} />

      <section className="staff-panel p-4">
        <h2 className="font-display font-semibold text-foreground">{bn ? "নতুন খরচ যোগ করুন" : "Record a new expense"}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{bn ? `নির্বাচিত খাত অনুযায়ী হিসাব কোড: ${catCode(form.category)} — ${catLabel(form.category)}` : `Ledger account for selected category: ${catCode(form.category)} — ${catLabel(form.category)}`}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {templates.map((item) => (
            <Button key={item.en} type="button" size="sm" variant="outline" onClick={() => setForm((prev) => ({ ...prev, title: bn ? item.bn : item.en, category: item.category }))}>
              {bn ? item.bn : item.en}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_160px_minmax(0,1fr)]">
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={bn ? "খরচের শিরোনাম" : "Expense title"} className="h-11" />
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((item) => <SelectItem key={item.value} value={item.value}>{`${bn ? item.bn : item.en} (${item.code})`}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} inputMode="decimal" placeholder={bn ? "টাকা" : "Amount"} className="h-11" />
          <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="h-11" />
          <Input value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} placeholder={bn ? "সরবরাহকারী (ঐচ্ছিক)" : "Vendor (optional)"} className="h-11" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder={bn ? "নোট (ঐচ্ছিক)" : "Note (optional)"} rows={2} />
          <Button className="h-11 self-end" onClick={() => void save()} disabled={saving}><Plus className="size-4" />{bn ? "খরচ সংরক্ষণ" : "Save expense"}</Button>
        </div>
      </section>

      <section className="staff-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1"><StaffSearch value={search} onChange={setSearch} placeholder={bn ? "শিরোনাম, সরবরাহকারী বা পরিমাণ খুঁজুন" : "Search title, vendor or amount"} /></div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 min-w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{bn ? "সব খাত" : "All categories"}</SelectItem>
              {categories.map((item) => <SelectItem key={item.value} value={item.value}>{bn ? item.bn : item.en}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {loading ? <div className="p-4"><StaffLoading rows={6} /></div> : !paged.length ? (
          <StaffEmpty icon={SearchX} title={bn ? "কোনো খরচ পাওয়া যায়নি" : "No expenses found"} description={bn ? "উপরের ফর্ম দিয়ে খরচ যোগ করুন বা ফিল্টার বদলান।" : "Add an expense above or change the filters."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">{bn ? "তারিখ" : "Date"}</th>
                  <th className="p-3">{bn ? "শিরোনাম" : "Title"}</th>
                  <th className="p-3">{bn ? "খাত" : "Category"}</th>
                  <th className="p-3">{bn ? "হিসাব কোড" : "Ledger"}</th>
                  <th className="p-3">{bn ? "সরবরাহকারী" : "Vendor"}</th>
                  <th className="p-3 text-right">{bn ? "পরিমাণ" : "Amount"}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{new Date(item.expense_date).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="p-3 font-medium">{item.title}{item.note ? <span className="block text-xs text-muted-foreground">{item.note}</span> : null}</td>
                    <td className="p-3">{catLabel(item.category)}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">{catCode(item.category)}</td>
                    <td className="p-3 text-muted-foreground">{item.vendor || "—"}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">{money(Number(item.amount_bdt))}</td>
                    <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => void remove(item.id)} aria-label={bn ? "মুছুন" : "Delete"}><Trash2 className="size-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border p-3"><DataPagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} /></div>
      </section>
    </div>
  );
};

export default AdminExpenses;
