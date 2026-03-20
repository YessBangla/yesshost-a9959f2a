import { useEffect, useState } from "react";
import { PhoneIncoming, PhoneOff, PhoneMissed, Phone, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface CallRecord {
  id: string;
  chat_id: string;
  caller_role: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  status: string;
  created_at: string;
  live_chats?: { visitor_name: string; visitor_email: string | null; visitor_phone: string | null } | null;
}

const statusConfig: Record<string, { icon: typeof Phone; label: string; labelBn: string; color: string }> = {
  completed: { icon: Phone, label: "Completed", labelBn: "সম্পন্ন", color: "text-emerald-500 bg-emerald-500/10" },
  connected: { icon: PhoneIncoming, label: "Connected", labelBn: "সংযুক্ত", color: "text-blue-500 bg-blue-500/10" },
  ringing: { icon: PhoneIncoming, label: "Ringing", labelBn: "রিং হচ্ছে", color: "text-amber-500 bg-amber-500/10" },
  missed: { icon: PhoneMissed, label: "Missed", labelBn: "মিসড", color: "text-destructive bg-destructive/10" },
};

const CallHistory = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchCalls = async () => {
    setLoading(true);
    let query = supabase
      .from("call_history")
      .select("*, live_chats(visitor_name, visitor_email, visitor_phone)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setCalls((data as CallRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCalls(); }, [filter]);

  const formatDuration = (s: number) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(bn ? "bn-BD" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  // Stats
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === "completed").length;
  const missedCalls = calls.filter(c => c.status === "missed").length;
  const avgDuration = completedCalls
    ? Math.round(calls.filter(c => c.status === "completed").reduce((a, c) => a + c.duration_seconds, 0) / completedCalls)
    : 0;

  const stats = [
    { label: bn ? "মোট কল" : "Total Calls", value: totalCalls, icon: Phone, color: "text-primary bg-primary/10" },
    { label: bn ? "সম্পন্ন" : "Completed", value: completedCalls, icon: PhoneIncoming, color: "text-emerald-500 bg-emerald-500/10" },
    { label: bn ? "মিসড" : "Missed", value: missedCalls, icon: PhoneMissed, color: "text-destructive bg-destructive/10" },
    { label: bn ? "গড় সময়কাল" : "Avg Duration", value: formatDuration(avgDuration), icon: Clock, color: "text-blue-500 bg-blue-500/10" },
  ];

  const filters = [
    { key: "all", label: bn ? "সব" : "All" },
    { key: "completed", label: bn ? "সম্পন্ন" : "Completed" },
    { key: "missed", label: bn ? "মিসড" : "Missed" },
    { key: "ringing", label: bn ? "রিংিং" : "Ringing" },
  ];

  if (loading && calls.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{bn ? "কল হিস্ট্রি" : "Call History"}</h1>
        <button onClick={fetchCalls} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground transition-colors active:scale-95">
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Call List */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px_140px] gap-4 px-4 py-3 border-b border-border/50 text-xs font-semibold text-muted-foreground">
          <span>{bn ? "ভিজিটর" : "Visitor"}</span>
          <span>{bn ? "স্ট্যাটাস" : "Status"}</span>
          <span>{bn ? "সময়কাল" : "Duration"}</span>
          <span>{bn ? "কলার" : "Caller"}</span>
          <span>{bn ? "সময়" : "Time"}</span>
        </div>

        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <PhoneOff className="w-12 h-12 opacity-20" />
            <p className="text-sm">{bn ? "কোনো কল হিস্ট্রি নেই" : "No call history"}</p>
          </div>
        ) : (
          calls.map((call) => {
            const cfg = statusConfig[call.status] || statusConfig.missed;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={call.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_100px_140px] gap-1 md:gap-4 px-4 py-3 border-b border-border/30 hover:bg-secondary/20 transition-colors"
              >
                {/* Visitor */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {(call.live_chats?.visitor_name || "V").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {call.live_chats?.visitor_name || (bn ? "অজানা" : "Unknown")}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate md:hidden">
                      {formatTime(call.started_at)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {bn ? cfg.labelBn : cfg.label}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center">
                  <span className="text-sm text-foreground tabular-nums">{formatDuration(call.duration_seconds)}</span>
                </div>

                {/* Caller role */}
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground capitalize">{call.caller_role}</span>
                </div>

                {/* Time */}
                <div className="hidden md:flex items-center">
                  <span className="text-xs text-muted-foreground">{formatTime(call.started_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CallHistory;
