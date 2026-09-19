import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, Clock3, CreditCard, Headphones, MessageCircle, PhoneMissed, ShoppingCart, TrendingUp, Users } from "lucide-react";
import CustomerLookup from "@/components/staff/CustomerLookup";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffEmpty, StaffLoading, StaffMetricStrip, StaffPageHeader } from "@/components/staff/StaffConsole";
import { formatAmount } from "@/lib/formatPrice";
import type { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"support_tickets">;
type Chat = Tables<"live_chats">;
type Order = Tables<"orders">;
type Call = Tables<"call_history">;
type Invoice = Tables<"invoices">;
type Service = Tables<"services">;
type QueueItem = { id: string; title: string; detail: string; time: string; href: string; type: "chat" | "ticket" | "order" | "call"; urgent: boolean };

const CallCenterDashboard = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [data, setData] = useState<{ chats: Chat[]; tickets: Ticket[]; orders: Order[]; calls: Call[]; invoices: Invoice[]; services: Service[] }>({ chats: [], tickets: [], orders: [], calls: [], invoices: [], services: [] });

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    const soon = new Date(Date.now() + 30 * 864e5).toISOString();
    const [chats, tickets, orders, calls, invoices, services] = await Promise.all([
      supabase.from("live_chats").select("*").order("updated_at", { ascending: false }).limit(30),
      supabase.from("support_tickets").select("*").order("updated_at", { ascending: false }).limit(30),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("call_history").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("invoices").select("*").in("status", ["unpaid", "overdue"]).order("due_date", { ascending: true }).limit(30),
      supabase.from("services").select("*").not("expiry_date", "is", null).lte("expiry_date", soon).order("expiry_date", { ascending: true }).limit(30),
    ]);
    const failed = [chats.error, tickets.error, orders.error, calls.error].find(Boolean);
    if (failed) setError(bn ? "অপারেশন ডেটা লোড করা যায়নি। আবার চেষ্টা করুন।" : "Operations data could not be loaded. Please try again.");
    setData({ chats: chats.data || [], tickets: tickets.data || [], orders: orders.data || [], calls: calls.data || [], invoices: invoices.data || [], services: services.data || [] });
    setLastSync(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, [bn]);
  useEffect(() => { const timer = setInterval(() => load(true), 60000); return () => clearInterval(timer); }, [bn]);

  const openChats = data.chats.filter((item) => item.status === "open");
  const openTickets = data.tickets.filter((item) => ["open", "in_progress"].includes(item.status));
  const pendingOrders = data.orders.filter((item) => ["pending", "confirmed", "processing"].includes(item.status));
  const missedCalls = data.calls.filter((item) => item.status === "missed");
  const completedCalls = data.calls.filter((item) => item.status === "completed");
  const salesValue = data.orders.reduce((sum, item) => sum + Number(item.total_bdt), 0);
  const paidOrders = data.orders.filter((item) => item.payment_status === "paid").length;
  const overdueInvoices = data.invoices.filter((item) => item.status === "overdue" || (item.due_date && new Date(item.due_date).getTime() < Date.now()));
  const dueTotal = data.invoices.reduce((sum, item) => sum + Number(item.amount_bdt), 0);
  const expiringServices = data.services;
  const oldestTicket = openTickets.map((item) => Date.now() - new Date(item.created_at).getTime()).sort((a, b) => b - a)[0] || 0;
  const oldestHours = Math.round(oldestTicket / 3600000);
  const breachedTickets = openTickets.filter((item) => Date.now() - new Date(item.created_at).getTime() > 24 * 3600000).length;


  const queue = useMemo<QueueItem[]>(() => [
    ...openTickets.map((item) => ({ id: item.id, title: item.subject, detail: `${bn ? "টিকেট" : "Ticket"} #${item.ticket_number} • ${item.priority}`, time: item.updated_at, href: "/call-center/tickets", type: "ticket" as const, urgent: item.priority === "urgent" || item.priority === "high" })),
    ...openChats.map((item) => ({ id: item.id, title: item.visitor_name, detail: item.visitor_email || item.visitor_phone || (bn ? "লাইভ গ্রাহক" : "Live customer"), time: item.updated_at, href: "/call-center/live-chat", type: "chat" as const, urgent: Date.now() - new Date(item.updated_at).getTime() > 30 * 60 * 1000 })),
    ...pendingOrders.map((item) => ({ id: item.id, title: item.order_number, detail: `${item.payment_status} • ৳${formatAmount(Number(item.total_bdt), lang)}`, time: item.created_at, href: "/call-center/orders", type: "order" as const, urgent: item.status === "pending" })),
    ...missedCalls.map((item) => ({ id: item.id, title: bn ? "মিসড গ্রাহক কল" : "Missed customer call", detail: bn ? "ফলো-আপ প্রয়োজন" : "Follow-up required", time: item.started_at, href: "/call-center/call-history", type: "call" as const, urgent: true })),
  ].sort((a, b) => Number(b.urgent) - Number(a.urgent) || new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8), [data, bn, lang]);

  const iconMap = { chat: MessageCircle, ticket: Headphones, order: ShoppingCart, call: PhoneMissed };
  const metrics = [
    { label: bn ? "ওপেন চ্যাট" : "Open chats", value: openChats.length, detail: bn ? "লাইভ কিউ" : "live queue", icon: MessageCircle, tone: "primary" as const },
    { label: bn ? "সাপোর্ট চাপ" : "Support workload", value: openTickets.length, detail: bn ? `${data.tickets.filter((t) => t.priority === "high" || t.priority === "urgent").length} জরুরি` : `${data.tickets.filter((t) => t.priority === "high" || t.priority === "urgent").length} priority`, icon: Headphones, tone: "warning" as const },
    { label: bn ? "সেলস ভ্যালু" : "Sales value", value: `৳${formatAmount(salesValue, lang)}`, detail: `${paidOrders}/${data.orders.length} ${bn ? "পরিশোধিত" : "paid"}`, icon: TrendingUp, tone: "success" as const },
    { label: bn ? "কল ফলাফল" : "Call outcome", value: completedCalls.length, detail: `${missedCalls.length} ${bn ? "মিসড" : "missed"}`, icon: PhoneMissed, tone: missedCalls.length ? "danger" as const : "success" as const },
    { label: bn ? "বকেয়া বিল" : "Outstanding bills", value: `৳${formatAmount(dueTotal, lang)}`, detail: `${overdueInvoices.length} ${bn ? "মেয়াদোত্তীর্ণ" : "overdue"}`, icon: CreditCard, tone: overdueInvoices.length ? "danger" as const : "primary" as const },
    { label: bn ? "মেয়াদ শেষের ঝুঁকি" : "Expiry risk", value: expiringServices.length, detail: bn ? "৩০ দিনের মধ্যে" : "within 30 days", icon: CalendarClock, tone: expiringServices.length ? "warning" as const : "success" as const },
    { label: bn ? "সবচেয়ে পুরোনো টিকেট" : "Oldest open ticket", value: `${oldestHours}${bn ? " ঘন্টা" : "h"}`, detail: `${breachedTickets} ${bn ? "২৪ ঘন্টার বেশি" : "over 24h"}`, icon: Clock3, tone: breachedTickets ? "danger" as const : "success" as const },
  ];

  if (loading) return <div className="space-y-5"><StaffLoading rows={2} /><div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><StaffLoading rows={6} /><StaffLoading rows={4} /></div></div>;

  return <div className="space-y-5">
    <StaffPageHeader title={bn ? "অপারেশনস কনসোল" : "Operations Console"} description={bn ? "সাপোর্ট, কল ও সেলসের আজকের লাইভ কার্যক্রম" : "Live support, call and sales activity for today"} actions={<div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{lastSync ? `${bn ? "সর্বশেষ আপডেট" : "Updated"} ${lastSync.toLocaleTimeString(bn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><Button variant="outline" onClick={() => load()}><Clock3 />{bn ? "রিফ্রেশ" : "Refresh"}</Button></div>} />
    {error && <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
    <StaffMetricStrip metrics={metrics} />
    <div className="grid min-h-[480px] gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <section className="staff-panel overflow-hidden"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-sm font-semibold text-foreground">{bn ? "অগ্রাধিকার কিউ" : "Priority queue"}</h2><p className="text-xs text-muted-foreground">{bn ? "পরবর্তী পদক্ষেপের জন্য সাজানো" : "Sorted by next required action"}</p></div><Badge variant="secondary">{queue.length}</Badge></div>
        {queue.length === 0 ? <StaffEmpty icon={Users} title={bn ? "কিউ পরিষ্কার" : "Queue is clear"} description={bn ? "এই মুহূর্তে কোনো অপেক্ষমাণ কাজ নেই।" : "There is no pending customer action right now."} /> : <div className="divide-y divide-border">{queue.map((item) => { const Icon = iconMap[item.type]; return <Link key={`${item.type}-${item.id}`} to={item.href} className="group flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"><div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${item.urgent ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}><Icon className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-foreground">{item.title}</p>{item.urgent && <Badge className="border-0 bg-warning/10 text-warning">{bn ? "অগ্রাধিকার" : "Priority"}</Badge>}</div><p className="truncate text-xs text-muted-foreground">{item.detail}</p></div><span className="hidden text-xs text-muted-foreground sm:block">{new Date(item.time).toLocaleTimeString(bn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>; })}</div>}
      </section>
      <aside className="space-y-4"><section className="staff-panel p-4"><p className="staff-eyebrow">{bn ? "সেলস পালস" : "Sales pulse"}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">৳{formatAmount(salesValue, lang)}</p><p className="mt-1 text-sm text-muted-foreground">{bn ? `সাম্প্রতিক ${data.orders.length}টি অর্ডার` : `${data.orders.length} recent orders`}</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4"><div><p className="staff-eyebrow">{bn ? "অপেক্ষমাণ" : "Pending"}</p><p className="mt-1 text-xl font-semibold text-foreground">{pendingOrders.length}</p></div><div><p className="staff-eyebrow">{bn ? "পরিশোধিত" : "Paid"}</p><p className="mt-1 text-xl font-semibold text-success">{paidOrders}</p></div></div><Button asChild className="mt-4 w-full"><Link to="/call-center/orders">{bn ? "সেলস কিউ খুলুন" : "Open sales queue"}<ArrowRight /></Link></Button></section>
        <section className="staff-panel p-4"><p className="staff-eyebrow">{bn ? "দ্রুত কাজ" : "Quick actions"}</p><div className="mt-3 grid gap-2"><Button asChild variant="outline" className="justify-start"><Link to="/call-center/live-chat"><MessageCircle />{bn ? "লাইভ কথোপকথন" : "Live conversations"}</Link></Button><Button asChild variant="outline" className="justify-start"><Link to="/call-center/tickets"><Headphones />{bn ? "সাপোর্ট টিকেট" : "Support tickets"}</Link></Button><Button asChild variant="outline" className="justify-start"><Link to="/call-center/call-history"><PhoneMissed />{bn ? "মিসড কল দেখুন" : "Review missed calls"}</Link></Button></div></section>
      </aside>
    </div>
  </div>;
};

export default CallCenterDashboard;