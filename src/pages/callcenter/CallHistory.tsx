import { useEffect, useState } from "react";
import { PhoneIncoming, PhoneOff, PhoneMissed, Phone, RefreshCw, Clock, Search, NotebookPen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import DataPagination from "@/components/DataPagination";
import { StaffMetricStrip, StaffPageHeader } from "@/components/staff/StaffConsole";

interface CallRecord {
  id: string;
  chat_id: string;
  caller_role: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string;
  created_at: string;
  outcome?: string | null;
  notes?: string | null;
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ outcome: "resolved", notes: "" });
  const [saving, setSaving] = useState(false);

  const outcomes = [
    { key: "resolved", label: bn ? "সমাধান হয়েছে" : "Resolved" },
    { key: "callback", label: bn ? "কলব্যাক প্রয়োজন" : "Callback required" },
    { key: "no_answer", label: bn ? "সাড়া পাওয়া যায়নি" : "No answer" },
    { key: "escalated", label: bn ? "টিকেটে পাঠানো হয়েছে" : "Escalated to ticket" },
  ];

  const startEdit = (call: CallRecord) => {
    setEditing(call.id);
    setDraft({ outcome: call.outcome || "resolved", notes: call.notes || "" });
  };

  const saveLog = async (call: CallRecord) => {
    setSaving(true);
    const { error } = await supabase.from("call_history").update({ outcome: draft.outcome, notes: draft.notes.trim() || null } as never).eq("id", call.id);
    setSaving(false);
    if (error) { toast.error(bn ? "কল নোট সেভ করা যায়নি।" : "Call note could not be saved."); return; }
    setCalls((rows) => rows.map((row) => row.id === call.id ? { ...row, outcome: draft.outcome, notes: draft.notes.trim() || null } : row));
    setEditing(null);
    toast.success(bn ? "কল নোট সংরক্ষিত হয়েছে।" : "Call note saved.");
  };

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

  const formatDuration = (s: number | null) => {
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
    ? Math.round(calls.filter(c => c.status === "completed").reduce((a, c) => a + (c.duration_seconds || 0), 0) / completedCalls)
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

  const query = search.toLowerCase();
  const filteredCalls = calls.filter((call) => [call.live_chats?.visitor_name, call.live_chats?.visitor_email, call.live_chats?.visitor_phone, call.caller_role].some((value) => value?.toLowerCase().includes(query)));
  const pagedCalls = filteredCalls.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [filter, search]);

  if (loading && calls.length === 0) return <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map((item)=><Skeleton key={item} className="h-28" />)}</div>{[0,1,2,3,4].map((item)=><Skeleton key={item} className="h-14" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <StaffPageHeader title={bn ? "কল ফলাফল ও ইতিহাস" : "Call Outcomes & History"} description={bn ? "কলের ফলাফল, সময়কাল ও ফলো-আপের অগ্রাধিকার" : "Call outcomes, duration and follow-up priority"} actions={<Button variant="outline" onClick={fetchCalls}><RefreshCw className={loading?"animate-spin":""}/>{bn?"রিফ্রেশ":"Refresh"}</Button>} />

      {/* Stats */}
      <StaffMetricStrip metrics={stats.map((item,index)=>({label:item.label,value:item.value,detail:index===0?(bn?"সাম্প্রতিক ১০০":"latest 100"):index===1?(bn?"সফল সংযোগ":"successful"):index===2?(bn?"ফলো-আপ":"follow-up"):(bn?"সম্পন্ন কল":"completed calls"),icon:item.icon,tone:index===1?"success":index===2?"danger":"primary"}))} />

      {/* Filter Tabs */}
      <div className="staff-panel flex flex-col gap-3 p-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={bn?"নাম, ইমেইল বা ফোন খুঁজুন":"Search name, email or phone"} className="pl-9"/></div><div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <Button
            key={f.key}
            onClick={() => setFilter(f.key)}
            variant={filter === f.key ? "default" : "ghost"} size="sm"
          >
            {f.label}
          </Button>
        ))}
      </div></div>

      {/* Call List */}
      <div className="staff-panel overflow-hidden">
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
          pagedCalls.map((call) => {
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
        <div className="px-4 pb-4"><DataPagination total={filteredCalls.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} /></div>
      </div>
    </div>
  );
};

export default CallHistory;
