import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Headphones,
  MessageSquareReply,
  Plus,
  RefreshCw,
  Download,
  Shield,
  Trash2,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { csvDate, downloadCsv } from "@/lib/export-csv";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import {
  StaffEmpty,
  StaffLoading,
  StaffMetricStrip,
  StaffPageHeader,
  StaffSearch,
} from "@/components/staff/StaffConsole";

type StaffRole = "admin" | "moderator" | "call_center" | "reseller";
type RoleRow = { id: string; user_id: string; role: string };
type ProfileRow = { user_id: string; full_name: string | null; phone: string | null; avatar_url: string | null; created_at: string };
type ReplyRow = { user_id: string | null; is_staff: boolean; created_at: string };

const ROLES: { key: StaffRole; bn: string; en: string; icon: typeof Shield }[] = [
  { key: "admin", bn: "অ্যাডমিন", en: "Admin", icon: Shield },
  { key: "moderator", bn: "মডারেটর", en: "Moderator", icon: UserCog },
  { key: "call_center", bn: "কল সেন্টার", en: "Call center", icon: Headphones },
  { key: "reseller", bn: "রিসেলার", en: "Reseller", icon: UsersIcon },
];

const AdminStaff = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [tickets, setTickets] = useState<{ status: string }[]>([]);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [r, p, t, rep] = await Promise.all([
        supabase.from("user_roles").select("id,user_id,role"),
        supabase.from("profiles").select("user_id,full_name,phone,avatar_url,created_at"),
        supabase.from("support_tickets").select("status"),
        supabase.from("ticket_replies").select("user_id,is_staff,created_at"),
      ]);
      const firstError = r.error || p.error || t.error || rep.error;
      if (firstError) throw firstError;
      setRoles((r.data || []) as RoleRow[]);
      setProfiles((p.data || []) as ProfileRow[]);
      setTickets(t.data || []);
      setReplies((rep.data || []) as ReplyRow[]);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unknown error";
      console.error("[AdminStaff] load failed", { message });
      setError(bn ? "স্টাফ তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" : "Staff data could not be loaded. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bn]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [query, roleFilter]);

  const profileMap = useMemo(() => new Map(profiles.map((profile) => [profile.user_id, profile])), [profiles]);
  const replyCount = useMemo(() => {
    const counts = new Map<string, number>();
    replies.forEach((reply) => {
      if (reply.user_id && reply.is_staff) counts.set(reply.user_id, (counts.get(reply.user_id) || 0) + 1);
    });
    return counts;
  }, [replies]);

  const allStaff = useMemo(() => {
    const map = new Map<string, StaffRole[]>();
    roles.forEach((row) => {
      if (row.role === "user" || !ROLES.some((role) => role.key === row.role)) return;
      const role = row.role as StaffRole;
      map.set(row.user_id, [...(map.get(row.user_id) || []), role]);
    });
    return Array.from(map, ([user_id, userRoles]) => ({
      user_id,
      roles: userRoles,
      profile: profileMap.get(user_id),
      replies: replyCount.get(user_id) || 0,
    })).sort((a, b) => (a.profile?.full_name || "").localeCompare(b.profile?.full_name || ""));
  }, [roles, profileMap, replyCount]);

  const filteredStaff = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return allStaff.filter((member) => {
      const matchesRole = roleFilter === "all" || member.roles.includes(roleFilter);
      const matchesQuery = !normalized || [member.profile?.full_name, member.profile?.phone]
        .some((value) => (value || "").toLocaleLowerCase().includes(normalized));
      return matchesRole && matchesQuery;
    });
  }, [allStaff, query, roleFilter]);

  const exportCsv = () => downloadCsv(`staff-${csvDate(new Date().toISOString())}`,
    [bn ? "নাম" : "Name", bn ? "ইমেইল" : "Email", bn ? "ভূমিকা" : "Role", bn ? "যোগদান" : "Joined"],
    filteredStaff.map((member: any) => [member.full_name || "", member.email || "", member.role || "", csvDate(member.created_at)]));
  const pagedStaff = useMemo(
    () => filteredStaff.slice((page - 1) * pageSize, page * pageSize),
    [filteredStaff, page, pageSize],
  );

  const candidates = useMemo(() => {
    const staffIds = new Set(allStaff.map((member) => member.user_id));
    const normalized = addSearch.trim().toLocaleLowerCase();
    return profiles
      .filter((profile) => !staffIds.has(profile.user_id))
      .filter((profile) => !normalized || [profile.full_name, profile.phone]
        .some((value) => (value || "").toLocaleLowerCase().includes(normalized)))
      .slice(0, 8);
  }, [profiles, allStaff, addSearch]);

  const toggleRole = async (userId: string, role: StaffRole, enabled: boolean) => {
    setSaving(`${userId}-${role}`);
    try {
      if (enabled) {
        const { error: saveError } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (saveError && !saveError.message.includes("duplicate")) throw saveError;
      } else {
        const { error: saveError } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (saveError) throw saveError;
      }
      await load(true);
      toast.success(bn ? "অনুমতি হালনাগাদ হয়েছে" : "Role updated");
    } catch (saveError) {
      console.error("[AdminStaff] role update failed", { userId, role, enabled, saveError });
      toast.error(bn ? "অনুমতি সংরক্ষণ করা যায়নি" : "Could not save the role");
    } finally {
      setSaving(null);
    }
  };

  const removeStaff = async (userId: string) => {
    setSaving(userId);
    const { error: removeError } = await supabase.from("user_roles").delete().eq("user_id", userId).neq("role", "user");
    setSaving(null);
    if (removeError) {
      console.error("[AdminStaff] remove failed", { userId, removeError });
      toast.error(bn ? "স্টাফ সরানো যায়নি" : "Could not remove staff");
      return;
    }
    await load(true);
    toast.success(bn ? "স্টাফ সরানো হয়েছে" : "Staff removed");
  };

  const counts = useMemo(() => ({
    admins: roles.filter((role) => role.role === "admin").length,
    support: roles.filter((role) => role.role === "call_center" || role.role === "moderator").length,
    replies: replies.filter((reply) => reply.is_staff).length,
    openTickets: tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress").length,
  }), [roles, replies, tickets]);

  const metrics = [
    { label: bn ? "মোট স্টাফ" : "Total staff", value: allStaff.length, detail: bn ? "সক্রিয় সদস্য" : "team members", icon: UsersIcon },
    { label: bn ? "অ্যাডমিন" : "Administrators", value: counts.admins, detail: bn ? "পূর্ণ অনুমতি" : "full access", icon: Shield, tone: "danger" as const },
    { label: bn ? "কাস্টমার কেয়ার" : "Customer care", value: counts.support, detail: bn ? "সহায়তা ভূমিকা" : "support roles", icon: Headphones, tone: "warning" as const },
    { label: bn ? "সাপোর্ট কাজ" : "Support activity", value: counts.replies, detail: `${counts.openTickets} ${bn ? "খোলা টিকেট" : "open tickets"}`, icon: MessageSquareReply, tone: "success" as const },
  ];

  if (loading) return <div className="space-y-5"><StaffLoading rows={1} /><StaffLoading rows={5} /></div>;

  return (
    <div className="staff-console space-y-5">
      <StaffPageHeader
        title={bn ? "স্টাফ ও অনুমতি" : "Staff & Access"}
        description={bn ? "দলের ভূমিকা, অ্যাক্সেস ও সাপোর্ট কার্যক্রম পরিচালনা করুন" : "Manage team roles, access and support activity"}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={exportCsv} disabled={filteredStaff.length === 0}><Download />{bn ? "CSV" : "CSV"}</Button><Button variant="outline" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className={refreshing ? "animate-spin" : ""} />{bn ? "রিফ্রেশ" : "Refresh"}</Button><Button onClick={() => setAddOpen((open) => !open)}><Plus />{bn ? "স্টাফ যোগ করুন" : "Add staff"}</Button></div>}
      />

      <StaffMetricStrip metrics={metrics} />

      {error && (
        <div className="staff-panel flex flex-col gap-3 border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" /><div><p className="font-medium text-foreground">{bn ? "তথ্য পাওয়া যায়নি" : "Data unavailable"}</p><p className="text-sm text-muted-foreground">{error}</p></div></div>
          <Button variant="outline" onClick={() => void load()}>{bn ? "আবার চেষ্টা করুন" : "Try again"}</Button>
        </div>
      )}

      {addOpen && !error && (
        <section className="staff-panel overflow-hidden" aria-labelledby="add-staff-title">
          <div className="border-b border-border p-4"><h2 id="add-staff-title" className="font-semibold text-foreground">{bn ? "গ্রাহক থেকে স্টাফ যোগ করুন" : "Add staff from customers"}</h2><p className="mt-1 text-xs text-muted-foreground">{bn ? "একজন গ্রাহক খুঁজে প্রয়োজনীয় ভূমিকা দিন" : "Find a customer and assign the required role"}</p></div>
          <div className="p-4"><Input value={addSearch} onChange={(event) => setAddSearch(event.target.value)} placeholder={bn ? "নাম বা ফোন দিয়ে খুঁজুন" : "Search by name or phone"} className="h-11" /></div>
          <div className="divide-y divide-border border-t border-border">
            {candidates.map((candidate) => (
              <div key={candidate.user_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{candidate.full_name || (bn ? "নামবিহীন গ্রাহক" : "Unnamed customer")}</p><p className="text-xs text-muted-foreground">{candidate.phone || (bn ? "ফোন দেওয়া হয়নি" : "No phone provided")}</p></div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  {ROLES.map((role) => <Button key={role.key} variant="outline" size="sm" disabled={saving === `${candidate.user_id}-${role.key}`} onClick={() => void toggleRole(candidate.user_id, role.key, true)}>+ {bn ? role.bn : role.en}</Button>)}
                </div>
              </div>
            ))}
            {candidates.length === 0 && <StaffEmpty icon={UsersIcon} title={bn ? "কোনো গ্রাহক পাওয়া যায়নি" : "No customer found"} description={bn ? "অন্য নাম বা ফোন নম্বর দিয়ে খুঁজুন।" : "Try another name or phone number."} />}
          </div>
        </section>
      )}

      {!error && (
        <section className="space-y-4">
          <div className="staff-panel flex flex-col gap-3 p-3 md:flex-row">
            <StaffSearch value={query} onChange={setQuery} placeholder={bn ? "নাম বা ফোন দিয়ে স্টাফ খুঁজুন" : "Search staff by name or phone"} />
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | StaffRole)}>
              <SelectTrigger className="h-11 w-full md:w-52" aria-label={bn ? "ভূমিকা ফিল্টার" : "Filter by role"}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{bn ? "সব ভূমিকা" : "All roles"}</SelectItem>{ROLES.map((role) => <SelectItem key={role.key} value={role.key}>{bn ? role.bn : role.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="staff-panel overflow-hidden">
            <div className="hidden grid-cols-[minmax(220px,1.4fr)_minmax(190px,1fr)_120px_150px] gap-4 border-b border-border bg-secondary/30 px-4 py-3 text-xs font-semibold text-muted-foreground lg:grid">
              <span>{bn ? "দলের সদস্য" : "Team member"}</span><span>{bn ? "ভূমিকা ও অনুমতি" : "Roles & access"}</span><span>{bn ? "সাপোর্ট উত্তর" : "Support replies"}</span><span className="text-right">{bn ? "কার্যক্রম" : "Actions"}</span>
            </div>
            <div className="divide-y divide-border">
              {pagedStaff.map((member) => (
                <article key={member.user_id} className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,1.4fr)_minmax(190px,1fr)_120px_150px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">{(member.profile?.full_name || "U").charAt(0).toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{member.profile?.full_name || (bn ? "নামবিহীন ব্যবহারকারী" : "Unnamed user")}</p><p className="truncate text-xs text-muted-foreground">{member.profile?.phone || (bn ? "ফোন দেওয়া হয়নি" : "No phone provided")}</p>{member.profile?.created_at && <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="size-3" />{bn ? "যোগদান" : "Joined"} {new Date(member.profile.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p>}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) => {
                      const active = member.roles.includes(role.key);
                      return <Button key={role.key} variant={active ? "default" : "outline"} size="sm" className="min-h-10" disabled={saving === `${member.user_id}-${role.key}`} onClick={() => void toggleRole(member.user_id, role.key, !active)} aria-pressed={active}>{bn ? role.bn : role.en}</Button>;
                    })}
                  </div>
                  <div><span className="lg:hidden text-xs text-muted-foreground">{bn ? "সাপোর্ট উত্তর: " : "Support replies: "}</span><strong className="text-sm tabular-nums text-foreground">{member.replies}</strong></div>
                  <div className="lg:text-right"><Button variant="outline" size="sm" className="min-h-10 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={saving === member.user_id} onClick={() => void removeStaff(member.user_id)}><Trash2 />{bn ? "সরান" : "Remove"}</Button></div>
                </article>
              ))}
              {filteredStaff.length === 0 && <StaffEmpty icon={UsersIcon} title={query || roleFilter !== "all" ? (bn ? "কোনো মিল পাওয়া যায়নি" : "No matching staff") : (bn ? "কোনো স্টাফ নেই" : "No staff members")} description={query || roleFilter !== "all" ? (bn ? "সার্চ বা ভূমিকা ফিল্টার পরিবর্তন করুন।" : "Change the search or role filter.") : (bn ? "গ্রাহক তালিকা থেকে প্রথম স্টাফ সদস্য যোগ করুন।" : "Add the first staff member from the customer list.")} />}
            </div>
          </div>
          <DataPagination total={filteredStaff.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 25, 50]} />
        </section>
      )}
    </div>
  );
};

export default AdminStaff;