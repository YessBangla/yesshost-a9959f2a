import { useEffect, useState } from "react";
import { Server, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ServiceWithUser = Tables<"services"> & { profiles?: Tables<"profiles"> | null };

const statusOptions = ["active", "pending", "suspended", "cancelled", "expired"] as const;

const AdminServices = () => {
  const { tr } = useLanguage();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceWithUser[]>([]);
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [svc, prof] = await Promise.all([
      supabase.from("services").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    setProfiles(prof.data || []);
    const svcWithUser = (svc.data || []).map(s => ({
      ...s,
      profiles: (prof.data || []).find(p => p.user_id === s.user_id) || null,
    }));
    setServices(svcWithUser);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("services").update({ status: status as any }).eq("id", id);
    toast({ title: tr("admin.statusUpdated") });
    fetchData();
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    suspended: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    expired: "bg-muted text-muted-foreground",
  };

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.domain || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Server className="w-6 h-6" /> {tr("admin.serviceManagement")}
        </h1>
        <p className="text-sm text-muted-foreground">{tr("admin.totalServices")}: {services.length}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tr("admin.searchServices")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none"
        >
          <option value="all">{tr("admin.allStatus")}</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.serviceName")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.client")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.type")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.price")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("dash.status")}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{tr("admin.expiry")}</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{tr("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.domain || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.profiles?.full_name || s.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s.service_type}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">৳{Number(s.price_bdt).toLocaleString()}/{s.billing_cycle || "mo"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[s.status] || ""}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      onChange={e => updateStatus(s.id, e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground outline-none"
                    >
                      {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{tr("admin.noData")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminServices;
