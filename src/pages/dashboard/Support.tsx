import { useEffect, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";

import { HeadphonesIcon, Plus, Send } from "lucide-react";
import { SupportSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = { open: "bg-primary/10 text-primary", in_progress: "bg-warning/10 text-warning", waiting: "bg-info/10 text-info", resolved: "bg-success/10 text-success", closed: "bg-muted text-muted-foreground" };
const priorityColors: Record<string, string> = { low: "bg-muted text-muted-foreground", medium: "bg-info/10 text-info", high: "bg-warning/10 text-warning", urgent: "bg-destructive/10 text-destructive" };

const DashboardSupport = () => {
  const { user } = useAuth();
  const { tr, lang } = useLanguage();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Tables<"support_tickets">[]>([]);
  const [replies, setReplies] = useState<Tables<"ticket_replies">[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyMsg, setReplyMsg] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState<"billing" | "technical" | "sales" | "general">("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [message, setMessage] = useState("");

  const fetchTickets = async () => { if (!user) return; const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }); setTickets(data || []); setLoading(false); };
  const fetchReplies = async (ticketId: string) => { const { data } = await supabase.from("ticket_replies").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }); setReplies(data || []); };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => { if (searchParams.get("new") === "1") { setShowCreate(true); setSearchParams({}, { replace: true }); } }, [searchParams, setSearchParams]);

  useEffect(() => { fetchTickets(); }, [user]);
  useEffect(() => { if (selectedTicket) fetchReplies(selectedTicket); }, [selectedTicket]);


  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from("support_tickets").insert({ user_id: user.id, ticket_number: ticketNumber, subject, department, priority }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (message && data) { await supabase.from("ticket_replies").insert({ ticket_id: data.id, user_id: user.id, message }); }
    toast({ title: "Success!", description: tr("dash.ticketCreated") });
    setShowCreate(false); setSubject(""); setMessage(""); setDepartment("general"); setPriority("medium");
    fetchTickets();
  };

  const [sendingReply, setSendingReply] = useState(false);

  const sendReply = async () => {
    if (!user || !selectedTicket || !replyMsg.trim()) return;
    setSendingReply(true);
    const { error } = await supabase.from("ticket_replies").insert({ ticket_id: selectedTicket, user_id: user.id, message: replyMsg });
    if (error) {
      toast({ title: "❌", description: tr("dash.replyError") || (lang === "bn" ? "রিপ্লাই পাঠাতে সমস্যা হয়েছে" : "Failed to send reply"), variant: "destructive" });
    } else {
      toast({ title: "✅", description: lang === "bn" ? "রিপ্লাই পাঠানো হয়েছে" : "Reply sent successfully" });
    }
    setReplyMsg(""); fetchReplies(selectedTicket);
    setSendingReply(false);
  };

  if (loading) return <SupportSkeleton />;

  if (showCreate) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{tr("dash.newTicket")}</h1>
          <button onClick={() => setShowCreate(false)} className="text-sm text-muted-foreground hover:text-foreground">{tr("dash.back")}</button>
        </div>
        <div className="glass-card p-6 max-w-2xl">
          <form onSubmit={createTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.subject")}</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm" placeholder={tr("dash.subjectPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.department")}</label>
                <select value={department} onChange={e => setDepartment(e.target.value as any)} className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden text-sm">
                  <option value="general">General</option><option value="technical">Technical</option><option value="billing">Billing</option><option value="sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.priority")}</label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden text-sm">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.message")}</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm resize-none" placeholder={tr("dash.messagePlaceholder")} />
            </div>
            <button type="submit" className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20">{tr("dash.submitTicket")}</button>
          </form>
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    const ticket = tickets.find(t => t.id === selectedTicket);
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => setSelectedTicket(null)} className="text-sm text-muted-foreground hover:text-foreground mb-2 block">{tr("dash.backToTickets")}</button>
            <h1 className="text-xl font-bold text-foreground">{ticket?.subject}</h1>
            <p className="text-xs text-muted-foreground">{ticket?.ticket_number} • {ticket?.department}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[ticket?.status || "open"]}`}>{ticket?.status}</span>
        </div>
        <div className="glass-card p-6 mb-4 max-w-3xl">
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{tr("dash.noMessages")}</p>
            ) : replies.map(r => (
              <div key={r.id} className={`p-4 rounded-xl ${r.is_staff ? "bg-primary/5 border border-primary/20" : "bg-secondary/50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-foreground">{r.is_staff ? tr("dash.supportTeam") : tr("dash.you")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{r.message}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder={tr("dash.replyPlaceholder")} className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground outline-hidden text-sm" onKeyDown={e => e.key === "Enter" && !sendingReply && sendReply()} />
            <button onClick={sendReply} disabled={sendingReply || !replyMsg.trim()} className="gradient-primary text-primary-foreground px-4 py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
              {sendingReply ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tr("dash.supportTitle")}</h1>
          <p className="text-sm text-muted-foreground">{tr("dash.supportSubtitle")}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> {tr("dash.newTicket")}
        </button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={HeadphonesIcon}
          title={tr("dash.noTickets")}
          description={tr("dash.noTicketsDesc")}
          actionLabel={tr("dash.openTicket")}
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <button key={ticket.id} onClick={() => setSelectedTicket(ticket.id)} className="w-full glass-card p-5 text-left hover:shadow-lg transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground">{ticket.ticket_number} • {ticket.department} • {new Date(ticket.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>{ticket.status}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardSupport;
