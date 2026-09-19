import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Mail, MailOpen, Trash2, Eye, Send, ArrowLeft, Clock, User, AtSign,
  RefreshCw, Download, Inbox, TriangleAlert, Timer,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import DataPagination from "@/components/DataPagination";
import { Button } from "@/components/ui/button";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import {
  StaffPageHeader, StaffMetricStrip, StaffSearch, StaffLoading, StaffEmpty,
  type StaffMetric,
} from "@/components/staff/StaffConsole";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ContactMessages = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError(bn ? "মেসেজ লোড করা যায়নি" : "Could not load messages");
    } else if (data) {
      setMessages(data as ContactMessage[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const markAsRead = async (msg: ContactMessage) => {
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
    setSelected(msg.is_read ? msg : { ...msg, is_read: true });
    setReplyText("");
  };

  const deleteMessage = async (id: string) => {
    const { error: err } = await supabase.from("contact_messages").delete().eq("id", id);
    if (err) {
      toast.error(bn ? "ডিলিট করতে সমস্যা হয়েছে" : "Failed to delete");
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success(bn ? "মেসেজ ডিলিট হয়েছে" : "Message deleted");
    }
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    toast.success(bn ? `${selected.email}-এ রিপ্লাই পাঠানো হয়েছে (সিমুলেটেড)` : `Reply sent to ${selected.email} (simulated)`);
    setReplyText("");
    setSending(false);
  };

  const filtered = useMemo(() => messages.filter(m => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "unread" && !m.is_read) || (filter === "read" && m.is_read);
    return matchSearch && matchFilter;
  }), [messages, search, filter]);

  useEffect(() => { setPage(1); }, [search, filter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const unreadCount = messages.filter(m => !m.is_read).length;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = messages.filter(m => new Date(m.created_at).getTime() >= dayAgo).length;
  const readRate = messages.length ? Math.round(((messages.length - unreadCount) / messages.length) * 100) : 0;

  const metrics: StaffMetric[] = [
    { label: bn ? "মোট মেসেজ" : "Total messages", value: messages.length, detail: bn ? "সব সময়ের" : "all time", icon: Inbox, tone: "primary" },
    { label: bn ? "অপঠিত" : "Unread", value: unreadCount, detail: bn ? "উত্তর প্রয়োজন" : "needs a reply", icon: TriangleAlert, tone: unreadCount ? "warning" : "success" },
    { label: bn ? "শেষ ২৪ ঘণ্টা" : "Last 24 hours", value: last24, detail: bn ? "নতুন এসেছে" : "newly received", icon: Timer, tone: "primary" },
    { label: bn ? "পঠিত হার" : "Read rate", value: `${readRate}%`, detail: bn ? "পর্যালোচিত" : "reviewed", icon: MailOpen, tone: readRate >= 80 ? "success" : "warning" },
  ];

  const exportCsv = () => {
    downloadCsv(
      `contact-messages-${csvDate(new Date().toISOString())}`,
      ["Date", "Name", "Email", "Subject", "Status", "Message"],
      filtered.map(m => [csvDate(m.created_at), m.name, m.email, m.subject, m.is_read ? "Read" : "Unread", m.message]),
    );
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title={bn ? "কন্টাক্ট অপারেশনস" : "Contact Operations"}
        description={bn
          ? "ওয়েবসাইট থেকে আসা সব বার্তা পর্যালোচনা করুন এবং দ্রুত উত্তর দিন"
          : "Review every website enquiry and respond without leaving the console"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-11 gap-2" onClick={fetchMessages} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              {bn ? "রিফ্রেশ" : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" className="h-11 gap-2" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        }
      />

      <StaffMetricStrip metrics={metrics} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <StaffSearch
          value={search}
          onChange={setSearch}
          placeholder={bn ? "নাম, ইমেইল, বিষয় বা বার্তা খুঁজুন..." : "Search name, email, subject or message..."}
        />
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-11 px-4 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "all" ? (bn ? "সব" : "All") : f === "unread" ? (bn ? "অপঠিত" : "Unread") : (bn ? "পঠিত" : "Read")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Message List */}
        <div className={`lg:col-span-2 space-y-2 ${selected ? "hidden lg:block" : ""}`}>
          {loading ? (
            <StaffLoading rows={5} />
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <StaffEmpty
                icon={Mail}
                title={bn ? "কোনো মেসেজ নেই" : "No messages found"}
                description={bn
                  ? "সার্চ বা ফিল্টার বদলে দেখুন, নতুন বার্তা এলে এখানে দেখা যাবে"
                  : "Adjust your search or filter — new enquiries will appear here"}
              />
            </div>
          ) : (
            paged.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => markAsRead(msg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === msg.id
                    ? "border-primary bg-primary/5 shadow-xs"
                    : !msg.is_read
                    ? "border-border bg-card shadow-xs"
                    : "border-border/50 bg-card/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${!msg.is_read ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {msg.is_read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${!msg.is_read ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {msg.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {format(new Date(msg.created_at), "dd MMM")}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${!msg.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{msg.message}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {!loading && filtered.length > 0 && (
            <DataPagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(n) => { setPageSize(n); setPage(1); }}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          )}
        </div>

        {/* Message Detail */}
        <div className={`lg:col-span-3 ${!selected ? "hidden lg:block" : ""}`}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="p-5 border-b border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setSelected(null)}
                      className="lg:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4" /> {bn ? "ফিরে যান" : "Back"}
                    </button>
                    <button
                      onClick={() => deleteMessage(selected.id)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                      title={bn ? "ডিলিট" : "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-3">{selected.subject}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {selected.name}</span>
                    <span className="flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5" /> {selected.email}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(new Date(selected.created_at), "dd MMM yyyy, hh:mm a")}</span>
                  </div>
                </div>

                <div className="p-5 min-h-[120px]">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>

                <div className="p-5 border-t border-border/50 bg-secondary/20">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {bn ? "রিপ্লাই পাঠান" : "Send Reply"}
                  </h3>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={bn ? `${selected.name}-কে রিপ্লাই লিখুন...` : `Write a reply to ${selected.name}...`}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                    <p className="text-xs text-muted-foreground">
                      {bn ? `রিপ্লাই ${selected.email}-এ পাঠানো হবে` : `Reply will be sent to ${selected.email}`}
                    </p>
                    <Button onClick={sendReply} disabled={sending || !replyText.trim()} className="h-11 gap-2">
                      <Send className="w-4 h-4" />
                      {bn ? "পাঠান" : "Send"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/50">
                <StaffEmpty
                  icon={Eye}
                  title={bn ? "একটি মেসেজ সিলেক্ট করুন" : "Select a message"}
                  description={bn
                    ? "বাম পাশের তালিকা থেকে একটি বার্তা বেছে নিলে বিস্তারিত এখানে দেখা যাবে"
                    : "Pick an enquiry from the list to read it and reply here"}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
