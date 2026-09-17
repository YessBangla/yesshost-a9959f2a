import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, PhoneMissed, Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatSummary {
  id: string;
  visitor_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
}

interface CallSummary {
  id: string;
  chat_id: string;
  caller_role: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  status: string;
  visitor_name?: string;
}

interface Props {
  userId: string | undefined;
  bn: boolean;
}

const ChatCallSummaryWidget = ({ userId, bn }: Props) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      // Fetch user's recent chats
      const { data: chatData } = await supabase
        .from("live_chats")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5);

      const chatSummaries: ChatSummary[] = [];
      for (const chat of chatData || []) {
        const { count } = await supabase
          .from("live_chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("chat_id", chat.id);

        const { data: lastMsg } = await supabase
          .from("live_chat_messages")
          .select("message")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        chatSummaries.push({
          ...chat,
          message_count: count || 0,
          last_message: lastMsg?.message || null,
        });
      }
      setChats(chatSummaries);

      // Fetch call history for user's chats
      if (chatData && chatData.length > 0) {
        const chatIds = chatData.map((c) => c.id);
        const { data: callData } = await supabase
          .from("call_history")
          .select("*, live_chats(visitor_name)")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: false })
          .limit(5);

        setCalls(
          (callData || []).map((c: any) => ({
            ...c,
            visitor_name: c.live_chats?.visitor_name,
          }))
        );
      }

      setLoading(false);
    };
    fetch();
  }, [userId]);

  const formatDuration = (s: number) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const ago = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return bn ? "এইমাত্র" : "Just now";
    if (mins < 60) return bn ? `${mins} মি. আগে` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return bn ? `${hrs} ঘ. আগে` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return bn ? `${days} দিন আগে` : `${days}d ago`;
  };

  const callStatusLabel = (s: string) => {
    const map: Record<string, { label: string; labelBn: string; cls: string }> = {
      completed: { label: "Completed", labelBn: "সম্পন্ন", cls: "bg-emerald-500/10 text-emerald-600" },
      missed: { label: "Missed", labelBn: "মিসড", cls: "bg-destructive/10 text-destructive" },
      connected: { label: "Connected", labelBn: "সংযুক্ত", cls: "bg-blue-500/10 text-blue-600" },
      ringing: { label: "Ringing", labelBn: "রিংিং", cls: "bg-amber-500/10 text-amber-600" },
    };
    const c = map[s] || map.missed;
    return <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${c.cls}`}>{bn ? c.labelBn : c.label}</span>;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded-sm bg-muted animate-pulse" />
          <div className="w-32 h-4 rounded-sm bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = chats.length > 0 || calls.length > 0;

  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Recent Chats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {bn ? "সাম্প্রতিক চ্যাট" : "Recent Chats"}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {chats.length}
          </span>
        </div>
        <div className="p-3">
          {chats.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">{bn ? "কোনো চ্যাট নেই" : "No chats yet"}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {chat.visitor_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{chat.visitor_name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                        chat.status === "open" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                      }`}>
                        {chat.status}
                      </span>
                    </div>
                    {chat.last_message && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{chat.last_message}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                        <MessageCircle className="w-2.5 h-2.5" /> {chat.message_count}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {ago(chat.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Calls */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {bn ? "সাম্প্রতিক কল" : "Recent Calls"}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {calls.length}
          </span>
        </div>
        <div className="p-3">
          {calls.length === 0 ? (
            <div className="text-center py-6">
              <Phone className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">{bn ? "কোনো কল নেই" : "No calls yet"}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    call.status === "completed" ? "bg-emerald-500/10" : "bg-destructive/10"
                  }`}>
                    {call.status === "missed" ? (
                      <PhoneMissed className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {call.visitor_name || (bn ? "ভিজিটর" : "Visitor")}
                      </p>
                      {callStatusLabel(call.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {formatDuration(call.duration_seconds)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {ago(call.started_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatCallSummaryWidget;
