import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { ServicesSkeleton } from "@/components/DashboardSkeleton";
import { Server, ExternalLink, Search, Filter, ChevronDown, ChevronUp, Clock, Globe, Cpu, HardDrive, Wifi, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "@/lib/router-compat";
import { getDashboardServices } from "@/lib/dashboard.functions";
import { logApiError } from "@/lib/errorReporting";
import DataPagination from "@/components/DataPagination";
import { formatAmount } from "@/lib/formatPrice";

const statusConfig: Record<string, { label_en: string; label_bn: string; color: string; dot: string }> = {
  active: { label_en: "Active", label_bn: "সক্রিয়", color: "bg-success/10 text-success", dot: "bg-success" },
  pending: { label_en: "Pending", label_bn: "পেন্ডিং", color: "bg-warning/10 text-warning", dot: "bg-warning" },
  suspended: { label_en: "Suspended", label_bn: "স্থগিত", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  cancelled: { label_en: "Cancelled", label_bn: "বাতিল", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  expired: { label_en: "Expired", label_bn: "মেয়াদোত্তীর্ণ", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const typeLabels: Record<string, { en: string; bn: string }> = {
  shared_hosting: { en: "Shared Hosting", bn: "শেয়ার্ড হোস্টিং" },
  cloud_hosting: { en: "Cloud Hosting", bn: "ক্লাউড হোস্টিং" },
  vps: { en: "VPS Server", bn: "VPS সার্ভার" },
  wordpress: { en: "WordPress", bn: "ওয়ার্ডপ্রেস" },
  reseller: { en: "Reseller", bn: "রিসেলার" },
  domain: { en: "Domain", bn: "ডোমেইন" },
  ssl: { en: "SSL Certificate", bn: "SSL সার্টিফিকেট" },
  email: { en: "Email Hosting", bn: "ইমেইল হোস্টিং" },
};

const DashboardServices = () => {
  const { user } = useAuth();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Server-side fetch keeps the service list identical on SSR and in the browser.
  const fetchServices = useServerFn(getDashboardServices);
  const servicesQuery = useQuery({
    queryKey: ["dashboard", "services", user?.id ?? "anon"],
    queryFn: () => fetchServices(),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (servicesQuery.error) logApiError("dashboard.services", servicesQuery.error, { area: "api" });
  }, [servicesQuery.error]);

  const services: Tables<"services">[] = servicesQuery.data?.services ?? [];
  const loading = !!user && servicesQuery.isPending;

  const filtered = services.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.domain || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const statusCounts = services.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // 30 days
  };

  if (loading) return <ServicesSkeleton />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "আমার সার্ভিস" : "My Services"}</h1>
          <p className="text-sm text-muted-foreground">{bn ? `মোট ${services.length}টি সার্ভিস` : `${services.length} total services`}</p>
        </div>
        <Link to="/hosting-plans" className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20">
          {bn ? "নতুন সার্ভিস" : "New Service"} <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === "all" ? "gradient-primary text-primary-foreground shadow-xs" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          {bn ? "সব" : "All"} ({services.length})
        </button>
        {Object.entries(statusCounts).map(([status, count]) => {
          const sc = statusConfig[status];
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${filterStatus === status ? "gradient-primary text-primary-foreground shadow-xs" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sc?.dot || "bg-muted-foreground"}`} />
              {bn ? sc?.label_bn : sc?.label_en} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={bn ? "সার্ভিস বা ডোমেইন খুঁজুন..." : "Search services or domains..."}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm transition-all"
        />
      </div>

      {/* Services List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <Server className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground mb-2">{search ? (bn ? "কোনো সার্ভিস পাওয়া যায়নি" : "No services found") : (bn ? "কোনো সার্ভিস নেই" : "No services yet")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{bn ? "আপনার পছন্দের প্ল্যান বেছে নিন" : "Choose a plan that suits your needs"}</p>
          <Link to="/hosting-plans" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
            {bn ? "প্ল্যান দেখুন" : "Browse Plans"} <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map((service, i) => {
            const sc = statusConfig[service.status] || statusConfig.pending;
            const tl = typeLabels[service.service_type] || { en: service.service_type, bn: service.service_type };
            const expanded = expandedId === service.id;
            const expiring = isExpiringSoon(service.expiry_date);
            const specs = service.specs as Record<string, any> | null;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card rounded-xl overflow-hidden transition-all ${expiring ? "border-warning/30" : ""}`}
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : service.id)}
                  className="w-full p-4 sm:p-5 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {service.service_type === "domain" ? <Globe className="w-5 h-5 text-primary" /> : <Server className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{service.name}</h3>
                          {expiring && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-warning/10 text-warning font-medium shrink-0">
                              {bn ? "শীঘ্রই মেয়াদ শেষ" : "Expiring soon"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {service.domain ? `${service.domain} • ` : ""}{bn ? tl.bn : tl.en}{service.plan ? ` • ${service.plan}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${service.status === "active" ? "animate-pulse" : ""}`} />
                        {bn ? sc.label_bn : sc.label_en}
                      </span>
                      <span className="text-sm font-bold text-foreground tabular-nums">৳{formatAmount(Number(service.price_bdt), lang)}</span>
                      <span className="text-[10px] text-muted-foreground">/{service.billing_cycle === "yearly" ? (bn ? "বছর" : "yr") : (bn ? "মাস" : "mo")}</span>
                      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          {service.ip_address && (
                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Wifi className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wider font-medium">{bn ? "আইপি" : "IP Address"}</span>
                              </div>
                              <p className="text-xs font-mono font-semibold text-foreground">{service.ip_address}</p>
                            </div>
                          )}
                          {service.start_date && (
                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wider font-medium">{bn ? "শুরু" : "Started"}</span>
                              </div>
                              <p className="text-xs font-semibold text-foreground">{new Date(service.start_date).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                          )}
                          {service.expiry_date && (
                            <div className={`p-3 rounded-lg border ${expiring ? "bg-warning/5 border-warning/20" : "bg-secondary/30 border-border"}`}>
                              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wider font-medium">{bn ? "মেয়াদ শেষ" : "Expires"}</span>
                              </div>
                              <p className={`text-xs font-semibold ${expiring ? "text-warning" : "text-foreground"}`}>{new Date(service.expiry_date).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                              <HardDrive className="w-3 h-3" />
                              <span className="text-[10px] uppercase tracking-wider font-medium">{bn ? "বিলিং" : "Billing"}</span>
                            </div>
                            <p className="text-xs font-semibold text-foreground capitalize">{service.billing_cycle}</p>
                          </div>
                        </div>

                        {/* Specs */}
                        {specs && Object.keys(specs).length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-secondary/20 border border-border">
                            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Cpu className="w-3 h-3" /> {bn ? "স্পেসিফিকেশন" : "Specifications"}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Object.entries(specs).map(([key, val]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                                  <span className="font-semibold text-foreground">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          <DataPagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardServices;
