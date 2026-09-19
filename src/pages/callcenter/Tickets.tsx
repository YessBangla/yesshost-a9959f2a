import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, RefreshCw, HeadphonesIcon, Search, Clock3, UserRound, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffMetricStrip, StaffPageHeader } from "@/components/staff/StaffConsole";
import { csvDate, downloadCsv } from "@/lib/export-csv";
import { formatGap, formatStamp, isSlowGap } from "@/lib/time-gap";
import { formatMinutes, slaMinutes, slaToneClass, ticketSla } from "@/lib/ticket-sla";

type TicketWithReplies = Tables<"support_tickets"> & { replies: Tables<"ticket_replies">[]; user_name?: string };

const CallCenterTickets = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithReplies[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("all");

  const fetchTickets = async () => {
    setLoading(true);
    const [ticketData, repliesData, profiles] = await Promise.all([
      supabase.from("support_tickets").select("*").order("updated_at", { ascending: false }),
      supabase.from("ticket_replies").select("*").order("created_at"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    const enriched: TicketWithReplies[] = (ticketData.data || []).map(t => ({
      ...t,
      replies: (repliesData.data || []).filter(r => r.ticket_id === t.id),
      user_name: (profiles.data || []).find(p => p.user_id === t.user_id)?.full_name || "—",
    }));
    setTickets(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const sendReply = async () => {
    if (!reply.trim() || !selected || !user) return;
    const { error } = await supabase.from("ticket_replies").insert({ ticket_id: selected, user_id: user.id, message: reply.trim(), is_staff: true });
    if (error) { toast({ title: bn ? "উত্তর পাঠানো যায়নি" : "Reply could not be sent", description: bn ? "আবার চেষ্টা করুন।" : "Please try again.", variant: "destructive" }); return; }
    await supabase.from("support_tickets").update({ status: "in_progress" as any, assigned_to: user.id, updated_at: new Date().toISOString() }).eq("id", selected);
    setReply("");
    toast({ title: bn ? "উত্তর পাঠানো হয়েছে" : "Reply sent" });
    fetchTickets();
  };

  const changeStatus = async (ticketId: string, next: string) => {
    const { error } = await supabase.from("support_tickets").update({ status: next as any, updated_at: new Date().toISOString() }).eq("id", ticketId);
    if (error) { toast({ title: bn ? "স্ট্যাটাস বদলানো যায়নি" : "Status could not be changed", variant: "destructive" }); return; }
    toast({ title: bn ? "স্ট্যাটাস হালনাগাদ হয়েছে" : "Status updated" });
    fetchTickets();
  };

  const assignToMe = async (ticketId: string) => {
    if (!user) return;
    const { error } = await supabase.from("support_tickets").update({ assigned_to: user.id, updated_at: new Date().toISOString() }).eq("id", ticketId);
    if (error) { toast({ title: bn ? "দায়িত্ব নেওয়া যায়নি" : "Could not assign", variant: "destructive" }); return; }
    toast({ title: bn ? "আপনি এই টিকেটের দায়িত্বে" : "Assigned to you" });
    fetchTickets();
  };


  const selectedTicket = tickets.find(t => t.id === selected);
  const statusColor = (s: string) => {
    if (s === "open") return "bg-orange-500/10 text-orange-500";
    if (s === "in_progress") return "bg-blue-500/10 text-blue-500";
    if (s === "resolved" || s === "closed") return "bg-green-500/10 text-green-500";
    return "bg-muted text-muted-foreground";
  };

  const filtered = tickets.filter((ticket) => {
    const query = search.toLowerCase();
    const active = ["open", "in_progress"].includes(ticket.status);
    const statusOk = status === "all"
      ? true
      : status === "active" ? active
      : status === "breached" ? ticketSla(ticket, bn).breached && active
      : status === "unassigned" ? !ticket.assigned_to && active
      : status === "mine" ? ticket.assigned_to === user?.id
      : ticket.status === status;
    return statusOk && (priority === "all" || ticket.priority === priority) && [ticket.subject, ticket.ticket_number, ticket.user_name].some((value) => value?.toLowerCase().includes(query));
  });
  const exportCsv = () => {
    downloadCsv(`tickets-${csvDate(new Date().toISOString())}`,
      [bn ? "টিকেট" : "Ticket", bn ? "বিষয়" : "Subject", bn ? "গ্রাহক" : "Customer", bn ? "বিভাগ" : "Department", bn ? "অগ্রাধিকার" : "Priority", bn ? "স্ট্যাটাস" : "Status", bn ? "উত্তর" : "Replies", bn ? "প্রথম উত্তরের সময় (মিনিট)" : "First response (min)", bn ? "SLA লক্ষ্য (মিনিট)" : "SLA target (min)", bn ? "SLA অতিক্রম" : "SLA breached", bn ? "সর্বশেষ আপডেট" : "Last update"],
      filtered.map((ticket) => { const sla = ticketSla(ticket, bn); return [ticket.ticket_number, ticket.subject, ticket.user_name || "", ticket.department, ticket.priority, ticket.status, ticket.replies.length, sla.responseMinutes ?? "", slaMinutes(ticket.priority), sla.breached ? (bn ? "হ্যাঁ" : "Yes") : (bn ? "না" : "No"), csvDate(ticket.updated_at)]; }));
  };
  const highPriority = tickets.filter((ticket) => ["high", "urgent"].includes(ticket.priority) && ["open", "in_progress"].includes(ticket.status)).length;
  const breachedCount = tickets.filter((ticket) => ["open", "in_progress"].includes(ticket.status) && ticketSla(ticket, bn).breached).length;
  const answered = tickets.filter((ticket) => ticket.first_response_at);
  const avgResponse = answered.length
    ? Math.round(answered.reduce((sum, ticket) => sum + (ticketSla(ticket, bn).responseMinutes || 0), 0) / answered.length)
    : 0;
  if (loading) return <div className="grid gap-4 lg:grid-cols-[340px_1fr]"><div className="staff-panel p-4"><Skeleton className="mb-4 h-10" />{[0,1,2,3,4].map((row) => <Skeleton key={row} className="mb-3 h-16" />)}</div><div className="staff-panel p-4"><Skeleton className="h-full min-h-96" /></div></div>;

  return (
    <div className="space-y-4">
      <StaffPageHeader title={bn ? "সাপোর্ট ও SLA" : "Support & SLA"} description={bn ? "অগ্রাধিকার, বিভাগ ও অপেক্ষার সময় অনুযায়ী টিকেট পরিচালনা" : "Manage tickets by priority, department and wait time"} actions={<><Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}><Download className="size-4" />{bn ? "CSV ডাউনলোড" : "Export CSV"}</Button><Button variant="outline" onClick={fetchTickets}><RefreshCw />{bn ? "রিফ্রেশ" : "Refresh"}</Button></>} />
      <StaffMetricStrip metrics={[{label:bn?"সক্রিয়":"Active",value:tickets.filter((t)=>["open","in_progress"].includes(t.status)).length,detail:bn?"খোলা টিকেট":"open tickets",icon:HeadphonesIcon,tone:"primary"},{label:bn?"জরুরি":"Priority",value:highPriority,detail:bn?"দ্রুত উত্তর":"need attention",icon:Clock3,tone:"warning"},{label:bn?"SLA অতিক্রম":"SLA breached",value:breachedCount,detail:bn?"লক্ষ্য পার":"past target",icon:Clock3,tone:breachedCount?"danger":"success"},{label:bn?"গড় প্রথম উত্তর":"Avg first reply",value:avgResponse?formatMinutes(avgResponse,bn):"—",detail:bn?"সব টিকেট":"all tickets",icon:Clock3,tone:"success"}]} />

      <div className="grid grid-cols-1 overflow-hidden staff-panel lg:grid-cols-[350px_1fr] lg:h-[calc(100vh-310px)]">
        <div className="flex min-h-[360px] flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r"><div className="space-y-2 border-b border-border bg-secondary/30 p-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={bn?"টিকেট বা গ্রাহক খুঁজুন":"Search ticket or customer"} className="pl-9" /></div><div className="grid grid-cols-2 gap-2"><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">{bn?"সক্রিয়":"Active"}</SelectItem><SelectItem value="breached">{bn?"SLA অতিক্রম":"SLA breached"}</SelectItem><SelectItem value="unassigned">{bn?"দায়িত্বহীন":"Unassigned"}</SelectItem><SelectItem value="mine">{bn?"আমার টিকেট":"Assigned to me"}</SelectItem><SelectItem value="open">{bn?"খোলা":"Open"}</SelectItem><SelectItem value="resolved">{bn?"সমাধান":"Resolved"}</SelectItem><SelectItem value="all">{bn?"সব":"All"}</SelectItem></SelectContent></Select><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{bn?"সব অগ্রাধিকার":"All priority"}</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="normal">Normal</SelectItem></SelectContent></Select></div></div><div className="overflow-auto">
          {filtered.map(t => {
            const sla = ticketSla(t, bn);
            return (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`min-h-[76px] w-full border-b border-border p-3 text-left transition-colors hover:bg-secondary/40 ${selected === t.id ? "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}>
              <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
              <p className="text-xs text-muted-foreground">{t.user_name} • #{t.ticket_number}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <Badge className={`${statusColor(t.status)} border-0 text-[10px]`}>{t.status}</Badge>
                <Badge className={`${slaToneClass[sla.tone]} border-0 text-[10px]`}>{sla.label}</Badge>
                {!t.assigned_to && <Badge className="border-0 bg-muted text-[10px] text-muted-foreground">{bn ? "দায়িত্বহীন" : "Unassigned"}</Badge>}
              </div>
            </button>
          );})}
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{bn ? "কোনো টিকেট পাওয়া যায়নি" : "No matching tickets"}</p>}</div></div>

        <div className="flex min-h-[520px] flex-col">
          {selectedTicket ? (
            <>
               <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                 <div><p className="text-sm font-semibold text-foreground">{selectedTicket.subject}</p><p className="text-xs text-muted-foreground">#{selectedTicket.ticket_number} • {selectedTicket.department}</p></div><div className="text-right"><Badge className={`${statusColor(selectedTicket.status)} border-0`}>{selectedTicket.status}</Badge><p className="mt-1 text-[10px] text-muted-foreground">{bn?"আপডেট":"Updated"} {new Date(selectedTicket.updated_at).toLocaleString(bn?"bn-BD":"en-US")}</p></div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {selectedTicket.replies.map(r => (
                  <div key={r.id} className={`flex ${r.is_staff ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-xl text-sm ${r.is_staff ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"}`}>
                      {r.message}
                      <p className="text-[10px] opacity-70 mt-1">{new Date(r.created_at).toLocaleString(bn ? "bn-BD" : "en-US")}</p>
                    </div>
                  </div>
                ))}
              </div>
                <div className="border-t border-border bg-secondary/20 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-3" />{selectedTicket.user_name} • {selectedTicket.priority}</div><div className="flex gap-2"><Input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder={bn ? "উত্তর লিখুন..." : "Type reply..."} className="h-11" /><Button onClick={sendReply} disabled={!reply.trim()} aria-label={bn?"উত্তর পাঠান":"Send reply"}><Send /></Button></div></div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <HeadphonesIcon className="w-12 h-12 opacity-30" />
              <p className="text-sm">{bn ? "একটি টিকেট সিলেক্ট করুন" : "Select a ticket"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallCenterTickets;
