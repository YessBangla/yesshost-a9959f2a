import { useEffect, useMemo, useState } from "react";
import { Shield, Headphones, UserCog, Users as UsersIcon, Loader2, Search, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type StaffRole = "admin" | "moderator" | "call_center" | "reseller";

const ROLES: { key: StaffRole; bn: string; en: string; icon: any; tone: string }[] = [
  { key: "admin", bn: "অ্যাডমিন", en: "Admin", icon: Shield, tone: "text-destructive" },
  { key: "moderator", bn: "মডারেটর", en: "Moderator", icon: UserCog, tone: "text-primary" },
  { key: "call_center", bn: "কল সেন্টার", en: "Call center", icon: Headphones, tone: "text-emerald-600" },
  { key: "reseller", bn: "রিসেলার", en: "Reseller", icon: UsersIcon, tone: "text-amber-600" },
];

const AdminStaff = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const load = async () => {
    const [r, p, t, rep] = await Promise.all([
      supabase.from("user_roles").select("id,user_id,role"),
      supabase.from("profiles").select("user_id,full_name,phone,avatar_url,created_at"),
      supabase.from("support_tickets").select("status"),
      supabase.from("ticket_replies").select("user_id,is_staff,created_at"),
    ]);
    setRoles(r.data || []);
    setProfiles(p.data || []);
    setTickets(t.data || []);
    setReplies(rep.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const profileOf = (uid: string) => profiles.find(p => p.user_id === uid);

  const staff = useMemo(() => {
    const map: Record<string, StaffRole[]> = {};
    roles.forEach(r => {
      if (r.role === "user") return;
      map[r.user_id] = [...(map[r.user_id] || []), r.role];
    });
    return Object.entries(map)
      .map(([user_id, userRoles]) => ({
        user_id,
        roles: userRoles,
        profile: profileOf(user_id),
        replies: replies.filter(x => x.user_id === user_id && x.is_staff).length,
      }))
      .filter(s => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (s.profile?.full_name || "").toLowerCase().includes(q) || (s.profile?.phone || "").includes(q);
      })
      .sort((a, b) => (a.profile?.full_name || "").localeCompare(b.profile?.full_name || ""));
  }, [roles, profiles, replies, query]);

  const candidates = useMemo(() => {
    const staffIds = new Set(roles.filter(r => r.role !== "user").map(r => r.user_id));
    const q = addSearch.trim().toLowerCase();
    return profiles
      .filter(p => !staffIds.has(p.user_id))
      .filter(p => !q || (p.full_name || "").toLowerCase().includes(q) || (p.phone || "").includes(q))
      .slice(0, 8);
  }, [profiles, roles, addSearch]);

  const toggleRole = async (userId: string, role: StaffRole, enabled: boolean) => {
    setSaving(`${userId}-${role}`);
    try {
      if (enabled) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
        if (error) throw error;
      }
      await load();
      toast.success(bn ? "অনুমতি হালনাগাদ হয়েছে" : "Role updated");
    } catch (e: any) {
      toast.error(bn ? "সংরক্ষণ ব্যর্থ: " + e.message : "Could not save: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  const removeStaff = async (userId: string) => {
    setSaving(userId);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).neq("role", "user" as any);
    setSaving(null);
    if (error) { toast.error(bn ? "সরানো যায়নি" : "Could not remove"); return; }
    await load();
    toast.success(bn ? "স্টাফ সরানো হয়েছে" : "Staff removed");
  };

  const counts = useMemo(() => ({
    admin: roles.filter(r => r.role === "admin").length,
    moderator: roles.filter(r => r.role === "moderator").length,
    call_center: roles.filter(r => r.role === "call_center").length,
    reseller: roles.filter(r => r.role === "reseller").length,
    openTickets: tickets.filter(t => t.status === "open" || t.status === "in_progress").length,
  }), [roles, tickets]);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{bn ? "স্টাফ ও ম্যানেজার" : "Staff & Managers"}</h1>
          <p className="text-sm text-muted-foreground">{bn ? "কর্মীদের অধিকার নিয়ন্ত্রণ ও কাজের সারসংক্ষেপ" : "Control team access and see workload"}</p>
        </div>
        <button onClick={() => setAddOpen(v => !v)} className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> {bn ? "স্টাফ যোগ করুন" : "Add staff"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map(r => (
          <div key={r.key} className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-2 text-[11px] font-medium ${r.tone}`}>
              <r.icon className="w-3.5 h-3.5" /> {bn ? r.bn : r.en}
            </div>
            <p className="mt-2 text-lg font-bold">{counts[r.key]}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground">{bn ? "খোলা টিকিট" : "Open tickets"}</p>
          <p className="mt-2 text-lg font-bold">{counts.openTickets}</p>
        </div>
      </div>

      {addOpen && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder={bn ? "নাম বা ফোন দিয়ে গ্রাহক খুঁজুন" : "Search customer by name or phone"}
              className="flex-1 bg-transparent py-2.5 text-sm outline-hidden min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            {candidates.map(c => (
              <div key={c.user_id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0">
                <span className="text-sm font-medium">{c.full_name || (bn ? "নামবিহীন" : "Unnamed")} <span className="text-muted-foreground text-xs">{c.phone}</span></span>
                <div className="flex gap-1.5">
                  {ROLES.map(r => (
                    <button
                      key={r.key}
                      onClick={() => toggleRole(c.user_id, r.key, true)}
                      className="px-2.5 py-1.5 rounded-md border border-border text-[11px] font-medium hover:bg-accent/10"
                    >
                      + {bn ? r.bn : r.en}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {candidates.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">{bn ? "কোনো গ্রাহক পাওয়া যায়নি" : "No matching customer"}</p>}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={bn ? "স্টাফ খুঁজুন" : "Search staff"}
            className="flex-1 bg-transparent py-3 text-sm outline-hidden min-h-[44px]"
          />
        </div>
        <div className="divide-y divide-border">
          {staff.map(s => (
            <div key={s.user_id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{s.profile?.full_name || (bn ? "নামবিহীন ব্যবহারকারী" : "Unnamed user")}</p>
                <p className="text-[11px] text-muted-foreground">
                  {s.profile?.phone || "—"} · {bn ? "সাপোর্ট উত্তর" : "Support replies"}: {s.replies}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {ROLES.map(r => {
                  const active = s.roles.includes(r.key);
                  const busy = saving === `${s.user_id}-${r.key}`;
                  return (
                    <button
                      key={r.key}
                      disabled={busy}
                      onClick={() => toggleRole(s.user_id, r.key, !active)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent/10"}`}
                    >
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <r.icon className="w-3 h-3" />}
                      {bn ? r.bn : r.en}
                    </button>
                  );
                })}
                <button
                  disabled={saving === s.user_id}
                  onClick={() => removeStaff(s.user_id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  {saving === s.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {bn ? "সরান" : "Remove"}
                </button>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <p className="text-sm text-muted-foreground py-12 text-center">{bn ? "কোনো স্টাফ নেই" : "No staff members"}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStaff;
