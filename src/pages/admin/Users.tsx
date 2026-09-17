import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminTableSkeleton } from "@/components/DashboardSkeleton";
import {
  Users as UsersIcon, Search, Shield, ShieldOff, Eye, X, Edit3, Save,
  Mail, Phone, MapPin, Building2, Calendar, Globe, Filter, Headphones,
  UserPlus, Check, Lock, LayoutDashboard, Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";
import { Download } from "lucide-react";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import DataPagination from "@/components/DataPagination";

type UserWithRoles = Tables<"profiles"> & { roles: string[]; permissions: string[]; services_count?: number; invoices_total?: number };

// Permission definitions
const ALL_PERMISSIONS = [
  { key: "orders.view", labelBn: "অর্ডার দেখা", labelEn: "View Orders", group: "orders" },
  { key: "orders.approve", labelBn: "অর্ডার এপ্রুভ/রিজেক্ট", labelEn: "Approve/Reject Orders", group: "orders" },
  { key: "services.view", labelBn: "সার্ভিস দেখা", labelEn: "View Services", group: "services" },
  { key: "services.manage", labelBn: "সার্ভিস ম্যানেজ", labelEn: "Manage Services", group: "services" },
  { key: "billing.view", labelBn: "বিলিং দেখা", labelEn: "View Billing", group: "billing" },
  { key: "billing.manage", labelBn: "বিলিং ম্যানেজ", labelEn: "Manage Billing", group: "billing" },
  { key: "chat.view", labelBn: "লাইভ চ্যাট দেখা", labelEn: "View Live Chat", group: "chat" },
  { key: "chat.reply", labelBn: "চ্যাটে উত্তর দেওয়া", labelEn: "Reply to Chat", group: "chat" },
  { key: "tickets.view", labelBn: "সাপোর্ট টিকেট দেখা", labelEn: "View Support Tickets", group: "tickets" },
  { key: "tickets.reply", labelBn: "টিকেটে উত্তর দেওয়া", labelEn: "Reply to Tickets", group: "tickets" },
  { key: "users.view", labelBn: "ইউজার দেখা", labelEn: "View Users", group: "users" },
  { key: "themes.view", labelBn: "থিম দেখা", labelEn: "View Themes", group: "themes" },
  { key: "themes.manage", labelBn: "থিম ম্যানেজ", labelEn: "Manage Themes", group: "themes" },
  { key: "cms.manage", labelBn: "CMS ম্যানেজ", labelEn: "Manage CMS", group: "cms" },
  { key: "kb.manage", labelBn: "নলেজ বেস ম্যানেজ", labelEn: "Manage Knowledge Base", group: "kb" },
  { key: "coupons.manage", labelBn: "কুপন ম্যানেজ", labelEn: "Manage Coupons", group: "coupons" },
];

const PERMISSION_GROUPS = [
  { key: "orders", labelBn: "অর্ডার", labelEn: "Orders" },
  { key: "services", labelBn: "সার্ভিস", labelEn: "Services" },
  { key: "billing", labelBn: "বিলিং", labelEn: "Billing" },
  { key: "chat", labelBn: "লাইভ চ্যাট", labelEn: "Live Chat" },
  { key: "tickets", labelBn: "সাপোর্ট টিকেট", labelEn: "Support Tickets" },
  { key: "users", labelBn: "ইউজার", labelEn: "Users" },
  { key: "themes", labelBn: "থিম", labelEn: "Themes" },
  { key: "cms", labelBn: "CMS", labelEn: "CMS" },
  { key: "kb", labelBn: "নলেজ বেস", labelEn: "Knowledge Base" },
  { key: "coupons", labelBn: "কুপন", labelEn: "Coupons" },
];

const AdminUsers = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user" | "call_center">("all");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "", password: "", full_name: "", phone: "",
    roles: ["user"] as string[],
    permissions: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  // Edit permissions dialog
  const [editPermUser, setEditPermUser] = useState<UserWithRoles | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Edit client profile dialog
  const [editProfileUser, setEditProfileUser] = useState<UserWithRoles | null>(null);
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: "", phone: "", company_name: "", company_website: "",
    address: "", city: "", country: "", vat_id: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchUsers = async () => {
    const [profiles, roles, services, invoices, perms] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("services").select("user_id, id"),
      supabase.from("invoices").select("user_id, amount_bdt, status"),
      supabase.from("user_permissions" as any).select("*"),
    ]);

    const usersWithRoles: UserWithRoles[] = (profiles.data || []).map(p => ({
      ...p,
      roles: (roles.data || []).filter(r => r.user_id === p.user_id).map(r => r.role),
      permissions: ((perms.data || []) as any[]).filter((pm: any) => pm.user_id === p.user_id).map((pm: any) => pm.permission),
      services_count: (services.data || []).filter(s => s.user_id === p.user_id).length,
      invoices_total: (invoices.data || []).filter(i => i.user_id === p.user_id && i.status === "paid").reduce((sum, i) => sum + Number(i.amount_bdt), 0),
    }));
    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleAdminRole = async (userId: string, hasAdmin: boolean) => {
    if (hasAdmin) {
      const { data: roleData } = await supabase.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").single();
      if (roleData) await supabase.from("user_roles").delete().eq("id", roleData.id);
      toast({ title: "✅", description: isBn ? "অ্যাডমিন রোল সরানো হয়েছে" : "Admin role removed" });
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      toast({ title: "✅", description: isBn ? "অ্যাডমিন রোল যুক্ত হয়েছে" : "Admin role granted" });
    }
    fetchUsers();
  };

  const toggleCallCenterRole = async (userId: string, hasCC: boolean) => {
    if (hasCC) {
      const { data: roleData } = await supabase.from("user_roles").select("id").eq("user_id", userId).eq("role", "call_center" as any).single();
      if (roleData) await supabase.from("user_roles").delete().eq("id", roleData.id);
      toast({ title: "✅", description: isBn ? "কল সেন্টার রোল সরানো হয়েছে" : "Call center role removed" });
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "call_center" as any });
      toast({ title: "✅", description: isBn ? "কল সেন্টার রোল যুক্ত হয়েছে" : "Call center role granted" });
    }
    fetchUsers();
  };

  // Create user
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast({ title: isBn ? "ইমেইল ও পাসওয়ার্ড দিন" : "Email and password required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: createForm.email,
          password: createForm.password,
          full_name: createForm.full_name,
          phone: createForm.phone,
          roles: createForm.roles,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save permissions
      if (createForm.permissions.length > 0 && data?.user_id) {
        const permInserts = createForm.permissions.map(p => ({ user_id: data.user_id, permission: p }));
        await supabase.from("user_permissions" as any).insert(permInserts);
      }

      toast({ title: "✅ " + (isBn ? "সফল!" : "Success!"), description: isBn ? "নতুন ইউজার তৈরি হয়েছে" : "New user has been created" });
      setShowCreate(false);
      setCreateForm({ email: "", password: "", full_name: "", phone: "", roles: ["user"], permissions: [] });
      fetchUsers();
    } catch (err: any) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  // Save permissions for existing user
  const handleSavePermissions = async () => {
    if (!editPermUser) return;
    setSavingPerms(true);

    // Update roles
    const currentRoles = editPermUser.roles;
    const rolesToAdd = editRoles.filter(r => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter(r => !editRoles.includes(r));

    for (const role of rolesToRemove) {
      const { data: roleData } = await supabase.from("user_roles").select("id").eq("user_id", editPermUser.user_id).eq("role", role as any).single();
      if (roleData) await supabase.from("user_roles").delete().eq("id", roleData.id);
    }
    for (const role of rolesToAdd) {
      await supabase.from("user_roles").insert({ user_id: editPermUser.user_id, role: role as any });
    }

    // Update permissions
    await supabase.from("user_permissions" as any).delete().eq("user_id", editPermUser.user_id);
    if (editPerms.length > 0) {
      const inserts = editPerms.map(p => ({ user_id: editPermUser.user_id, permission: p }));
      await supabase.from("user_permissions" as any).insert(inserts);
    }
    toast({ title: "✅", description: isBn ? "ইউজারের অ্যাক্সেস ও রোল আপডেট হয়েছে" : "User access and roles updated successfully" });
    setSavingPerms(false);
    setEditPermUser(null);
    fetchUsers();
  };

  // Save client profile
  const handleSaveProfile = async () => {
    if (!editProfileUser) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editProfileForm.full_name || null,
          phone: editProfileForm.phone || null,
          company_name: editProfileForm.company_name || null,
          company_website: editProfileForm.company_website || null,
          address: editProfileForm.address || null,
          city: editProfileForm.city || null,
          country: editProfileForm.country || null,
          vat_id: editProfileForm.vat_id || null,
        })
        .eq("user_id", editProfileUser.user_id);
      if (error) throw error;
      toast({ title: "✅", description: isBn ? "ক্লায়েন্ট প্রোফাইল আপডেট হয়েছে" : "Client profile updated successfully" });
      setEditProfileUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" });
    }
    setSavingProfile(false);
  };

  const togglePermission = (perm: string, perms: string[], setPerms: (p: string[]) => void) => {
    setPerms(perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm]);
  };

  const toggleRole = (role: string) => {
    setCreateForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role],
    }));
  };

  const selectAllPerms = (perms: string[], setPerms: (p: string[]) => void) => {
    setPerms(ALL_PERMISSIONS.map(p => p.key));
  };
  const deselectAllPerms = (perms: string[], setPerms: (p: string[]) => void) => {
    setPerms([]);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search) ||
      (u.company_name || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" ||
      (roleFilter === "admin" && u.roles.includes("admin")) ||
      (roleFilter === "call_center" && u.roles.includes("call_center")) ||
      (roleFilter === "user" && !u.roles.includes("admin") && !u.roles.includes("call_center"));
    return matchSearch && matchRole;
  });

  const pagedUsers = filtered.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes("admin")).length,
    callCenter: users.filter(u => u.roles.includes("call_center")).length,
    thisMonth: users.filter(u => {
      const d = new Date(u.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  if (loading) return <AdminTableSkeleton columns={5} rows={8} statsCount={4} />;

  // Permission checklist component
  const PermissionChecklist = ({ perms, setPerms }: { perms: string[]; setPerms: (p: string[]) => void }) => (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => selectAllPerms(perms, setPerms)} className="text-[11px] text-primary hover:underline">
          {isBn ? "সব সিলেক্ট" : "Select All"}
        </button>
        <span className="text-muted-foreground">•</span>
        <button type="button" onClick={() => deselectAllPerms(perms, setPerms)} className="text-[11px] text-muted-foreground hover:underline">
          {isBn ? "সব আনসিলেক্ট" : "Deselect All"}
        </button>
      </div>
      {PERMISSION_GROUPS.map(group => {
        const groupPerms = ALL_PERMISSIONS.filter(p => p.group === group.key);
        return (
          <div key={group.key} className="rounded-xl bg-secondary/20 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">{isBn ? group.labelBn : group.labelEn}</p>
            <div className="space-y-1.5">
              {groupPerms.map(p => (
                <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => togglePermission(p.key, perms, setPerms)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      perms.includes(p.key)
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary/50"
                    }`}
                  >
                    {perms.includes(p.key) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-foreground">{isBn ? p.labelBn : p.labelEn}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isBn ? "ইউজার ম্যানেজমেন্ট" : "User Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isBn ? "সকল ক্লায়েন্ট ও অ্যাডমিন পরিচালনা করুন" : "Manage all clients and administrators"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv("yesshost-users", ["name", "phone", "company", "roles", "joined"],
              filtered.map(u => [u.full_name || "", u.phone || "", u.company_name || "", (u.roles || []).join(" "), csvDate(u.created_at)]))}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            {isBn ? "ইউজার তৈরি" : "Create User"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: isBn ? "মোট ইউজার" : "Total Users", value: stats.total, color: "text-primary" },
          { label: isBn ? "অ্যাডমিন" : "Admins", value: stats.admins, color: "text-destructive" },
          { label: isBn ? "কল সেন্টার" : "Call Center", value: stats.callCenter, color: "text-blue-500" },
          { label: isBn ? "এই মাসে নতুন" : "New This Month", value: stats.thisMonth, color: "text-success" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isBn ? "নাম, ফোন বা কোম্পানি দিয়ে সার্চ..." : "Search by name, phone or company..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/50 flex-wrap">
          {(["all", "admin", "call_center", "user"] as const).map(f => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter === f ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f === "all" ? (isBn ? "সকল" : "All") : f === "admin" ? (isBn ? "অ্যাডমিন" : "Admin") : f === "call_center" ? (isBn ? "কল সেন্টার" : "Call Center") : (isBn ? "ইউজার" : "User")}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "ইউজার" : "User"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{isBn ? "যোগাযোগ" : "Contact"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{isBn ? "সার্ভিস" : "Services"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "রোল" : "Role"}</th>
                <th className="text-right px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "অ্যাকশন" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${isAdmin ? "bg-destructive/15" : "bg-primary/10"} flex items-center justify-center text-sm font-bold shrink-0 ${isAdmin ? "text-destructive" : "text-primary"}`}>
                          {(u.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{u.full_name || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {isBn ? "যোগদান:" : "Joined:"} {new Date(u.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-muted-foreground text-xs">{u.phone || "—"}</p>
                      <p className="text-muted-foreground text-xs truncate">{u.company_name || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-foreground font-medium">{u.services_count || 0}</p>
                      <p className="text-[11px] text-muted-foreground">৳{formatAmount(u.invoices_total || 0, lang)} {isBn ? "পেইড" : "paid"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {isAdmin && <Badge variant="destructive" className="text-[10px]">Admin</Badge>}
                        {u.roles.includes("call_center") && <Badge className="text-[10px] bg-accent/15 text-accent-foreground border-0">CC</Badge>}
                        {u.roles.includes("moderator") && <Badge variant="outline" className="text-[10px]">Mod</Badge>}
                        {!isAdmin && !u.roles.includes("call_center") && <Badge variant="secondary" className="text-[10px]">User</Badge>}
                        {u.permissions.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">{u.permissions.length} {isBn ? "পারমিশন" : "perms"}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                          title={isBn ? "বিস্তারিত" : "View Details"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditProfileUser(u);
                            setEditProfileForm({
                              full_name: u.full_name || "",
                              phone: u.phone || "",
                              company_name: u.company_name || "",
                              company_website: u.company_website || "",
                              address: u.address || "",
                              city: u.city || "",
                              country: u.country || "",
                              vat_id: u.vat_id || "",
                            });
                          }}
                          className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-600 transition-colors"
                          title={isBn ? "প্রোফাইল এডিট" : "Edit Profile"}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditPermUser(u); setEditPerms([...u.permissions]); setEditRoles([...u.roles]); }}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title={isBn ? "অ্যাক্সেস ম্যানেজ করুন" : "Manage Access"}
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">{isBn ? "কোনো ইউজার পাওয়া যায়নি" : "No users found"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border/30 bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            {isBn ? `মোট ${filtered.length} জন ইউজার` : `${filtered.length} users total`}
            {search && (isBn ? ` "${search}" এর জন্য` : ` for "${search}"`)}
          </p>
          <DataPagination
            total={filtered.length}
            page={userPage}
            pageSize={userPageSize}
            onPage={setUserPage}
            onPageSize={setUserPageSize}
          />
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              {isBn ? "নতুন ইউজার তৈরি করুন" : "Create New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "পূর্ণ নাম" : "Full Name"}</label>
                <input value={createForm.full_name} onChange={e => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" placeholder={isBn ? "নাম লিখুন" : "Enter name"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "ফোন" : "Phone"}</label>
                <input value={createForm.phone} onChange={e => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" placeholder="01XXXXXXXXX" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "ইমেইল" : "Email"} *</label>
              <input type="email" value={createForm.email} onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" placeholder="user@example.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "পাসওয়ার্ড" : "Password"} *</label>
              <input type="password" value={createForm.password} onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" placeholder="••••••••" required />
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">{isBn ? "রোল নির্ধারণ" : "Assign Roles"}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "user", label: isBn ? "ইউজার" : "User", color: "bg-secondary/60 text-foreground" },
                  { key: "admin", label: isBn ? "অ্যাডমিন" : "Admin", color: "bg-destructive/10 text-destructive" },
                  { key: "call_center", label: isBn ? "কল সেন্টার" : "Call Center", color: "bg-primary/10 text-primary" },
                  { key: "moderator", label: isBn ? "মডারেটর" : "Moderator", color: "bg-accent/15 text-accent-foreground" },
                ].map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => toggleRole(r.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      createForm.roles.includes(r.key)
                        ? `${r.color} border-current`
                        : "bg-secondary/20 text-muted-foreground border-border/50 hover:border-primary/30"
                    }`}
                  >
                    {createForm.roles.includes(r.key) && <Check className="w-3 h-3" />}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions checklist */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">{isBn ? "পারমিশন তালিকা" : "Permissions Checklist"}</label>
              <PermissionChecklist perms={createForm.permissions} setPerms={(p) => setCreateForm(prev => ({ ...prev, permissions: p }))} />
            </div>

            {/* Submit */}
            <button
              onClick={handleCreateUser}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {creating ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> {isBn ? "ইউজার তৈরি করুন" : "Create User"}</>}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPermUser} onOpenChange={() => setEditPermUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              {isBn ? "অ্যাক্সেস ম্যানেজমেন্ট" : "Access Management"} — {editPermUser?.full_name || "User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Panel Access / Role Toggles */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{isBn ? "প্যানেল অ্যাক্সেস" : "Panel Access"}</p>
              <div className="space-y-2">
                {[
                  {
                    role: "user",
                    label: isBn ? "ক্লায়েন্ট ড্যাশবোর্ড" : "Client Dashboard",
                    desc: isBn ? "/dashboard — সার্ভিস, বিলিং, সাপোর্ট, অর্ডার" : "/dashboard — Services, Billing, Support, Orders",
                    icon: LayoutDashboard,
                    color: "bg-primary/10 text-primary border-primary/30",
                    activeColor: "bg-primary/15 border-primary/50",
                    always: true,
                  },
                  {
                    role: "call_center",
                    label: isBn ? "কল সেন্টার প্যানেল" : "Call Center Panel",
                    desc: isBn ? "/call-center — অর্ডার, লাইভ চ্যাট, টিকেট" : "/call-center — Orders, Live Chat, Tickets",
                    icon: Headphones,
                    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
                    activeColor: "bg-blue-500/15 border-blue-500/50",
                  },
                  {
                    role: "moderator",
                    label: isBn ? "মডারেটর অ্যাক্সেস" : "Moderator Access",
                    desc: isBn ? "কন্টেন্ট মডারেশন ও চ্যাট রুম" : "Content moderation & chat rooms",
                    icon: Shield,
                    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
                    activeColor: "bg-amber-500/15 border-amber-500/50",
                  },
                  {
                    role: "admin",
                    label: isBn ? "অ্যাডমিন প্যানেল" : "Admin Panel",
                    desc: isBn ? "/admin — সম্পূর্ণ সিস্টেম কন্ট্রোল" : "/admin — Full system control",
                    icon: Shield,
                    color: "bg-destructive/10 text-destructive border-destructive/30",
                    activeColor: "bg-destructive/15 border-destructive/50",
                  },
                ].map(panel => {
                  const isActive = panel.always || editRoles.includes(panel.role);
                  return (
                    <div
                      key={panel.role}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isActive ? panel.activeColor : "bg-secondary/20 border-border/40"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? panel.color : "bg-secondary/40 text-muted-foreground"}`}>
                        <panel.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{panel.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{panel.desc}</p>
                      </div>
                      {panel.always ? (
                        <Badge variant="secondary" className="text-[10px] shrink-0">{isBn ? "সবসময়" : "Always"}</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditRoles(prev =>
                              prev.includes(panel.role) ? prev.filter(r => r !== panel.role) : [...prev, panel.role]
                            );
                          }}
                          className={`shrink-0 w-12 h-7 rounded-full transition-all relative ${
                            isActive ? "bg-primary" : "bg-secondary/60 border border-border/50"
                          }`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-xs transition-all ${
                            isActive ? "left-6" : "left-1"
                          }`} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Granular Permissions */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{isBn ? "বিস্তারিত পারমিশন" : "Granular Permissions"}</p>
              <PermissionChecklist perms={editPerms} setPerms={setEditPerms} />
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={savingPerms}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {savingPerms ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> {isBn ? "সংরক্ষণ করুন" : "Save Access"}</>}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isBn ? "ইউজার বিস্তারিত" : "User Details"}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${selectedUser.roles.includes("admin") ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"} flex items-center justify-center text-xl font-bold`}>
                  {(selectedUser.full_name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedUser.full_name || "—"}</h3>
                  <p className="text-sm text-muted-foreground">{isBn ? "ক্লায়েন্ট আইডি:" : "Client ID:"} {selectedUser.user_id.slice(0, 8)}...</p>
                  <div className="flex gap-1.5 mt-1">
                    {selectedUser.roles.length > 0 ? selectedUser.roles.map(r => (
                      <Badge key={r} variant={r === "admin" ? "destructive" : "secondary"} className="text-[10px]">{r}</Badge>
                    )) : <Badge variant="secondary" className="text-[10px]">user</Badge>}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {selectedUser.permissions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">{isBn ? "পারমিশনসমূহ" : "Permissions"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.permissions.map(p => {
                      const pm = ALL_PERMISSIONS.find(ap => ap.key === p);
                      return <Badge key={p} variant="outline" className="text-[10px]">{pm ? (isBn ? pm.labelBn : pm.labelEn) : p}</Badge>;
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-secondary/30 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{selectedUser.services_count || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{isBn ? "সার্ভিস" : "Services"}</p>
                </div>
                <div className="rounded-xl bg-secondary/30 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">৳{formatAmount(selectedUser.invoices_total || 0, lang)}</p>
                  <p className="text-[10px] text-muted-foreground">{isBn ? "মোট পেইড" : "Total Paid"}</p>
                </div>
                <div className="rounded-xl bg-secondary/30 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{new Date(selectedUser.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", year: "2-digit" })}</p>
                  <p className="text-[10px] text-muted-foreground">{isBn ? "যোগদান" : "Joined"}</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Phone, label: isBn ? "ফোন" : "Phone", value: selectedUser.phone },
                  { icon: Building2, label: isBn ? "কোম্পানি" : "Company", value: selectedUser.company_name },
                  { icon: Globe, label: isBn ? "ওয়েবসাইট" : "Website", value: selectedUser.company_website },
                  { icon: MapPin, label: isBn ? "ঠিকানা" : "Address", value: [selectedUser.address, selectedUser.city, selectedUser.country].filter(Boolean).join(", ") },
                  { icon: Calendar, label: "VAT ID", value: selectedUser.vat_id },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground min-w-[80px]">{item.label}</span>
                    <span className="text-foreground font-medium">{item.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Profile Dialog */}
      <Dialog open={!!editProfileUser} onOpenChange={() => setEditProfileUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              {isBn ? "ক্লায়েন্ট প্রোফাইল এডিট" : "Edit Client Profile"} — {editProfileUser?.full_name || "User"}
            </DialogTitle>
          </DialogHeader>
          {editProfileUser && (
            <div className="space-y-4 mt-2">
              {/* Client ID badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-border/40">
                <UsersIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{isBn ? "ক্লায়েন্ট আইডি:" : "Client ID:"}</span>
                <span className="text-xs font-mono font-semibold text-foreground">{editProfileUser.user_id.slice(0, 12)}...</span>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "পূর্ণ নাম" : "Full Name"}</label>
                  <input
                    value={editProfileForm.full_name}
                    onChange={e => setEditProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                    placeholder={isBn ? "পূর্ণ নাম" : "Full name"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "ফোন নম্বর" : "Phone Number"}</label>
                  <input
                    value={editProfileForm.phone}
                    onChange={e => setEditProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "কোম্পানির নাম" : "Company Name"}</label>
                  <input
                    value={editProfileForm.company_name}
                    onChange={e => setEditProfileForm(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                    placeholder={isBn ? "কোম্পানির নাম" : "Company name"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "কোম্পানি ওয়েবসাইট" : "Company Website"}</label>
                  <input
                    value={editProfileForm.company_website}
                    onChange={e => setEditProfileForm(prev => ({ ...prev, company_website: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "ঠিকানা" : "Address"}</label>
                <input
                  value={editProfileForm.address}
                  onChange={e => setEditProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                  placeholder={isBn ? "সম্পূর্ণ ঠিকানা" : "Full address"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "শহর" : "City"}</label>
                  <input
                    value={editProfileForm.city}
                    onChange={e => setEditProfileForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                    placeholder={isBn ? "শহর" : "City"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{isBn ? "দেশ" : "Country"}</label>
                  <input
                    value={editProfileForm.country}
                    onChange={e => setEditProfileForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                    placeholder={isBn ? "দেশ" : "Country"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">VAT ID</label>
                <input
                  value={editProfileForm.vat_id}
                  onChange={e => setEditProfileForm(prev => ({ ...prev, vat_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                  placeholder="VAT ID"
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {savingProfile ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isBn ? "প্রোফাইল আপডেট করুন" : "Update Profile"}
                  </>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
