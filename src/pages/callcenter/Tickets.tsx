import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, RefreshCw, HeadphonesIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

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
    await supabase.from("ticket_replies").insert({ ticket_id: selected, user_id: user.id, message: reply, is_staff: true });
    await supabase.from("support_tickets").update({ status: "in_progress" as any, updated_at: new Date().toISOString() }).eq("id", selected);
    setReply("");
    toast({ title: bn ? "উত্তর পাঠানো হয়েছে" : "Reply sent" });
    fetchTickets();
  };

  const selectedTicket = tickets.find(t => t.id === selected);
  const statusColor = (s: string) => {
    if (s === "open") return "bg-orange-500/10 text-orange-500";
    if (s === "in_progress") return "bg-blue-500/10 text-blue-500";
    if (s === "resolved" || s === "closed") return "bg-green-500/10 text-green-500";
    return "bg-muted text-muted-foreground";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{bn ? "সাপোর্ট টিকেট" : "Support Tickets"}</h1>
        <button onClick={fetchTickets} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        <div className="glass-card rounded-xl overflow-auto">
          <div className="p-3 border-b border-border/50 text-sm font-semibold text-foreground">{bn ? "টিকেট তালিকা" : "Ticket List"}</div>
          {tickets.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`w-full text-left p-3 border-b border-border/30 hover:bg-secondary/40 transition-all ${selected === t.id ? "bg-primary/10" : ""}`}>
              <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
              <p className="text-xs text-muted-foreground">{t.user_name} • #{t.ticket_number}</p>
              <Badge className={`${statusColor(t.status)} border-0 text-[10px] mt-1`}>{t.status}</Badge>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">{bn ? "কোনো টিকেট নেই" : "No tickets"}</p>}
        </div>

        <div className="lg:col-span-2 glass-card rounded-xl flex flex-col">
          {selectedTicket ? (
            <>
              <div className="p-3 border-b border-border/50">
                <p className="text-sm font-semibold text-foreground">{selectedTicket.subject}</p>
                <p className="text-xs text-muted-foreground">#{selectedTicket.ticket_number} • {selectedTicket.department} • {selectedTicket.priority}</p>
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
              <div className="p-3 border-t border-border/50 flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()}
                  placeholder={bn ? "উত্তর লিখুন..." : "Type reply..."} className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <button onClick={sendReply} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground"><Send className="w-4 h-4" /></button>
              </div>
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
