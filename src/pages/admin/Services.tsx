import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminTableSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import {
  Server, Search, AlertTriangle, CheckCircle2, Clock, XCircle, Ban,
  Globe, Calendar, CreditCard, Download
} from "lucide-react";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import DataPagination from "@/components/DataPagination";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatAmount } from "@/lib/formatPrice";
import type { Tables } from "@/integrations/supabase/types";

type ServiceWithUser = Tables<"services"> & { profiles?: Tables<"profiles"> | null };

const statusOptions = ["active", "pending", "suspended", "cancelled", "expired"] as const;

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", variant: "default" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", variant: "secondary" },
  suspended: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", variant: "destructive" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", variant: "outline" },
  expired: { icon: Ban, color: "text-muted-foreground", bg: "bg-muted", variant: "outline" },
};

const AdminServices = () => {
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceWithUser | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchData = async () => {
    const [svc, prof] = await Promise.all([
      supabase.from("services").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    const svcWithUser = (svc.data || []).map(s => ({
      ...s,
      profiles: (prof.data || []).find(p => p.user_id === s.user_id) || null,
    }));
    setServices(svcWithUser);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("services").update({ status: status as any }).eq("id", id);
    if (error) {
      toast({ title: isBn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: isBn ? `সার্ভিস "${status}" এ আপডেট হয়েছে` : `Service updated to "${status}"` });
    }
    fetchData();
  };

  const serviceTypes = [...new Set(services.map(s => s.service_type))];

  const filtered = services.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.domain || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchType = typeFilter === "all" || s.service_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: services.length,
    active: services.filter(s => s.status === "active").length,
    suspended: services.filter(s => s.status === "suspended").length,
    expiringSoon: services.filter(s => {
      if (!s.expiry_date) return false;
      const diff = new Date(s.expiry_date).getTime() - Date.now();
      return diff > 0 && diff < 30 * 86400000;
    }).length,
  };

  if (loading) return <AdminTableSkeleton columns={6} rows={6} statsCount={4} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isBn ? "সার্ভিস ম্যানেজমেন্ট" : "Service Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isBn ? "সকল ক্লায়েন্ট সার্ভিস পরিচালনা ও মনিটরিং" : "Manage and monitor all client services"}</p>
        </div>
        <button
          onClick={() => downloadCsv("yesshost-services", ["name", "type", "domain", "client", "status", "price_bdt", "expires"],
            filtered.map((s: any) => [s.name, s.service_type, s.domain || "", s.profiles?.full_name || "", s.status, s.price_bdt ?? "", csvDate(s.expires_at)]))}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary shrink-0"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isBn ? "মোট সার্ভিস" : "Total", value: stats.total, icon: Server, color: "text-primary", bg: "bg-primary/10" },
          { label: isBn ? "সক্রিয়" : "Active", value: stats.active, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
          { label: isBn ? "স্থগিত" : "Suspended", value: stats.suspended, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: isBn ? "শীঘ্র মেয়াদোত্তীর্ণ" : "Expiring Soon", value: stats.expiringSoon, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isBn ? "সার্ভিস, ডোমেইন বা ক্লায়েন্ট দিয়ে সার্চ..." : "Search service, domain or client..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden"
        >
          <option value="all">{isBn ? "সকল স্ট্যাটাস" : "All Status"}</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden"
        >
          <option value="all">{isBn ? "সকল টাইপ" : "All Types"}</option>
          {serviceTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Services Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "সার্ভিস" : "Service"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{isBn ? "ক্লায়েন্ট" : "Client"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{isBn ? "টাইপ" : "Type"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "মূল্য" : "Price"}</th>
                <th className="text-left px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                <th className="text-right px-4 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{isBn ? "অ্যাকশন" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => {
                const sc = statusConfig[s.status] || statusConfig.pending;
                const isExpiringSoon = s.expiry_date && (new Date(s.expiry_date).getTime() - Date.now()) < 30 * 86400000 && (new Date(s.expiry_date).getTime() - Date.now()) > 0;
                return (
                  <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => setSelected(s)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${sc.bg}`}><Server className={`w-4 h-4 ${sc.color}`} /></div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{s.name}</p>
                          {s.domain && <p className="text-[11px] text-primary truncate">{s.domain}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-sm">{s.profiles?.full_name || s.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px] font-mono">{s.service_type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground tabular-nums">৳{formatAmount(Number(s.price_bdt), lang)}</p>
                      <p className="text-[10px] text-muted-foreground">/{s.billing_cycle || "monthly"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={sc.variant} className="text-[10px]">{s.status}</Badge>
                        {isExpiringSoon && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <select
                        value={s.status}
                        onChange={e => updateStatus(s.id, e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/50 text-foreground outline-hidden"
                      >
                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-0">
                  <EmptyState
                    icon={Server}
                    title={isBn ? "কোনো সার্ভিস পাওয়া যায়নি" : "No services found"}
                    description={isBn ? "সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন" : "Try adjusting your search filters"}
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border/30 bg-secondary/10">
          <p className="text-xs text-muted-foreground">{isBn ? `মোট ${filtered.length} টি সার্ভিস` : `${filtered.length} services total`}</p>
          <DataPagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </div>
      </div>

      {/* Service Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isBn ? "সার্ভিস বিস্তারিত" : "Service Details"}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const sc = statusConfig[selected.status] || statusConfig.pending;
            const specs = selected.specs && typeof selected.specs === "object" ? selected.specs as Record<string, any> : null;
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${sc.bg}`}><Server className={`w-6 h-6 ${sc.color}`} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selected.name}</h3>
                    <Badge variant={sc.variant}>{selected.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Globe, label: isBn ? "ডোমেইন" : "Domain", value: selected.domain },
                    { icon: Server, label: isBn ? "আইপি" : "IP", value: selected.ip_address },
                    { icon: CreditCard, label: isBn ? "মূল্য" : "Price", value: `৳${formatAmount(Number(selected.price_bdt), lang)}/${selected.billing_cycle || "mo"}` },
                    { icon: Calendar, label: isBn ? "মেয়াদ" : "Expiry", value: selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString() : "—" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl bg-secondary/30 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.value || "—"}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-secondary/30 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{isBn ? "ক্লায়েন্ট" : "Client"}</p>
                  <p className="text-sm font-medium text-foreground">{selected.profiles?.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{selected.profiles?.phone || "—"}</p>
                </div>

                {specs && Object.keys(specs).length > 0 && (
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{isBn ? "স্পেসিফিকেশন" : "Specifications"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(specs).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] text-muted-foreground">{k}</p>
                          <p className="text-sm font-medium text-foreground">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
