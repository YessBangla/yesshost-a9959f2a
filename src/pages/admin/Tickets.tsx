import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminTableSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import DataPagination from "@/components/DataPagination";
import {
  HeadphonesIcon, Search, Send, ArrowLeft, MessageSquare,
  Clock, CheckCircle2, AlertTriangle, Inbox, Filter, User, Download
} from "lucide-react";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type TicketWithUser = Tables<"support_tickets"> & { profiles?: Tables<"profiles"> | null };

const ticketStatuses = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

const statusConfig: Record<string, { label_bn: string; label_en: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string; bg: string }> = {
  open: { label_bn: "ওপেন", label_en: "Open", variant: "secondary", color: "text-warning", bg: "bg-warning/10" },
  in_progress: { label_bn: "চলমান", label_en: "In Progress", variant: "default", color: "text-primary", bg: "bg-primary/10" },
  waiting: { label_bn: "অপেক্ষমাণ", label_en: "Waiting", variant: "outline", color: "text-muted-foreground", bg: "bg-muted" },
  resolved: { label_bn: "সমাধান", label_en: "Resolved", variant: "default", color: "text-success", bg: "bg-success/10" },
  closed: { label_bn: "বন্ধ", label_en: "Closed", variant: "outline", color: "text-muted-foreground", bg: "bg-muted" },
};

const priorityConfig: Record<string, { label_bn: string; label_en: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label_bn: "কম", label_en: "Low", variant: "outline" },
  medium: { label_bn: "মাঝারি", label_en: "Medium", variant: "secondary" },
  high: { label_bn: "উচ্চ", label_en: "High", variant: "default" },
  urgent: { label_bn: "জরুরি", label_en: "Urgent", variant: "destructive" },
};

