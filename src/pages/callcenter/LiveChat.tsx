import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw, MessageCircle, Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Mail, Search, ShoppingCart, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import { useRingtone } from "@/hooks/useRingtone";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router-compat";
import { StaffPageHeader } from "@/components/staff/StaffConsole";

const CallCenterLiveChat = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [chats, setChats] = useState<Tables<"live_chats">[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Tables<"live_chat_messages">[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const [customerOrders, setCustomerOrders] = useState<Tables<"orders">[]>([]);
  const msgEnd = useRef<HTMLDivElement>(null);

  const { startRingtone, stopRingtone } = useRingtone();

  const {
    callStatus,
    formattedDuration,
    isMuted,
    acceptCall,
    endCall,
    toggleMute,
  } = useWebRTCCall({ chatId: selectedChat, role: "admin" });

  // Play/stop ringtone on ringing
  useEffect(() => {
    if (callStatus === "ringing") {
      startRingtone();
      toast({
        title: bn ? "ইনকামিং কল!" : "Incoming Call!",
        description: bn
          ? `${chats.find(c => c.id === selectedChat)?.visitor_name || "ভিজিটর"} কল করছেন`
          : `${chats.find(c => c.id === selectedChat)?.visitor_name || "Visitor"} is calling`,
      });
    } else {
      stopRingtone();
    }
  }, [callStatus]);

  const fetchChats = async () => {
    const { data } = await supabase.from("live_chats").select("*").order("updated_at", { ascending: false });
    setChats(data || []);
    setLoading(false);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase.from("live_chat_messages").select("*").eq("chat_id", chatId).order("created_at");
    setMessages(data || []);
    setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { if (selectedChat) fetchMessages(selectedChat); }, [selectedChat]);

  useEffect(() => {
    const chat = chats.find((item) => item.id === selectedChat);
    if (!chat?.user_id) { setCustomerOrders([]); return; }
    supabase.from("orders").select("*").eq("user_id", chat.user_id).order("created_at", { ascending: false }).limit(3).then(({ data }) => setCustomerOrders(data || []));
  }, [selectedChat, chats]);

  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase.channel(`cc-chat-${selectedChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `chat_id=eq.${selectedChat}` },
        (payload) => setMessages(prev => [...prev, payload.new as Tables<"live_chat_messages">]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChat]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedChat) return;
    await supabase.from("live_chat_messages").insert({ chat_id: selectedChat, message: reply, sender_type: "admin" });
    setReply("");
  };

  if (loading) return <div className="grid gap-3 lg:grid-cols-[280px_1fr_300px]">{[0,1,2].map((column) => <div key={column} className="staff-panel space-y-3 p-4">{[0,1,2,3,4].map((row) => <Skeleton key={row} className="h-14" />)}</div>)}</div>;

  const selectedChatData = chats.find(c => c.id === selectedChat);
  const filteredChats = chats.filter((chat) => {
    const query = search.toLowerCase();
    return (status === "all" || chat.status === status) && [chat.visitor_name, chat.visitor_email, chat.visitor_phone].some((value) => value?.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-4">
      <StaffPageHeader title={bn ? "লাইভ কথোপকথন" : "Live Conversations"} description={bn ? "গ্রাহক কিউ, কল এবং অ্যাকাউন্ট তথ্য একই জায়গায়" : "Customer queue, calls and account context in one workspace"} actions={<Button variant="outline" onClick={fetchChats}><RefreshCw />{bn ? "রিফ্রেশ" : "Refresh"}</Button>} />

      <div className="grid grid-cols-1 overflow-hidden staff-panel lg:grid-cols-[280px_minmax(360px,1fr)_300px] lg:h-[calc(100vh-190px)]">
        {/* Chat list */}
        <div className="flex min-h-[320px] flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r">
          <div className="space-y-2 border-b border-border bg-secondary/30 p-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={bn ? "কিউ খুঁজুন..." : "Search queue..."} className="pl-9" /></div><div className="grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">{["open","all"].map((key) => <Button key={key} size="sm" variant={status === key ? "default" : "ghost"} onClick={() => setStatus(key)}>{key === "open" ? (bn ? "খোলা" : "Open") : (bn ? "সব" : "All")}</Button>)}</div></div>
          <div className="overflow-auto">{filteredChats.map(c => (
            <button key={c.id} onClick={() => setSelectedChat(c.id)}
              className={`min-h-[72px] w-full border-b border-border p-3 text-left transition-colors hover:bg-secondary/40 ${selectedChat === c.id ? "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}>
              <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-foreground">{c.visitor_name}</p><span className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleTimeString(bn ? "bn-BD" : "en-US", {hour:"2-digit",minute:"2-digit"})}</span></div>
              <p className="truncate text-xs text-muted-foreground">{c.visitor_email || c.visitor_phone || "—"}</p>
              <Badge className={`mt-1 border-0 ${c.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{c.status}</Badge>
            </button>
          ))}
          {filteredChats.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{bn ? "কোনো চ্যাট পাওয়া যায়নি" : "No conversations found"}</p>}</div>
        </div>

        {/* Messages */}
        <div className="flex min-h-[520px] flex-col border-b border-border lg:border-b-0 lg:border-r">
          {selectedChat ? (
            <>
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <div><span className="text-sm font-semibold text-foreground">{selectedChatData?.visitor_name}</span><p className="text-[10px] text-success">{selectedChatData?.status === "open" ? (bn ? "অনলাইন • যাচাইকৃত সেশন" : "Online • Active session") : (bn ? "কথোপকথন বন্ধ" : "Conversation closed")}</p></div>
                {/* Call status indicator in header */}
                {callStatus === "idle" && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {bn ? "কল অপেক্ষায়" : "Waiting for call"}
                  </span>
                )}
              </div>

              {/* Incoming call banner */}
              <AnimatePresence>
                {callStatus === "ringing" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-4 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <PhoneIncoming className="w-5 h-5 text-primary animate-pulse" />
                          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30 animate-ping" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {bn ? "ইনকামিং ভয়েস কল" : "Incoming Voice Call"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedChatData?.visitor_name} {bn ? "কল করছেন..." : "is calling..."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button
                          onClick={acceptCall}
                           className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          <Phone className="w-4 h-4" />
                          {bn ? "রিসিভ" : "Accept"}
                         </Button>
                         <Button
                          onClick={endCall}
                           variant="destructive"
                        >
                          <PhoneOff className="w-4 h-4" />
                          {bn ? "বাতিল" : "Decline"}
                         </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active call bar */}
              <AnimatePresence>
                {callStatus === "connected" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{bn ? "কল চলছে" : "On Call"}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{formattedDuration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={toggleMute}
                          className={`p-2 rounded-full transition-colors ${isMuted ? "bg-destructive/15 text-destructive" : "bg-secondary hover:bg-secondary/80 text-muted-foreground"}`}
                          aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={endCall}
                          className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          aria-label="End call"
                        >
                          <PhoneOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Call ended notice */}
              <AnimatePresence>
                {callStatus === "ended" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-2 bg-muted/50 border-b border-border/50 text-center"
                  >
                    <p className="text-xs text-muted-foreground">{bn ? "কল শেষ হয়েছে" : "Call ended"}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-xl text-sm ${m.sender_type === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground"}`}>
                      {m.message}
                      <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString(bn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
                <div ref={msgEnd} />
              </div>
               <div className="flex gap-2 border-t border-border p-3">
                 <Input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder={bn ? "উত্তর লিখুন..." : "Type reply..."} className="h-11" />
                 <Button onClick={sendReply} disabled={!reply.trim()} aria-label={bn ? "পাঠান" : "Send reply"}><Send /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="w-12 h-12 opacity-30" />
              <p className="text-sm">{bn ? "একটি চ্যাট সিলেক্ট করুন" : "Select a chat"}</p>
            </div>
          )}
        </div>
        <aside className="bg-secondary/20 p-4"><p className="staff-eyebrow">{bn ? "গ্রাহক প্রোফাইল" : "Customer profile"}</p>{selectedChatData ? <div className="mt-4 space-y-5"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary"><UserRound /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{selectedChatData.visitor_name}</p><p className="text-xs text-muted-foreground">{selectedChatData.user_id ? (bn ? "নিবন্ধিত গ্রাহক" : "Registered customer") : (bn ? "ভিজিটর" : "Visitor")}</p></div></div><div className="space-y-2 border-y border-border py-4 text-xs">{selectedChatData.visitor_email && <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /><span className="truncate">{selectedChatData.visitor_email}</span></p>}{selectedChatData.visitor_phone && <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" />{selectedChatData.visitor_phone}</p>}</div><div><div className="mb-2 flex items-center justify-between"><p className="staff-eyebrow">{bn ? "সাম্প্রতিক অর্ডার" : "Recent orders"}</p><Button asChild variant="link" size="sm"><Link to="/call-center/orders">{bn ? "সব" : "All"}</Link></Button></div>{customerOrders.length ? <div className="space-y-2">{customerOrders.map((order) => <div key={order.id} className="rounded-md border border-border bg-card p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">{order.order_number}</p><Badge variant="secondary">{order.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">৳{Number(order.total_bdt).toLocaleString(bn ? "bn-BD" : "en-US")}</p></div>)}</div> : <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">{bn ? "কোনো যুক্ত অর্ডার নেই" : "No linked orders"}</p>}</div><Button asChild variant="outline" className="w-full"><Link to="/call-center/tickets"><ShoppingCart />{bn ? "সাপোর্ট টিকেট দেখুন" : "View support tickets"}</Link></Button></div> : <div className="flex min-h-60 items-center justify-center text-center text-sm text-muted-foreground">{bn ? "গ্রাহকের তথ্য দেখতে কথোপকথন বাছুন" : "Select a conversation to view customer context"}</div>}</aside>
      </div>
    </div>
  );
};

export default CallCenterLiveChat;
