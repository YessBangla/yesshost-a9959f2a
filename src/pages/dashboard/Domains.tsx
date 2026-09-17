import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Globe, ExternalLink, Search, Clock, Shield, Server, AlertTriangle } from "lucide-react";
import { DomainsSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "@/lib/router-compat";
import { getDashboardDomains } from "@/lib/dashboard.functions";
import DataPagination from "@/components/DataPagination";
import { logApiError } from "@/lib/errorReporting";

const DashboardDomains = () => {
  const { user } = useAuth();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Server-side fetch keeps the domain list identical on SSR and in the browser.
  const fetchDomains = useServerFn(getDashboardDomains);
  const domainsQuery = useQuery({
    queryKey: ["dashboard", "domains", user?.id ?? "anon"],
    queryFn: () => fetchDomains(),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (domainsQuery.error) logApiError("dashboard.domains", domainsQuery.error, { area: "domain" });
  }, [domainsQuery.error]);

  const domains: Tables<"services">[] = domainsQuery.data?.domains ?? [];
  const loading = !!user && domainsQuery.isPending;

  const filtered = domains.filter(d =>
    !search || (d.domain || d.name).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setPage(1); }, [search]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const daysUntilExpiry = (date: string | null) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  };

  if (loading) return <DomainsSkeleton />;

  const activeDomains = domains.filter(d => d.status === "active").length;
  const expiringSoon = domains.filter(d => isExpiringSoon(d.expiry_date)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "আমার ডোমেইন" : "My Domains"}</h1>
          <p className="text-sm text-muted-foreground">{bn ? "আপনার নিবন্ধিত ডোমেইন পরিচালনা করুন" : "Manage your registered domains"}</p>
        </div>
        <Link to="/domain-search" className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20">
          {bn ? "নতুন ডোমেইন" : "Register Domain"}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <Globe className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground">{domains.length}</p>
          <p className="text-[10px] text-muted-foreground">{bn ? "মোট ডোমেইন" : "Total"}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Shield className="w-5 h-5 text-success mx-auto mb-1.5" />
          <p className="text-lg font-bold text-success">{activeDomains}</p>
          <p className="text-[10px] text-muted-foreground">{bn ? "সক্রিয়" : "Active"}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1.5" />
          <p className="text-lg font-bold text-warning">{expiringSoon}</p>
          <p className="text-[10px] text-muted-foreground">{bn ? "শীঘ্রই শেষ" : "Expiring"}</p>
        </div>
      </div>

      {/* Search */}
      {domains.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={bn ? "ডোমেইন খুঁজুন..." : "Search domains..."}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      )}

      {/* Domains */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={search ? (bn ? "কোনো ডোমেইন পাওয়া যায়নি" : "No domains found") : (bn ? "কোনো ডোমেইন নেই" : "No domains yet")}
          description={bn ? "আপনার পারফেক্ট ডোমেইন রেজিস্টার করুন" : "Register your perfect domain today"}
          actionLabel={bn ? "ডোমেইন খুঁজুন" : "Search Domains"}
          actionTo="/services/domain"
        />
      ) : (
        <div className="space-y-3">
          {paged.map((d, i) => {
            const expiring = isExpiringSoon(d.expiry_date);
            const days = daysUntilExpiry(d.expiry_date);

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card p-4 sm:p-5 rounded-xl ${expiring ? "border-warning/30" : ""}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${d.status === "active" ? "bg-success/10" : "bg-warning/10"}`}>
                      <Globe className={`w-5 h-5 ${d.status === "active" ? "text-success" : "text-warning"}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{d.domain || d.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {d.expiry_date && (
                          <span className={`text-[11px] flex items-center gap-1 ${expiring ? "text-warning font-medium" : "text-muted-foreground"}`}>
                            <Clock className="w-3 h-3" />
                            {expiring && days !== null
                              ? (bn ? `${days} দিন বাকি` : `${days} days left`)
                              : (bn ? "মেয়াদ: " : "Exp: ") + new Date(d.expiry_date).toLocaleDateString(bn ? "bn-BD" : "en-US", { month: "short", day: "numeric", year: "numeric" })
                            }
                          </span>
                        )}
                        {d.ip_address && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Server className="w-3 h-3" /> {d.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${d.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.status === "active" ? "bg-success animate-pulse" : "bg-warning"}`} />
                      {d.status === "active" ? (bn ? "সক্রিয়" : "Active") : d.status}
                    </span>
                    {expiring && (
                      <Link
                        to="/dashboard/billing"
                        className="text-xs gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-all"
                      >
                        {bn ? "রিনিউ" : "Renew"}
                      </Link>
                    )}
                  </div>
                </div>
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

export default DashboardDomains;
