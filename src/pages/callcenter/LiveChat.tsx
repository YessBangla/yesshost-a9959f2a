import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, RefreshCw, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
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
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.status === "open" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
            </button>
          ))}
          {chats.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">{bn ? "কোনো চ্যাট নেই" : "No chats"}</p>}
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 glass-card rounded-xl flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-3 border-b border-border/50 text-sm font-semibold text-foreground">
                {chats.find(c => c.id === selectedChat)?.visitor_name}
              </div>
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
                  placeholder={bn ? "উত্তর লিখুন..." : "Type reply..."} className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
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
