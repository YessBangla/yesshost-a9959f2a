import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, ExternalLink, Search, Clock, Shield, Server, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";

const DashboardDomains = () => {
  const { user } = useAuth();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const [domains, setDomains] = useState<Tables<"services">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("services").select("*").eq("user_id", user.id).eq("service_type", "domain")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setDomains(data || []); setLoading(false); });
  }, [user]);

  const filtered = domains.filter(d =>
    !search || (d.domain || d.name).toLowerCase().includes(search.toLowerCase())
  );

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const daysUntilExpiry = (date: string | null) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

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
        <Link to="/services/domain" className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20">
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
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      )}

      {/* Domains */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <Globe className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground mb-2">{search ? (bn ? "কোনো ডোমেইন পাওয়া যায়নি" : "No domains found") : (bn ? "কোনো ডোমেইন নেই" : "No domains yet")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{bn ? "আপনার পারফেক্ট ডোমেইন রেজিস্টার করুন" : "Register your perfect domain today"}</p>
          <Link to="/services/domain" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
            {bn ? "ডোমেইন খুঁজুন" : "Search Domains"} <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d, i) => {
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
                      <button className="text-xs gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-all">
                        {bn ? "রিনিউ" : "Renew"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardDomains;
