import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveChatMessages, startLiveChat, sendLiveChatMessage } from "@/lib/dashboard.functions";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Smile, Phone, PhoneCall, Mail } from "lucide-react";
import { Link } from "@/lib/router-compat";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import LiveChatCallUI from "@/components/LiveChatCallUI";

const CHAT_STORAGE_KEY = "yesshost_live_chat_id";
const CHAT_OPEN_KEY = "yesshost_live_chat_open";

type Message = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

const LiveChatWidget = () => {
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(CHAT_OPEN_KEY) === "true",
  );
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [started, setStarted] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const {
    callStatus,
    formattedDuration,
    isMuted,
    startCall,
    endCall: endWebRTCCall,
    toggleMute,
  } = useWebRTCCall({ chatId, role: "visitor" });

  // Persist open state
  useEffect(() => {
    localStorage.setItem(CHAT_OPEN_KEY, open ? "true" : "false");
  }, [open]);

  // Restore chat from localStorage; history is loaded through the server so the
  // transcript is identical no matter which domain the widget is served from.
  useEffect(() => {
    const savedId = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedId) {
      setChatId(savedId);
      setStarted(true);
    }
  }, []);

  const loadMessages = useServerFn(getLiveChatMessages);
  const startChatFn = useServerFn(startLiveChat);
  const sendChatMessage = useServerFn(sendLiveChatMessage);
  const historyQuery = useQuery({
    queryKey: ["live-chat", "messages", chatId],
    queryFn: () => loadMessages({ data: { chatId: chatId as string } }),
    enabled: !!chatId,
    staleTime: 3_000,
    // Visitor transcripts are private now, so the widget polls the server
    // instead of relying on an anonymous realtime subscription.
    refetchInterval: open ? 5_000 : false,
  });

  // Hydrate the server-rendered transcript into local state before the first
  // interaction, then let realtime append to it.
  const serverMessages = historyQuery.data?.messages;
  useEffect(() => {
    if (!serverMessages) return;
    setMessages((prev) => {
      const seen = new Set(serverMessages.map((m) => m.id));
      return [...serverMessages, ...prev.filter((m) => !seen.has(m.id))];
    });
  }, [serverMessages]);

  // Realtime subscription + typing indicator
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`live-chat-${chatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "live_chat_messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
          return [...prev, payload.new as Message];
        });
        if ((payload.new as Message).sender_type === "admin") setAdminTyping(false);
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.sender === "admin") {
          setAdminTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  const broadcastTyping = useCallback(() => {
    if (!chatId) return;
    const channel = supabase.channel(`live-chat-${chatId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: "visitor" },
    }).catch(() => {});
  }, [chatId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startChat = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    try {
      const { chatId: id } = await startChatFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          greeting: bn
            ? `হ্যালো ${name.trim()}! 👋 আপনাকে স্বাগতম। কিভাবে সাহায্য করতে পারি?`
            : `Hello ${name.trim()}! 👋 Welcome! How can we help you?`,
        },
      });
      localStorage.setItem(CHAT_STORAGE_KEY, id);
      setChatId(id);
      setStarted(true);
    } catch (err) {
      console.error("Could not start chat:", err);
    }
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || !chatId) return;
    setInput("");
    setSending(true);
    try {
      const { message } = await sendChatMessage({ data: { chatId, message: msg } });
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err) {
      console.error("Could not send message:", err);
    } finally {
      setSending(false);
    }

    // Trigger AI auto-reply
    setAdminTyping(true);
    try {
      await supabase.functions.invoke("chat-ai-reply", {
        body: { chat_id: chatId, message: msg, lang },
      });
      await historyQuery.refetch();
    } catch (err) {
      console.error("AI reply error:", err);
    } finally {
      setAdminTyping(false);
    }
  };

  const endChat = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setChatId(null);
    setMessages([]);
    setStarted(false);
    setName("");
    setEmail("");
    setPhone("");
    setOpen(false);
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString(bn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Contact popup button - above chat button */}
      <AnimatePresence>
        {!open && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.05 }}
              className="fixed bottom-[10rem] right-4 md:bottom-[6rem] md:right-6 z-50"
            >
              <Link
                to="/contact"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary border border-border text-foreground text-xs font-semibold shadow-lg hover:border-primary/40 hover:bg-secondary/80 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                {bn ? "যোগাযোগ" : "Contact"}
              </Link>
            </motion.div>

            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setOpen(true)}
              data-livechat-trigger
              className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full gradient-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden glass-card-elevated border border-border shadow-2xl flex flex-col"
            style={{ height: "460px" }}
          >
            {/* Header */}
            <div className="gradient-primary p-4 flex items-center justify-between shrink-0">
              <div>
                <p className="text-primary-foreground font-bold text-sm">Yess Host Support</p>
                <p className="text-primary-foreground/70 text-[10px]">
                  {bn ? "সাধারণত কয়েক মিনিটে উত্তর দিই" : "We typically reply in a few minutes"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {started && callStatus === "idle" && (
                  <button
                    onClick={startCall}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-primary-foreground transition-colors"
                    title={bn ? "ভয়েস কল" : "Voice Call"}
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                )}
                {started && (
                  <button onClick={endChat} className="p-1.5 rounded-lg hover:bg-white/10 text-primary-foreground/70 text-[10px] font-medium transition-colors">
                    {bn ? "শেষ" : "End"}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-primary-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Call UI */}
            {started && (
              <LiveChatCallUI
                callStatus={callStatus}
                formattedDuration={formattedDuration}
                isMuted={isMuted}
                onStartCall={startCall}
                onEndCall={endWebRTCCall}
                onToggleMute={toggleMute}
                bn={bn}
              />
            )}

            {!started ? (
              /* Pre-chat form */
              <div className="flex-1 p-5 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{bn ? "চ্যাট শুরু করুন" : "Start a Chat"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{bn ? "আপনার তথ্য দিন" : "Enter your details"}</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={bn ? "আপনার নাম *" : "Your name *"}
                    maxLength={100}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={bn ? "ইমেইল *" : "Email *"}
                    maxLength={255}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={bn ? "ফোন নাম্বার *" : "Phone number *"}
                    maxLength={20}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onClick={startChat}
                    disabled={!name.trim() || !email.trim() || !phone.trim()}
                    className="w-full py-2.5 gradient-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {bn ? "চ্যাট শুরু করুন" : "Start Chat"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === "visitor" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                        m.sender_type === "visitor"
                          ? "gradient-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}>
                        <p className="break-words whitespace-pre-wrap">{m.message}</p>
                        <p className={`text-[9px] mt-1 ${m.sender_type === "visitor" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {adminTyping && (
                    <div className="flex justify-start px-1 pb-1">
                      <div className="bg-secondary rounded-2xl rounded-bl-md px-3.5 py-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border shrink-0 relative">
                  {showEmoji && (
                    <div className="absolute bottom-14 left-2 right-2 z-10">
                      <Picker data={data} onEmojiSelect={(e: any) => { setInput(prev => prev + e.native); setShowEmoji(false); }} theme="dark" previewPosition="none" skinTonePosition="none" maxFrequentRows={1} perLine={7} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-xl hover:bg-secondary/70 text-muted-foreground transition-colors shrink-0">
                      <Smile className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      onFocus={() => setShowEmoji(false)}
                      placeholder={bn ? "মেসেজ লিখুন..." : "Type a message..."}
                      maxLength={1000}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !input.trim()}
                      className="p-2.5 rounded-xl gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChatWidget;
