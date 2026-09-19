import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { AlertTriangle, BellRing, CreditCard, Globe, Headphones, Loader2, Plus, Search, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatAmount } from "@/lib/formatPrice";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Service = Tables<"services">;
type Invoice = Tables<"invoices">;
type Ticket = Tables<"support_tickets">;
type Order = Tables<"orders">;

type Detail = { services: Service[]; invoices: Invoice[]; tickets: Ticket[]; orders: Order[] };

const CustomerLookup = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Profile[] | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", department: "technical", priority: "medium", message: "" });
  const [saving, setSaving] = useState(false);

  const search = async () => {
    const value = term.trim();
    if (value.length < 2) { setError(bn ? "অন্তত ২টি অক্ষর লিখুন।" : "Type at least 2 characters."); return; }
    setError(""); setSearching(true); setSelected(null); setDetail(null);
    const pattern = `%${value}%`;
    const [byProfile, byService] = await Promise.all([
      supabase.from("profiles").select("*").or(`full_name.ilike.${pattern},phone.ilike.${pattern},company_name.ilike.${pattern}`).limit(10),
      supabase.from("services").select("user_id").ilike("domain", pattern).limit(10),
    ]);
    let rows = byProfile.data || [];
    const extraIds = (byService.data || []).map((row) => row.user_id).filter((id) => !rows.some((row) => row.user_id === id));
    if (extraIds.length) {
      const { data } = await supabase.from("profiles").select("*").in("user_id", extraIds);
      rows = [...rows, ...(data || [])];
    }
    if (byProfile.error) setError(bn ? "গ্রাহক খোঁজা যায়নি।" : "Customer search failed.");
    setResults(rows);
    setSearching(false);
  };

  const openCustomer = async (profile: Profile) => {
    setSelected(profile); setLoadingDetail(true); setDetail(null);
    const [services, invoices, tickets, orders] = await Promise.all([
      supabase.from("services").select("*").eq("user_id", profile.user_id).order("expiry_date", { ascending: true }).limit(20),
      supabase.from("invoices").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("support_tickets").select("*").eq("user_id", profile.user_id).order("updated_at", { ascending: false }).limit(10),
      supabase.from("orders").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(10),
    ]);
    setDetail({ services: services.data || [], invoices: invoices.data || [], tickets: tickets.data || [], orders: orders.data || [] });
    setLoadingDetail(false);
  };

  const date = (value: string | null) => value ? new Date(value).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const due = detail?.invoices.filter((item) => item.status === "unpaid" || item.status === "overdue") || [];
  const dueTotal = due.reduce((sum, item) => sum + Number(item.amount_bdt), 0);

  const createTicket = async () => {
    if (!selected) return;
    if (form.subject.trim().length < 3 || form.message.trim().length < 5) { toast.error(bn ? "বিষয় ও বিবরণ লিখুন।" : "Enter a subject and description."); return; }
    setSaving(true);
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const { data: ticket, error: ticketError } = await supabase.from("support_tickets").insert({
      user_id: selected.user_id, ticket_number: ticketNumber, subject: form.subject.trim(),
      department: form.department as Ticket["department"], priority: form.priority as Ticket["priority"],
    }).select("id, ticket_number").single();
    if (ticketError || !ticket) { setSaving(false); toast.error(bn ? "টিকেট তৈরি করা যায়নি।" : "Could not create the ticket."); return; }
    await supabase.from("ticket_replies").insert({ ticket_id: ticket.id, user_id: user?.id as string, message: form.message.trim(), is_staff: true });
    await supabase.from("notifications").insert({ user_id: selected.user_id, title: bn ? "আপনার জন্য একটি টিকেট খোলা হয়েছে" : "A support ticket was opened for you", message: `#${ticket.ticket_number} • ${form.subject.trim()}`, type: "ticket" });
    setSaving(false); setTicketOpen(false); setForm({ subject: "", department: "technical", priority: "medium", message: "" });
    toast.success(bn ? `টিকেট #${ticket.ticket_number} তৈরি হয়েছে` : `Ticket #${ticket.ticket_number} created`);
    openCustomer(selected);
  };

  const sendReminder = async () => {
    if (!selected) return;
    setSaving(true);
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: selected.user_id, type: "billing",
      title: bn ? "পেমেন্ট রিমাইন্ডার" : "Payment reminder",
      message: bn ? `আপনার ${due.length}টি বিলে মোট ৳${formatAmount(dueTotal, lang)} বকেয়া আছে। সেবা চালু রাখতে অনুগ্রহ করে পরিশোধ করুন।` : `You have ৳${formatAmount(dueTotal, lang)} due across ${due.length} invoices. Please pay to keep your services active.`,
    });
    setSaving(false);
    if (notifyError) toast.error(bn ? "রিমাইন্ডার পাঠানো যায়নি।" : "Reminder could not be sent.");
    else toast.success(bn ? "গ্রাহকের ড্যাশবোর্ডে রিমাইন্ডার পাঠানো হয়েছে।" : "Reminder sent to the customer dashboard.");
  };
  const expiringSoon = detail?.services.filter((item) => item.expiry_date && new Date(item.expiry_date).getTime() - Date.now() < 30 * 864e5) || [];

  return <section className="staff-panel overflow-hidden">
    <div className="border-b border-border px-4 py-3">
      <h2 className="text-sm font-semibold text-foreground">{bn ? "গ্রাহক ৩৬০° লুকআপ" : "Customer 360 lookup"}</h2>
      <p className="text-xs text-muted-foreground">{bn ? "নাম, ফোন, কোম্পানি বা ডোমেইন দিয়ে খুঁজে গ্রাহকের সব তথ্য এক জায়গায় দেখুন" : "Search by name, phone, company or domain to see everything about a customer"}</p>
    </div>
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row">
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={term} onChange={(event) => setTerm(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder={bn ? "গ্রাহকের নাম, ফোন বা ডোমেইন" : "Customer name, phone or domain"} className="h-11 pl-9" />
      </div>
      <Button onClick={search} disabled={searching} className="h-11 min-w-28">{searching ? <Loader2 className="animate-spin" /> : <Search />}{bn ? "খুঁজুন" : "Search"}</Button>
    </div>
    {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}

    {results && !selected && <div className="divide-y divide-border border-t border-border">
      {results.length === 0 ? <p className="px-4 py-6 text-center text-sm text-muted-foreground">{bn ? "এই তথ্যে কোনো গ্রাহক পাওয়া যায়নি।" : "No customer matched that search."}</p>
        : results.map((profile) => <button key={profile.id} onClick={() => openCustomer(profile)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">{(profile.full_name || "?").charAt(0).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{profile.full_name || (bn ? "নামবিহীন গ্রাহক" : "Unnamed customer")}</span><span className="block truncate text-xs text-muted-foreground">{[profile.phone, profile.company_name, profile.city].filter(Boolean).join(" • ") || "—"}</span></span>
          <Badge variant={profile.account_status === "approved" ? "secondary" : "outline"}>{profile.account_status}</Badge>
        </button>)}
    </div>}

    {selected && <div className="border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary/40 px-4 py-3">
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{selected.full_name || (bn ? "নামবিহীন গ্রাহক" : "Unnamed customer")}</p>
          <p className="truncate text-xs text-muted-foreground">{[selected.phone, selected.company_name, selected.address, selected.city].filter(Boolean).join(" • ") || (bn ? "যোগাযোগ তথ্য নেই" : "No contact details")}</p></div>
        <Button variant="ghost" onClick={() => { setSelected(null); setDetail(null); }}>{bn ? "তালিকায় ফিরুন" : "Back to results"}</Button>
      </div>

      {loadingDetail ? <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{bn ? "গ্রাহকের তথ্য আনা হচ্ছে..." : "Loading customer record..."}</p> : detail && <div className="space-y-4 p-4">
        {(dueTotal > 0 || expiringSoon.length > 0) && <div className="flex flex-wrap gap-2">
          {dueTotal > 0 && <span className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"><AlertTriangle className="size-3.5" />{bn ? `বকেয়া ৳${formatAmount(dueTotal, lang)} (${due.length}টি বিল)` : `Due ৳${formatAmount(dueTotal, lang)} (${due.length} invoices)`}</span>}
          {expiringSoon.length > 0 && <span className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs font-semibold text-warning"><AlertTriangle className="size-3.5" />{bn ? `${expiringSoon.length}টি সার্ভিস ৩০ দিনের মধ্যে মেয়াদ শেষ` : `${expiringSoon.length} services expiring in 30 days`}</span>}
        </div>}

        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="staff-eyebrow flex items-center gap-2"><Globe className="size-3.5" />{bn ? "সার্ভিস ও ডোমেইন" : "Services & domains"}</p>
            <div className="mt-2 space-y-2">{detail.services.length === 0 ? <p className="text-xs text-muted-foreground">{bn ? "কোনো সক্রিয় সার্ভিস নেই।" : "No services yet."}</p>
              : detail.services.map((item) => <div key={item.id} className="rounded-md border border-border px-3 py-2"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{item.domain || item.name}</p><Badge variant={item.status === "active" ? "secondary" : "outline"}>{item.status}</Badge></div><p className="text-xs text-muted-foreground">{item.plan || item.service_type} • {bn ? "মেয়াদ" : "Expires"} {date(item.expiry_date)}</p></div>)}</div></div>

          <div><p className="staff-eyebrow flex items-center gap-2"><CreditCard className="size-3.5" />{bn ? "সাম্প্রতিক বিল" : "Recent invoices"}</p>
            <div className="mt-2 space-y-2">{detail.invoices.length === 0 ? <p className="text-xs text-muted-foreground">{bn ? "কোনো বিল নেই।" : "No invoices yet."}</p>
              : detail.invoices.map((item) => <div key={item.id} className="rounded-md border border-border px-3 py-2"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{item.invoice_number}</p><Badge variant={item.status === "paid" ? "secondary" : "outline"} className={item.status === "overdue" ? "border-destructive/30 text-destructive" : ""}>{item.status}</Badge></div><p className="text-xs text-muted-foreground">৳{formatAmount(Number(item.amount_bdt), lang)} • {date(item.due_date || item.created_at)}</p></div>)}</div></div>

          <div><p className="staff-eyebrow flex items-center gap-2"><Headphones className="size-3.5" />{bn ? "সাপোর্ট টিকেট" : "Support tickets"}</p>
            <div className="mt-2 space-y-2">{detail.tickets.length === 0 ? <p className="text-xs text-muted-foreground">{bn ? "কোনো টিকেট নেই।" : "No tickets yet."}</p>
              : detail.tickets.map((item) => <div key={item.id} className="rounded-md border border-border px-3 py-2"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{item.subject}</p><Badge variant="outline">{item.status}</Badge></div><p className="text-xs text-muted-foreground">#{item.ticket_number} • {item.priority} • {date(item.updated_at)}</p></div>)}</div></div>

          <div><p className="staff-eyebrow flex items-center gap-2"><ShoppingCart className="size-3.5" />{bn ? "অর্ডার" : "Orders"}</p>
            <div className="mt-2 space-y-2">{detail.orders.length === 0 ? <p className="text-xs text-muted-foreground">{bn ? "কোনো অর্ডার নেই।" : "No orders yet."}</p>
              : detail.orders.map((item) => <div key={item.id} className="rounded-md border border-border px-3 py-2"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{item.order_number}</p><Badge variant="outline">{item.status}</Badge></div><p className="text-xs text-muted-foreground">৳{formatAmount(Number(item.total_bdt), lang)} • {item.payment_status} • {date(item.created_at)}</p></div>)}</div></div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button onClick={() => setTicketOpen((value) => !value)}><Plus />{bn ? "গ্রাহকের পক্ষে টিকেট খুলুন" : "Open ticket for customer"}</Button>
          {due.length > 0 && <Button variant="outline" onClick={sendReminder} disabled={saving}><BellRing />{bn ? "পেমেন্ট রিমাইন্ডার পাঠান" : "Send payment reminder"}</Button>}
          <Button asChild variant="outline"><Link to="/call-center/tickets"><Headphones />{bn ? "টিকেট কিউ" : "Ticket queue"}</Link></Button>
          <Button asChild variant="outline"><Link to="/call-center/orders"><ShoppingCart />{bn ? "অর্ডার কিউ" : "Order queue"}</Link></Button>
          {selected.phone && <Button asChild variant="outline"><a href={`tel:${selected.phone}`}><User />{bn ? "গ্রাহককে কল করুন" : "Call customer"}</a></Button>}
        </div>

        {ticketOpen && <div className="space-y-3 rounded-md border border-border bg-secondary/30 p-3">
          <p className="text-sm font-semibold text-foreground">{bn ? "গ্রাহকের পক্ষে নতুন টিকেট" : "New ticket on behalf of customer"}</p>
          <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder={bn ? "সমস্যার বিষয়" : "Issue subject"} className="h-11" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={form.department} onValueChange={(value) => setForm({ ...form, department: value })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="technical">{bn ? "কারিগরি" : "Technical"}</SelectItem><SelectItem value="billing">{bn ? "বিলিং" : "Billing"}</SelectItem><SelectItem value="sales">{bn ? "সেলস" : "Sales"}</SelectItem><SelectItem value="general">{bn ? "সাধারণ" : "General"}</SelectItem></SelectContent></Select>
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="low">{bn ? "কম" : "Low"}</SelectItem><SelectItem value="medium">{bn ? "মাঝারি" : "Medium"}</SelectItem><SelectItem value="high">{bn ? "উচ্চ" : "High"}</SelectItem><SelectItem value="urgent">{bn ? "জরুরি" : "Urgent"}</SelectItem></SelectContent></Select>
          </div>
          <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={4} placeholder={bn ? "কলে গ্রাহক যা জানিয়েছেন তা লিখুন" : "Summarise what the customer reported on the call"} />
          <div className="flex gap-2"><Button onClick={createTicket} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Plus />}{bn ? "টিকেট তৈরি করুন" : "Create ticket"}</Button><Button variant="ghost" onClick={() => setTicketOpen(false)}>{bn ? "বাতিল" : "Cancel"}</Button></div>
        </div>}
      </div>}
    </div>}
  </section>;
};

export default CustomerLookup;
