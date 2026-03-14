import { useEffect, useState } from "react";
import { Users as UsersIcon, Search, Shield, ShieldOff, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const AdminUsers = () => {
  const { tr } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<(Tables<"profiles"> & { roles: string[] })[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("*");

    const usersWithRoles = (profiles || []).map(p => ({
      ...p,
      roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role),
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
    toast({ title: tr("admin.roleUpdated") });
    fetchUsers();
  };

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search) ||
    u.user_id.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="w-6 h-6" /> {tr("admin.userManagement")}
          </h1>
          <p className="text-sm text-muted-foreground">{tr("admin.totalUsers")}: {users.length}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tr("admin.searchUsers")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.name")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.phone")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.company")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.role")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.joined")}</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{tr("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                          {(u.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{u.full_name || "-"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.company_name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length > 0 ? u.roles.map(r => (
                          <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r === "admin" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                            {r}
                          </span>
                        )) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">user</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(selectedUser === u.user_id ? null : u.user_id)}
                          className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground"
                          title={tr("admin.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAdminRole(u.user_id, isAdmin)}
                          className={`p-2 rounded-lg hover:bg-secondary/60 ${isAdmin ? "text-destructive" : "text-muted-foreground"}`}
                          title={isAdmin ? tr("admin.removeAdmin") : tr("admin.makeAdmin")}
                        >
                          {isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{tr("admin.noData")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (() => {
        const u = users.find(x => x.user_id === selectedUser);
        if (!u) return null;
        return (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">{tr("admin.userDetails")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {[
                [tr("admin.name"), u.full_name],
                [tr("admin.phone"), u.phone],
                [tr("admin.company"), u.company_name],
                [tr("dash.website"), u.company_website],
                [tr("dash.address"), u.address],
                [tr("dash.city"), u.city],
                [tr("dash.country"), u.country],
                [tr("dash.vatId"), u.vat_id],
              ].map(([label, val]) => (
                <div key={String(label)}>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-foreground font-medium">{val || "-"}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminUsers;
