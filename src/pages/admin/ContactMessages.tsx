import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, MailOpen, Trash2, Eye, Send, Search, ArrowLeft, Clock, User, AtSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import DataPagination from "@/components/DataPagination";

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
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setMessages(data as ContactMessage[]);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (msg: ContactMessage) => {
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
    setSelected(msg.is_read ? msg : { ...msg, is_read: true });
    setReplyText("");
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
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
    // For now, show a toast since email sending requires additional setup
    toast.success(bn ? `${selected.email}-এ রিপ্লাই পাঠানো হয়েছে (সিমুলেটেড)` : `Reply sent to ${selected.email} (simulated)`);
    setReplyText("");
    setSending(false);
  };

  const filtered = messages.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "unread" && !m.is_read) || (filter === "read" && m.is_read);
    return matchSearch && matchFilter;
  });

  useEffect(() => { setPage(1); }, [search, filter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {bn ? "কন্টাক্ট মেসেজ" : "Contact Messages"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bn ? `মোট ${messages.length}টি মেসেজ, ${unreadCount}টি অপঠিত` : `${messages.length} total, ${unreadCount} unread`}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={bn ? "নাম, ইমেইল বা বিষয় দিয়ে খুঁজুন..." : "Search by name, email or subject..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f === "all" ? (bn ? "সব" : "All") : f === "unread" ? (bn ? "অপঠিত" : "Unread") : (bn ? "পঠিত" : "Read")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Message List */}
        <div className={`lg:col-span-2 space-y-2 ${selected ? "hidden lg:block" : ""}`}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{bn ? "কোনো মেসেজ পাওয়া যায়নি" : "No messages found"}</p>
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
                {/* Detail Header */}
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
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
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

                {/* Message Body */}
                <div className="p-5 min-h-[120px]">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>

                {/* Reply Section */}
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
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      {bn ? `রিপ্লাই ${selected.email}-এ পাঠানো হবে` : `Reply will be sent to ${selected.email}`}
                    </p>
                    <button
                      onClick={sendReply}
                      disabled={sending || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {bn ? "পাঠান" : "Send"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/50 flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Eye className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">{bn ? "একটি মেসেজ সিলেক্ট করুন" : "Select a message to view"}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
