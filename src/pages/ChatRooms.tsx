import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, Users, Lock, CheckCircle, Clock, ArrowLeft, Smile } from "lucide-react";
import { Link } from "@/lib/router-compat";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

type Room = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type MemberStatus = "pending" | "approved" | "rejected" | null;

type RoomMessage = {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

const ChatRooms = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatus>>({});
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch rooms
  useEffect(() => {
    supabase
      .from("chat_rooms")
      .select("*")
      .eq("is_active", true)
      .order("created_at")
      .then(({ data }) => {
        setRooms((data as Room[]) || []);
        setLoading(false);
      });
  }, []);

  // Fetch membership statuses
  useEffect(() => {
    if (!user || rooms.length === 0) return;
    supabase
      .from("chat_room_members")
      .select("room_id, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const map: Record<string, MemberStatus> = {};
        (data || []).forEach((m: any) => {
          map[m.room_id] = m.status;
        });
        setMemberStatuses(map);
      });
  }, [user, rooms]);

  // Load messages when room selected
  useEffect(() => {
    if (!selectedRoom || memberStatuses[selectedRoom.id] !== "approved") {
      setMessages([]);
      return;
    }
    supabase
      .from("chat_room_messages")
      .select("*")
      .eq("room_id", selectedRoom.id)
      .order("created_at")
      .then(({ data }) => setMessages((data as RoomMessage[]) || []));

    const channel = supabase
      .channel(`room-msgs-${selectedRoom.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_room_messages",
        filter: `room_id=eq.${selectedRoom.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === (payload.new as RoomMessage).id)) return prev;
          return [...prev, payload.new as RoomMessage];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom?.id, memberStatuses]);

  // Fetch profile names for messages
  useEffect(() => {
    if (messages.length === 0) return;
    const userIds = [...new Set(messages.map(m => m.user_id))].filter(id => !profiles[id]);
    if (userIds.length === 0) return;
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds)
      .then(({ data }) => {
        const map = { ...profiles };
        (data || []).forEach((p: any) => { map[p.user_id] = p.full_name || "User"; });
        setProfiles(map);
      });
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const requestJoin = async (roomId: string) => {
    if (!user) return;
    await supabase.from("chat_room_members").insert({ room_id: roomId, user_id: user.id });
    setMemberStatuses(prev => ({ ...prev, [roomId]: "pending" }));
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || !selectedRoom || !user) return;
    setInput("");
    setSending(true);
    await supabase.from("chat_room_messages").insert({
      room_id: selectedRoom.id,
      user_id: user.id,
      message: msg,
    });
    setSending(false);
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString(bn ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const getStatusBadge = (status: MemberStatus) => {
    if (status === "approved") return <Badge className="bg-primary/15 text-primary text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />{bn ? "অনুমোদিত" : "Approved"}</Badge>;
    if (status === "pending") return <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{bn ? "অপেক্ষমাণ" : "Pending"}</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-[10px]">{bn ? "বাতিল" : "Rejected"}</Badge>;
    return null;
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead title={bn ? "চ্যাট রুম | Yess Host" : "Chat Rooms | Yess Host"} description={bn ? "Yess Host চ্যাট রুমে আলোচনায় যোগ দিন" : "Join discussions in Yess Host chat rooms"} />

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {bn ? "চ্যাট রুম" : "Chat Rooms"}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {bn ? "বিভিন্ন বিষয়ে আলোচনায় যোগ দিন এবং সাহায্য পান" : "Join topic-based discussions and get help"}
          </p>
        </div>

        {!user && (
          <div className="text-center mb-8 p-6 glass-card rounded-2xl max-w-md mx-auto">
            <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{bn ? "চ্যাট রুমে যোগ দিতে লগইন করুন" : "Please log in to join chat rooms"}</p>
            <Button asChild>
              <Link to="/login">{bn ? "লগইন করুন" : "Log In"}</Link>
            </Button>
          </div>
        )}

        {/* Room list + Chat area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: selectedRoom ? "500px" : "auto" }}>
          {/* Room list */}
          <div className={`space-y-3 ${selectedRoom ? "hidden lg:block" : ""}`}>
            {rooms.map((room) => {
              const status = memberStatuses[room.id] || null;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card rounded-xl p-4 border cursor-pointer transition-all hover:border-primary/30 ${selectedRoom?.id === room.id ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}
                  onClick={() => status === "approved" ? setSelectedRoom(room) : null}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{room.name}</h3>
                        {room.description && <p className="text-[11px] text-muted-foreground">{room.description}</p>}
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                  {user && !status && (
                    <Button
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={(e) => { e.stopPropagation(); requestJoin(room.id); }}
                    >
                      {bn ? "যোগদানের অনুরোধ করুন" : "Request to Join"}
                    </Button>
                  )}
                  {status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs"
                      onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); }}
                    >
                      {bn ? "চ্যাটে যান" : "Enter Chat"}
                    </Button>
                  )}
                </motion.div>
              );
            })}
            {rooms.length === 0 && (
              <div className="text-center p-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{bn ? "কোনো রুম নেই" : "No rooms available"}</p>
              </div>
            )}
          </div>

          {/* Chat area */}
          {selectedRoom && (
            <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col border border-border" style={{ height: "500px" }}>
              {/* Chat header */}
              <div className="gradient-primary p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedRoom(null)} className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-primary-foreground">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <p className="text-primary-foreground font-bold text-sm">{selectedRoom.name}</p>
                    {selectedRoom.description && <p className="text-primary-foreground/60 text-[10px]">{selectedRoom.description}</p>}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{bn ? "এখনো কোনো মেসেজ নেই। প্রথম মেসেজ পাঠান!" : "No messages yet. Send the first one!"}</p>
                  </div>
                )}
                {messages.map((m) => {
                  const isMe = m.user_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] ${isMe ? "" : ""}`}>
                        {!isMe && (
                          <p className="text-[10px] text-muted-foreground mb-0.5 px-1">{profiles[m.user_id] || "..."}</p>
                        )}
                        <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "gradient-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        }`}>
                          <p className="break-words whitespace-pre-wrap">{m.message}</p>
                          <p className={`text-[9px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    onChange={(e) => setInput(e.target.value)}
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
            </div>
          )}

          {!selectedRoom && (
            <div className="hidden lg:flex lg:col-span-2 glass-card rounded-xl items-center justify-center border border-border" style={{ height: "500px" }}>
              <div className="text-center">
                <MessageCircle className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{bn ? "একটি রুম নির্বাচন করুন" : "Select a room to start chatting"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default ChatRooms;