const AdminTickets = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [replies, setReplies] = useState<Tables<"ticket_replies">[]>([]);
  const [replyMsg, setReplyMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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
    const { error } = await supabase.from("support_tickets").update({ status: status as any }).eq("id", id);
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      const sc = statusConfig[status];
      toast({ title: "✅", description: isBn ? `টিকেট "${sc?.label_bn || status}" এ আপডেট হয়েছে` : `Ticket updated to "${sc?.label_en || status}"` });
    }
    fetchData();
    if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status: status as any });
  };

  const sendReply = async () => {
    if (!replyMsg.trim() || !selectedTicket || !user) return;
    setSending(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message: replyMsg,
      is_staff: true,
    });
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: isBn ? "স্টাফ রিপ্লাই পাঠানো হয়েছে" : "Staff reply sent" });
      // Auto-update ticket status to in_progress if it was open
      if (selectedTicket.status === "open") {
        await supabase.from("support_tickets").update({ status: "in_progress" as any }).eq("id", selectedTicket.id);
        setSelectedTicket({ ...selectedTicket, status: "in_progress" as any });
        fetchData();
      }
    }
    setReplyMsg("");
    const { data } = await supabase.from("ticket_replies").select("*").eq("ticket_id", selectedTicket.id).order("created_at");
    setReplies(data || []);
    setSending(false);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    urgent: tickets.filter(t => t.priority === "urgent" && t.status !== "closed" && t.status !== "resolved").length,
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.includes(search) ||
      (t.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (d: string) => new Date(d).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString(isBn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" });

  if (loading) return <AdminTableSkeleton columns={4} rows={5} statsCount={4} />;

  // Ticket Detail View
  if (selectedTicket) {
    const sc = statusConfig[selectedTicket.status] || statusConfig.open;
    const pc = priorityConfig[selectedTicket.priority] || priorityConfig.medium;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {isBn ? "সকল টিকেট" : "All Tickets"}
        </button>

        {/* Ticket header */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-muted-foreground">#{selectedTicket.ticket_number}</span>
                <Badge variant={sc.variant} className="text-[10px]">{isBn ? sc.label_bn : sc.label_en}</Badge>
                <Badge variant={pc.variant} className="text-[10px]">{isBn ? pc.label_bn : pc.label_en}</Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedTicket.profiles?.full_name || "—"}</span>
                <span>•</span>
                <span>{selectedTicket.department}</span>
                <span>•</span>
                <span>{formatDate(selectedTicket.created_at)}</span>
              </div>
            </div>
            <select
              value={selectedTicket.status}
              onChange={e => updateStatus(selectedTicket.id, e.target.value)}
              className="text-sm px-4 py-2 rounded-xl bg-secondary/40 border border-border/50 text-foreground outline-hidden"
            >
              {ticketStatuses.map(s => {
                const cfg = statusConfig[s];
                return <option key={s} value={s}>{isBn ? cfg?.label_bn : cfg?.label_en}</option>;
              })}
            </select>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto mb-5 pr-1">
            {replies.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isBn ? "এখনো কোনো মেসেজ নেই" : "No messages yet"}</p>
              </div>
            )}
            {replies.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 text-sm ${r.is_staff
                  ? "bg-primary/5 border border-primary/10 ml-6 sm:ml-12"
                  : "bg-secondary/30 border border-border/30 mr-6 sm:mr-12"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    {r.is_staff ? (
                      <><span className="w-5 h-5 rounded-sm bg-destructive/15 text-destructive flex items-center justify-center text-[10px]">🛡️</span> {isBn ? "সাপোর্ট টিম" : "Support Team"}</>
                    ) : (
                      <><span className="w-5 h-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center text-[10px]">👤</span> {selectedTicket.profiles?.full_name || (isBn ? "ক্লায়েন্ট" : "Client")}</>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(r.created_at)} {formatTime(r.created_at)}</span>
                </div>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{r.message}</p>
              </motion.div>
            ))}
          </div>

          {/* Reply input */}
          <div className="flex gap-2">
            <input
              value={replyMsg}
              onChange={e => setReplyMsg(e.target.value)}
              placeholder={isBn ? "স্টাফ রিপ্লাই লিখুন..." : "Write staff reply..."}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all"
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
            />
            <button
              onClick={sendReply}
              disabled={sending || !replyMsg.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isBn ? "পাঠান" : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tickets List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isBn ? "টিকেট ম্যানেজমেন্ট" : "Ticket Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isBn ? "সকল সাপোর্ট টিকেট পরিচালনা ও রিপ্লাই করুন" : "Manage and reply to all support tickets"}</p>
        </div>
        <button
          onClick={() => downloadCsv("yesshost-tickets", ["ticket_number", "subject", "client", "status", "priority", "created"],
            filtered.map((t: any) => [t.ticket_number, t.subject, t.profiles?.full_name || "", t.status, t.priority, csvDate(t.created_at)]))}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary shrink-0"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isBn ? "মোট টিকেট" : "Total", value: stats.total, icon: Inbox, color: "text-primary", bg: "bg-primary/10" },
          { label: isBn ? "ওপেন" : "Open", value: stats.open, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: isBn ? "চলমান" : "In Progress", value: stats.inProgress, icon: HeadphonesIcon, color: "text-primary", bg: "bg-primary/10" },
          { label: isBn ? "জরুরি" : "Urgent", value: stats.urgent, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isBn ? "টিকেট নম্বর, বিষয় বা ক্লায়েন্ট দিয়ে সার্চ..." : "Search by ticket#, subject or client..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden"
        >
          <option value="all">{isBn ? "সকল স্ট্যাটাস" : "All Status"}</option>
          {ticketStatuses.map(s => {
            const cfg = statusConfig[s];
            return <option key={s} value={s}>{isBn ? cfg?.label_bn : cfg?.label_en}</option>;
          })}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden"
        >
          <option value="all">{isBn ? "সকল প্রায়োরিটি" : "All Priority"}</option>
          {(["low", "medium", "high", "urgent"] as const).map(p => {
            const cfg = priorityConfig[p];
            return <option key={p} value={p}>{isBn ? cfg?.label_bn : cfg?.label_en}</option>;
          })}
        </select>
      </div>

      {/* Tickets - Card based for better mobile */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={isBn ? "কোনো টিকেট পাওয়া যায়নি" : "No tickets found"}
            description={isBn ? "সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন" : "Try adjusting your search filters"}
          />
        )}
        {paged.map((t, i) => {
          const sc = statusConfig[t.status] || statusConfig.open;
          const pc = priorityConfig[t.priority] || priorityConfig.medium;
          const timeSince = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 3600000);
          const timeLabel = timeSince < 1 ? (isBn ? "কিছুক্ষণ আগে" : "Just now")
            : timeSince < 24 ? `${timeSince}${isBn ? " ঘণ্টা আগে" : "h ago"}`
            : `${Math.floor(timeSince / 24)}${isBn ? " দিন আগে" : "d ago"}`;

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => openTicket(t)}
              className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-md hover:bg-secondary/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl ${sc.bg} shrink-0 mt-0.5`}>
                    <HeadphonesIcon className={`w-4 h-4 ${sc.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[10px] text-muted-foreground">#{t.ticket_number}</span>
                      <Badge variant={sc.variant} className="text-[10px]">{isBn ? sc.label_bn : sc.label_en}</Badge>
                      <Badge variant={pc.variant} className="text-[10px]">{isBn ? pc.label_bn : pc.label_en}</Badge>
                      <Badge variant="outline" className="text-[10px]">{t.department}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{t.subject}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.profiles?.full_name || t.user_id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>{timeLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                  <select
                    value={t.status}
                    onChange={e => updateStatus(t.id, e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/50 text-foreground outline-hidden"
                  >
                    {ticketStatuses.map(s => {
                      const cfg = statusConfig[s];
                      return <option key={s} value={s}>{isBn ? cfg?.label_bn : cfg?.label_en}</option>;
                    })}
                  </select>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <DataPagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(n) => { setPageSize(n); setPage(1); }}
        />
      )}
    </div>
  );
};

export default AdminTickets;
