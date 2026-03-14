import { useEffect, useState } from "react";
import { HeadphonesIcon, Search, Send, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type TicketWithUser = Tables<"support_tickets"> & { profiles?: Tables<"profiles"> | null };

const ticketStatuses = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

const AdminTickets = () => {
  const { tr } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [replies, setReplies] = useState<Tables<"ticket_replies">[]>([]);
  const [replyMsg, setReplyMsg] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    const [tix, prof] = await Promise.all([
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    const ticketsWithUser = (tix.data || []).map(t => ({
      ...t,
      profiles: (prof.data || []).find(p => p.user_id === t.user_id) || null,
    }));
    setTickets(ticketsWithUser);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openTicket = async (ticket: TicketWithUser) => {
    setSelectedTicket(ticket);
    const { data } = await supabase.from("ticket_replies").select("*").eq("ticket_id", ticket.id).order("created_at");
    setReplies(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("support_tickets").update({ status: status as any }).eq("id", id);
    toast({ title: tr("admin.statusUpdated") });
    fetchData();
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status: status as any });
  };

  const sendReply = async () => {
    if (!replyMsg.trim() || !selectedTicket || !user) return;
    setSending(true);
    await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message: replyMsg,
      is_staff: true,
    });
    setReplyMsg("");
    const { data } = await supabase.from("ticket_replies").select("*").eq("ticket_id", selectedTicket.id).order("created_at");
    setReplies(data || []);
    setSending(false);
  };

  const statusColors: Record<string, string> = {
    open: "bg-warning/10 text-warning",
    in_progress: "bg-primary/10 text-primary",
    waiting: "bg-muted text-muted-foreground",
    resolved: "bg-success/10 text-success",
    closed: "bg-muted text-muted-foreground",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-warning/10 text-warning",
    urgent: "bg-destructive/10 text-destructive",
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.includes(search) ||
      (t.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> {tr("dash.backToTickets")}
        </button>

        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h2>
              <p className="text-xs text-muted-foreground">
                #{selectedTicket.ticket_number} • {selectedTicket.profiles?.full_name || "Unknown"} • {selectedTicket.department}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[selectedTicket.priority]}`}>
                {selectedTicket.priority}
              </span>
              <select
                value={selectedTicket.status}
                onChange={e => updateStatus(selectedTicket.id, e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground outline-none"
              >
                {ticketStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {replies.map((r) => (
              <div key={r.id} className={`p-3 rounded-xl text-sm ${r.is_staff ? "bg-destructive/5 border border-destructive/10 ml-8" : "bg-secondary/30 mr-8"}`}>
                <p className="text-xs font-semibold mb-1 text-muted-foreground">
                  {r.is_staff ? `🛡️ ${tr("dash.supportTeam")}` : tr("admin.client")} • {new Date(r.created_at).toLocaleString()}
                </p>
                <p className="text-foreground whitespace-pre-wrap">{r.message}</p>
              </div>
            ))}
            {replies.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{tr("dash.noMessages")}</p>}
          </div>

          <div className="flex gap-2">
            <input
              value={replyMsg}
              onChange={e => setReplyMsg(e.target.value)}
              placeholder={tr("admin.staffReplyPlaceholder")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={e => e.key === "Enter" && sendReply()}
            />
            <button
              onClick={sendReply}
              disabled={sending || !replyMsg.trim()}
              className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <HeadphonesIcon className="w-6 h-6" /> {tr("admin.ticketManagement")}
      </h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tr("admin.searchTickets")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none"
        >
          <option value="all">{tr("admin.allStatus")}</option>
          {ticketStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.subject")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.client")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.department")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.priority")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.status")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.date")}</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{tr("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => openTicket(t)}>
                  <td className="px-4 py-3 text-muted-foreground text-xs">#{t.ticket_number}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{t.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.profiles?.full_name || t.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.department}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <select
                      value={t.status}
                      onChange={e => updateStatus(t.id, e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground outline-none"
                    >
                      {ticketStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{tr("admin.noData")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
