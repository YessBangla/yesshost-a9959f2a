import { useEffect, useState, useRef, useCallback } from "react";
import { MessageCircle, Send, Loader2, User, Clock, X, BellRing, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
};

const showBrowserNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

type Chat = {
  id: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  chat_id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

const AdminLiveChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch all chats
  useEffect(() => {
    supabase
      .from("live_chats")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setChats((data as Chat[]) || []);
        setLoading(false);
      });

    // Realtime for new chats & visitor messages
    const chatChannel = supabase
      .channel("admin-live-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chats" }, () => {
        supabase.from("live_chats").select("*").order("updated_at", { ascending: false })
          .then(({ data }) => setChats((data as Chat[]) || []));
      })
      .subscribe();

    const msgChannel = supabase
      .channel("admin-new-visitor-msgs")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "live_chat_messages",
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_type === "visitor") {
          playNotificationSound();
          showBrowserNotification("নতুন মেসেজ", msg.message.slice(0, 100));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(msgChannel);
    };
  }, []);

  // Load messages when chat selected
  useEffect(() => {
    if (!selected) { setMessages([]); setVisitorTyping(false); return; }
    supabase
      .from("live_chat_messages")
      .select("*")
      .eq("chat_id", selected.id)
      .order("created_at")
      .then(({ data }) => setMessages((data as Message[]) || []));

    const channel = supabase
      .channel(`admin-chat-${selected.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "live_chat_messages",
        filter: `chat_id=eq.${selected.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
          return [...prev, payload.new as Message];
        });
        if ((payload.new as Message).sender_type === "visitor") setVisitorTyping(false);
      })
      .subscribe();

    // Typing indicator channel (broadcast)
    const typingChannel = supabase
      .channel(`live-chat-${selected.id}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.sender === "visitor") {
          setVisitorTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setVisitorTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
    };
  }, [selected?.id]);

  const broadcastAdminTyping = useCallback(() => {
    if (!selected) return;
    supabase.channel(`live-chat-${selected.id}`).send({
      type: "broadcast",
      event: "typing",
      payload: { sender: "admin" },
    });
  }, [selected?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!input.trim() || !selected) return;
    setSending(true);
    await supabase.from("live_chat_messages").insert({
      chat_id: selected.id,
      sender_type: "admin",
      message: input.trim(),
    });
    setInput("");
    setSending(false);
  };

  const closeChat = async (chatId: string) => {
    await supabase.from("live_chats").update({ status: "closed" }).eq("id", chatId);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: "closed" } : c));
    if (selected?.id === chatId) setSelected(prev => prev ? { ...prev, status: "closed" } : null);
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Chat</h1>
        <p className="text-sm text-muted-foreground">ভিজিটরদের সাথে রিয়েল-টাইম চ্যাট</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 180px)" }}>
        {/* Chat list */}
        <div className="glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border shrink-0">
            <p className="text-sm font-semibold text-foreground">{chats.length} চ্যাট</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">কোনো চ্যাট নেই</p>
              </div>
            ) : (
              chats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${selected?.id === c.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {c.visitor_name}
                    </span>
                    <Badge variant={c.status === "open" ? "default" : "secondary"} className="text-[9px]">
                      {c.status === "open" ? "সক্রিয়" : "বন্ধ"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground truncate">{c.visitor_email || "—"} • {c.visitor_phone || ""}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {timeAgo(c.updated_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat messages */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">একটি চ্যাট নির্বাচন করুন</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <p className="text-sm font-bold text-foreground">{selected.visitor_name}</p>
                  <p className="text-[10px] text-muted-foreground">{selected.visitor_email || "ইমেইল নেই"} • {selected.visitor_phone || "ফোন নেই"} • {formatTime(selected.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === "open" && (
                    <button onClick={() => closeChat(selected.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
                      <X className="w-3 h-3" /> বন্ধ করুন
                    </button>
                  )}
                  <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                      m.sender_type === "admin"
                        ? "gradient-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}>
                      <p className="break-words whitespace-pre-wrap">{m.message}</p>
                      <p className={`text-[9px] mt-1 ${m.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {visitorTyping && (
                  <div className="flex justify-start px-4 pb-2">
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground mr-1">টাইপ করছে</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Reply input */}
              {selected.status === "open" && (
                <div className="p-3 border-t border-border shrink-0 relative">
                  {showEmoji && (
                    <div className="absolute bottom-14 right-2 z-10">
                      <Picker data={data} onEmojiSelect={(e: any) => { setInput(prev => prev + e.native); setShowEmoji(false); }} theme="dark" previewPosition="none" skinTonePosition="none" maxFrequentRows={1} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-xl hover:bg-secondary/70 text-muted-foreground transition-colors shrink-0">
                      <Smile className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => { setInput(e.target.value); broadcastAdminTyping(); }}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                      onFocus={() => setShowEmoji(false)}
                      placeholder="উত্তর লিখুন..."
                      maxLength={1000}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !input.trim()}
                      className="p-2.5 rounded-xl gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLiveChat;
