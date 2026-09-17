import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw, MessageCircle, Phone, PhoneOff, PhoneIncoming, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import { useRingtone } from "@/hooks/useRingtone";
import type { Tables } from "@/integrations/supabase/types";

const CallCenterLiveChat = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [chats, setChats] = useState<Tables<"live_chats">[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Tables<"live_chat_messages">[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const selectedChatData = chats.find(c => c.id === selectedChat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{bn ? "লাইভ চ্যাট" : "Live Chat"}</h1>
        <button onClick={fetchChats} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Chat list */}
        <div className="glass-card rounded-xl overflow-auto">
          <div className="p-3 border-b border-border/50 text-sm font-semibold text-foreground">{bn ? "চ্যাট তালিকা" : "Chat List"} ({chats.length})</div>
          {chats.map(c => (
            <button key={c.id} onClick={() => setSelectedChat(c.id)}
              className={`w-full text-left p-3 border-b border-border/30 hover:bg-secondary/40 transition-all ${selectedChat === c.id ? "bg-primary/10" : ""}`}>
              <p className="text-sm font-medium text-foreground">{c.visitor_name}</p>
              <p className="text-xs text-muted-foreground">{c.visitor_email || c.visitor_phone || "—"}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${c.status === "open" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
            </button>
          ))}
          {chats.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">{bn ? "কোনো চ্যাট নেই" : "No chats"}</p>}
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 glass-card rounded-xl flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{selectedChatData?.visitor_name}</span>
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
                        <button
                          onClick={acceptCall}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                        >
                          <Phone className="w-4 h-4" />
                          {bn ? "রিসিভ" : "Accept"}
                        </button>
                        <button
                          onClick={endCall}
                          className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-1.5"
                        >
                          <PhoneOff className="w-4 h-4" />
                          {bn ? "বাতিল" : "Decline"}
                        </button>
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
              <div className="p-3 border-t border-border/50 flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()}
                  placeholder={bn ? "উত্তর লিখুন..." : "Type reply..."} className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <button onClick={sendReply} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground"><Send className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="w-12 h-12 opacity-30" />
              <p className="text-sm">{bn ? "একটি চ্যাট সিলেক্ট করুন" : "Select a chat"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallCenterLiveChat;
