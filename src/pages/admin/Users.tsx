import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users as UsersIcon, Search, Shield, ShieldOff, Eye, X,
  Mail, Phone, MapPin, Building2, Calendar, Globe, Filter, Headphones
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type UserWithRoles = Tables<"profiles"> & { roles: string[]; services_count?: number; invoices_total?: number };

const AdminUsers = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user" | "call_center">("all");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  const fetchUsers = async () => {
    const [profiles, roles, services, invoices] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("services").select("user_id, id"),
      supabase.from("invoices").select("user_id, amount_bdt, status"),
    ]);

    const usersWithRoles: UserWithRoles[] = (profiles.data || []).map(p => ({
      ...p,
      roles: (roles.data || []).filter(r => r.user_id === p.user_id).map(r => r.role),
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
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    }
    toast({ title: isBn ? "রোল আপডেট হয়েছে" : "Role updated" });
    fetchUsers();
  };

  const toggleCallCenterRole = async (userId: string, hasCC: boolean) => {
    if (hasCC) {
      const { data: roleData } = await supabase.from("user_roles").select("id").eq("user_id", userId).eq("role", "call_center" as any).single();
      if (roleData) await supabase.from("user_roles").delete().eq("id", roleData.id);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "call_center" as any });
    }
    toast({ title: isBn ? "কল সেন্টার রোল আপডেট হয়েছে" : "Call center role updated" });
    fetchUsers();
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isBn ? "ইউজার ম্যানেজমেন্ট" : "User Management"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{isBn ? "সকল ক্লায়েন্ট ও অ্যাডমিন পরিচালনা করুন" : "Manage all clients and administrators"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isBn ? "মোট ইউজার" : "Total Users", value: stats.total, color: "text-primary" },
          { label: isBn ? "অ্যাডমিন" : "Admins", value: stats.admins, color: "text-destructive" },
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/50">
          {(["all", "admin", "user"] as const).map(f => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f === "all" ? (isBn ? "সকল" : "All") : f === "admin" ? (isBn ? "অ্যাডমিন" : "Admin") : (isBn ? "ইউজার" : "User")}
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
              {filtered.map((u) => {
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
                        {isAdmin ? (
                          <Badge variant="destructive" className="text-[10px]">Admin</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">User</Badge>
                        )}
                        {u.roles.includes("moderator") && <Badge variant="outline" className="text-[10px]">Mod</Badge>}
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
                          onClick={() => toggleAdminRole(u.user_id, isAdmin)}
                          className={`p-2 rounded-lg transition-colors ${isAdmin ? "hover:bg-destructive/10 text-destructive" : "hover:bg-secondary/60 text-muted-foreground"}`}
                          title={isAdmin ? (isBn ? "অ্যাডমিন সরান" : "Remove Admin") : (isBn ? "অ্যাডমিন করুন" : "Make Admin")}
                        >
                          {isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
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
        {/* Result count */}
        <div className="px-4 py-3 border-t border-border/30 bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            {isBn ? `${filtered.length} জন ইউজার দেখাচ্ছে` : `Showing ${filtered.length} users`}
            {search && (isBn ? ` "${search}" এর জন্য` : ` for "${search}"`)}
          </p>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isBn ? "ইউজার বিস্তারিত" : "User Details"}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              {/* User header */}
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

              {/* Stats */}
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

              {/* Details */}
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
    </div>
  );
};

export default AdminUsers;
