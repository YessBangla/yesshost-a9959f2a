import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Plus, HardDrive, Wifi, Users, Globe, Mail, Lock, Pause, Play, Trash2,
  Check, AlertTriangle, Package, Settings, Shield, Activity,
  Search, RefreshCw, Eye, EyeOff, ChevronRight, ChevronDown,
  TrendingUp, ExternalLink, Copy, MoreVertical, Clock, Layers
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const formatSize = (mb: number) => mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb} MB`;
const pct = (used: number, max: number) => max > 0 ? Math.min(100, (used / max) * 100) : 0;
const getStatusColor = (p: number) => p > 90 ? "text-destructive" : p > 70 ? "text-amber-500" : "text-emerald-500";
const getBarColor = (p: number) => p > 90 ? "bg-destructive" : p > 70 ? "bg-amber-500" : "bg-primary";

const ResellerDashboard = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "accounts" | "details">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    domain: "", username: "", password: "", email: "",
    plan_name: "Basic", disk_quota_mb: 1000, bandwidth_mb: 10000,
  });

  const fetchPackages = useCallback(async () => {
    if (!user) { setPackages([]); setSelectedPkg(null); setAccounts([]); setLoading(false); return; }
    setLoading(true); setLoadError(null);
    const { data, error } = await supabase.from("reseller_packages").select("*, service:services(price_bdt, billing_cycle, name)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { setPackages([]); setSelectedPkg(null); setAccounts([]); setLoadError(error.message); setLoading(false); return; }
    let pkgs = data || [];
    // Fall back to the user's reseller service price when the package has no linked service
    if (pkgs.length && pkgs.some(p => !p.service?.price_bdt)) {
      const { data: svc } = await supabase.from("services").select("id, price_bdt, billing_cycle, name").eq("user_id", user.id).eq("service_type", "reseller").order("created_at", { ascending: false }).limit(1);
      if ((svc?.[0]?.price_bdt ?? 0) > 0) pkgs = pkgs.map(p => (p.service?.price_bdt ? p : { ...p, service: svc![0] }));
    }
    setPackages(pkgs);
    if (pkgs.length === 0) { setSelectedPkg(null); setAccounts([]); setLoading(false); return; }
    const next = pkgs.find(p => p.id === selectedPkg?.id) || pkgs[0];
    setSelectedPkg(next);
    await fetchAccounts(next.id);
    setLoading(false);
  }, [user, selectedPkg?.id]);

  const fetchAccounts = async (pkgId: string) => {
    setAccountsLoading(true);
    const { data } = await supabase.from("reseller_accounts").select("*").eq("reseller_package_id", pkgId).order("created_at", { ascending: false });
    setAccounts(data || []);
    setAccountsLoading(false);
  };

  useEffect(() => { fetchPackages(); }, [user]);

  const selectPackage = (pkg: any) => { setSelectedPkg(pkg); fetchAccounts(pkg.id); setActiveView("overview"); };

  const handleCreateAccount = async () => {
    if (!selectedPkg || !createForm.domain || !createForm.username || !createForm.password) {
      toast({ title: bn ? "সকল ফিল্ড পূরণ করুন" : "Fill all required fields", variant: "destructive" }); return;
    }
    if (createForm.username.length < 3 || createForm.username.length > 16) {
      toast({ title: bn ? "ইউজারনেম ৩-১৬ অক্ষরের হতে হবে" : "Username must be 3-16 characters", variant: "destructive" }); return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("whm-manage", {
        body: { action: "create_account", reseller_package_id: selectedPkg.id, ...createForm },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: bn ? "অ্যাকাউন্ট তৈরি হয়েছে!" : "Account created!" });
      setShowCreate(false);
      setCreateForm({ domain: "", username: "", password: "", email: "", plan_name: "Basic", disk_quota_mb: 1000, bandwidth_mb: 10000 });
      fetchPackages();
    } catch (err: any) { toast({ title: bn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" }); }
    setCreating(false);
  };

  const handleAction = async (accountId: string, action: "suspend_account" | "unsuspend_account" | "terminate_account") => {
    if (action === "terminate_account" && !confirm(bn ? "এই অ্যাকাউন্ট ও সমস্ত ডেটা মুছে যাবে।" : "This account and all data will be deleted.")) return;
    try {
      const { data, error } = await supabase.functions.invoke("whm-manage", {
        body: { action, reseller_package_id: selectedPkg.id, account_id: accountId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: bn ? "সফল!" : "Success!" });
      fetchPackages();
    } catch (err: any) { toast({ title: bn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" }); }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchSearch = !searchTerm || a.domain.toLowerCase().includes(searchTerm.toLowerCase())
        || a.username.toLowerCase().includes(searchTerm.toLowerCase())
        || (a.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [accounts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const active = accounts.filter(a => a.status === "active").length;
    const suspended = accounts.filter(a => a.status === "suspended").length;
    const totalDisk = accounts.reduce((s, a) => s + (a.disk_quota_mb || 0), 0);
    const totalBw = accounts.reduce((s, a) => s + (a.bandwidth_mb || 0), 0);
    return { total: accounts.length, active, suspended, totalDisk, totalBw };
  }, [accounts]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: bn ? "কপি হয়েছে" : "Copied!" });
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{bn ? "লোড হচ্ছে..." : "Loading..."}</p>
      </div>
    </div>
  );

  // ── Empty State ──
  if (packages.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
        <Server className="w-12 h-12 text-primary/40" />
      </motion.div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        {loadError ? (bn ? "লোড করা যায়নি" : "Failed to load") : (bn ? "রিসেলার প্যাকেজ নেই" : "No Reseller Package")}
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {loadError ? (bn ? "ডেটা পড়তে সমস্যা হয়েছে।" : "Problem reading data.") : (bn ? "রিসেলার হোস্টিং ক্রয় করলে এখানে ক্লায়েন্ট অ্যাকাউন্ট পরিচালনা করতে পারবেন।" : "Purchase a reseller plan to manage client accounts.")}
      </p>
      {loadError && (
        <button onClick={fetchPackages} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <RefreshCw className="w-4 h-4" /> {bn ? "আবার চেষ্টা করুন" : "Try again"}
        </button>
      )}
    </div>
  );

  const accPct = pct(selectedPkg?.used_accounts || 0, selectedPkg?.max_accounts || 1);
  const diskPct = pct(selectedPkg?.used_disk_mb || 0, selectedPkg?.max_disk_mb || 1);
  const bwPct = pct(selectedPkg?.used_bandwidth_mb || 0, selectedPkg?.max_bandwidth_mb || 1);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4 text-primary-foreground" />
            </div>
            {bn ? "রিসেলার প্যানেল" : "Reseller Panel"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-10">
            {bn ? "হোস্টিং প্যাকেজ ও ক্লায়েন্ট ম্যানেজমেন্ট" : "Hosting packages & client management"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { fetchPackages(); }} className="p-2 rounded-xl border border-border/50 hover:bg-secondary/50 text-muted-foreground transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {selectedPkg && (
            <button onClick={() => setShowCreate(true)} disabled={selectedPkg.used_accounts >= selectedPkg.max_accounts}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{bn ? "নতুন অ্যাকাউন্ট" : "New Account"}</span>
              <span className="sm:hidden">{bn ? "নতুন" : "New"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Package Switcher (multiple packages) ── */}
      {packages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {packages.map(pkg => {
            const isSelected = selectedPkg?.id === pkg.id;
            const pkgAccPct = pct(pkg.used_accounts, pkg.max_accounts);
            return (
              <button key={pkg.id} onClick={() => selectPackage(pkg)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isSelected ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-secondary/30"
                }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary-foreground/20" : "bg-secondary"}`}>
                  <Package className={`w-3 h-3 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="text-left">
                  <p className="font-semibold leading-tight">{pkg.package_name}</p>
                  <p className={`text-[9px] leading-tight ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                    {pkg.used_accounts}/{pkg.max_accounts} {bn ? "অ্যাকাউন্ট" : "accounts"}
                  </p>
                </div>
                {pkg.status !== "active" && <Badge variant="destructive" className="text-[8px] px-1 py-0">{bn ? "স্থগিত" : "Off"}</Badge>}
              </button>
            );
          })}
        </div>
      )}

      {selectedPkg && (
        <>
          {/* ── View Switcher ── */}
          <div className="flex items-center gap-1 p-1 bg-secondary/40 rounded-xl w-fit">
            {[
              { key: "overview" as const, label: bn ? "ওভারভিউ" : "Overview", icon: Layers },
              { key: "accounts" as const, label: bn ? "অ্যাকাউন্ট" : "Accounts", icon: Users },
              { key: "details" as const, label: bn ? "ডিটেইল" : "Details", icon: Settings },
            ].map(v => (
              <button key={v.key} onClick={() => setActiveView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === v.key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}>
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
                {v.key === "accounts" && <span className="text-[9px] opacity-60">({stats.total})</span>}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ═══════════ OVERVIEW ═══════════ */}
            {activeView === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                
                {/* Resource Gauges */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: bn ? "অ্যাকাউন্ট" : "Accounts", used: selectedPkg.used_accounts, max: selectedPkg.max_accounts, format: (v: number) => String(v), icon: Users },
                    { label: bn ? "ডিস্ক" : "Disk", used: selectedPkg.used_disk_mb, max: selectedPkg.max_disk_mb, format: formatSize, icon: HardDrive },
                    { label: bn ? "ব্যান্ডউইথ" : "Bandwidth", used: selectedPkg.used_bandwidth_mb, max: selectedPkg.max_bandwidth_mb, format: formatSize, icon: Wifi },
                  ].map((q, i) => {
                    const p = pct(q.used, q.max);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                        className="glass-card rounded-xl p-3 sm:p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[2rem] bg-gradient-to-bl from-primary/5 to-transparent" />
                        <div className="flex items-center gap-1.5 mb-2">
                          <q.icon className={`w-3.5 h-3.5 ${getStatusColor(p)}`} />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{q.label}</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-foreground">{q.format(q.used)}</p>
                        <p className="text-[10px] text-muted-foreground mb-2">/ {q.format(q.max)}</p>
                        <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${getBarColor(p)}`} />
                        </div>
                        <p className={`text-[9px] mt-1 ${getStatusColor(p)}`}>{p.toFixed(0)}%</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Cost Overview */}
                {selectedPkg.service?.price_bdt > 0 && (
                  <div className="glass-card rounded-xl p-3 sm:p-4">
                    <h3 className="text-xs font-semibold text-foreground mb-3">{bn ? "খরচের হিসাব" : "Cost Overview"}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: bn ? (selectedPkg.service.billing_cycle === "yearly" ? "বার্ষিক খরচ" : "মাসিক খরচ") : (selectedPkg.service.billing_cycle === "yearly" ? "Yearly cost" : "Monthly cost"), value: `৳${Number(selectedPkg.service.price_bdt).toLocaleString(bn ? "bn-BD" : "en-US")}` },
                        { label: bn ? "প্রতি অ্যাকাউন্ট খরচ" : "Cost per account", value: `৳${(Number(selectedPkg.service.price_bdt) / (selectedPkg.max_accounts || 1)).toFixed(0)}` },
                        { label: bn ? "বরাদ্দ অ্যাকাউন্ট" : "Allotted accounts", value: String(selectedPkg.max_accounts) },
                        { label: bn ? "ব্যবহৃত অ্যাকাউন্ট" : "Used accounts", value: String(selectedPkg.used_accounts) },
                      ].map((c, i) => (
                        <div key={i} className="bg-secondary/30 rounded-lg p-2.5 text-center">
                          <p className="text-sm font-bold text-foreground">{c.value}</p>
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Summary Bar */}
                <div className="glass-card rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-foreground">{bn ? "অ্যাকাউন্ট সারাংশ" : "Account Summary"}</h3>
                    <Badge variant="outline" className="text-[10px]">{selectedPkg.package_name}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: bn ? "মোট" : "Total", value: stats.total, color: "text-foreground", bg: "bg-secondary/50" },
                      { label: bn ? "সক্রিয়" : "Active", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                      { label: bn ? "স্থগিত" : "Suspended", value: stats.suspended, color: "text-destructive", bg: "bg-destructive/10" },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-lg p-2.5 text-center`}>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: bn ? "অ্যাকাউন্ট তৈরি" : "Create Account", icon: Plus, action: () => setShowCreate(true), disabled: selectedPkg.used_accounts >= selectedPkg.max_accounts, accent: true },
                    { label: bn ? "সব অ্যাকাউন্ট" : "All Accounts", icon: Users, action: () => setActiveView("accounts") },
                    { label: bn ? "প্যাকেজ ডিটেইল" : "Package Details", icon: Package, action: () => setActiveView("details") },
                    { label: bn ? "সার্ভার ইনফো" : "Server Info", icon: Server, action: () => setActiveView("details") },
                  ].map((qa, i) => (
                    <motion.button key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                      onClick={qa.action} disabled={qa.disabled}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all disabled:opacity-40 ${
                        qa.accent ? "bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary" : "border-border/30 hover:bg-secondary/30 hover:border-primary/20 text-muted-foreground hover:text-foreground"
                      }`}>
                      <qa.icon className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-medium">{qa.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Recent Accounts */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-foreground">{bn ? "সাম্প্রতিক অ্যাকাউন্ট" : "Recent Accounts"}</h3>
                    <button onClick={() => setActiveView("accounts")} className="text-[10px] text-primary font-medium flex items-center gap-0.5 hover:underline">
                      {bn ? "সব দেখুন" : "View all"} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {accounts.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground">{bn ? "কোনো অ্যাকাউন্ট নেই" : "No accounts yet"}</p>
                      <button onClick={() => setShowCreate(true)} className="mt-2 text-xs text-primary font-medium hover:underline">
                        {bn ? "প্রথম অ্যাকাউন্ট তৈরি করুন" : "Create your first account"}
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {accounts.slice(0, 5).map((acc, i) => (
                        <motion.div key={acc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="flex items-center justify-between px-4 py-3 hover:bg-secondary/10 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${acc.status === "active" ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                              <Globe className={`w-3.5 h-3.5 ${acc.status === "active" ? "text-emerald-500" : "text-destructive"}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{acc.domain}</p>
                              <p className="text-[10px] text-muted-foreground">{acc.username} · {acc.plan_name} · {formatSize(acc.disk_quota_mb)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {acc.cpanel_created && <Badge variant="outline" className="text-[8px] px-1">cPanel</Badge>}
                            <div className={`w-2 h-2 rounded-full ${acc.status === "active" ? "bg-emerald-500" : "bg-destructive"}`} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════ ACCOUNTS ═══════════ */}
            {activeView === "accounts" && (
              <motion.div key="accounts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      placeholder={bn ? "ডোমেইন, ইউজারনেম..." : "Domain, username..."}
                      className="flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground/50" />
                    {searchTerm && <button onClick={() => setSearchTerm("")} className="text-muted-foreground hover:text-foreground"><span className="text-xs">✕</span></button>}
                  </div>
                  <div className="flex gap-1">
                    {[
                      { key: "all", label: bn ? "সব" : "All", count: accounts.length },
                      { key: "active", label: bn ? "সক্রিয়" : "Active", count: stats.active },
                      { key: "suspended", label: bn ? "স্থগিত" : "Off", count: stats.suspended },
                    ].map(s => (
                      <button key={s.key} onClick={() => setStatusFilter(s.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                          statusFilter === s.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
                        }`}>
                        {s.label} <span className="opacity-50 ml-0.5">{s.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account List */}
                {accountsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="glass-card rounded-xl px-4 py-12 text-center">
                    <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">{searchTerm ? (bn ? "কোনো ফলাফল নেই" : "No results") : (bn ? "কোনো অ্যাকাউন্ট নেই" : "No accounts")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAccounts.map((acc, i) => {
                      const isExpanded = expandedAccount === acc.id;
                      return (
                        <motion.div key={acc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                          className="glass-card rounded-xl overflow-hidden">
                          {/* Main Row */}
                          <div className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer" onClick={() => setExpandedAccount(isExpanded ? null : acc.id)}>
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${acc.status === "active" ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                              <Globe className={`w-4 h-4 sm:w-5 sm:h-5 ${acc.status === "active" ? "text-emerald-500" : "text-destructive"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-foreground truncate">{acc.domain}</p>
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${acc.status === "active" ? "bg-emerald-500" : "bg-destructive"}`} />
                                {acc.cpanel_created && <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0">cPanel</Badge>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                <span>{acc.username}</span>
                                <span>·</span>
                                <span>{acc.plan_name}</span>
                                <span>·</span>
                                <span>{formatSize(acc.disk_quota_mb)}</span>
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden">
                                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 space-y-3">
                                  <div className="h-px bg-border/30" />
                                  {/* Details Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                      { icon: Users, label: bn ? "ইউজারনেম" : "Username", value: acc.username },
                                      { icon: HardDrive, label: bn ? "ডিস্ক" : "Disk", value: formatSize(acc.disk_quota_mb) },
                                      { icon: Wifi, label: bn ? "ব্যান্ডউইথ" : "Bandwidth", value: formatSize(acc.bandwidth_mb) },
                                      { icon: Mail, label: bn ? "ইমেইল" : "Email", value: acc.email || "—" },
                                    ].map((d, j) => (
                                      <div key={j} className="bg-secondary/20 rounded-lg p-2">
                                        <div className="flex items-center gap-1 mb-0.5">
                                          <d.icon className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{d.label}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-foreground truncate">{d.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Meta */}
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(acc.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</span>
                                    {acc.suspended_at && <span className="text-destructive">{bn ? "স্থগিত:" : "Suspended:"} {new Date(acc.suspended_at).toLocaleDateString()}</span>}
                                  </div>
                                  {/* Actions */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={() => copyToClipboard(acc.domain)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                      <Copy className="w-3 h-3" /> {bn ? "ডোমেইন কপি" : "Copy Domain"}
                                    </button>
                                    {acc.status === "active" ? (
                                      <button onClick={() => handleAction(acc.id, "suspend_account")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-xs text-amber-600 hover:bg-amber-500/20 transition-colors">
                                        <Pause className="w-3 h-3" /> {bn ? "স্থগিত" : "Suspend"}
                                      </button>
                                    ) : (
                                      <button onClick={() => handleAction(acc.id, "unsuspend_account")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                                        <Play className="w-3 h-3" /> {bn ? "সক্রিয়" : "Activate"}
                                      </button>
                                    )}
                                    <button onClick={() => handleAction(acc.id, "terminate_account")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 text-xs text-destructive hover:bg-destructive/20 transition-colors">
                                      <Trash2 className="w-3 h-3" /> {bn ? "মুছুন" : "Delete"}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══════════ DETAILS ═══════════ */}
            {activeView === "details" && (
              <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                {/* Package Info Card */}
                <div className="glass-card rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-foreground">{selectedPkg.package_name}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {bn ? "তৈরি:" : "Created:"} {new Date(selectedPkg.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                      </p>
                    </div>
                    <Badge variant={selectedPkg.status === "active" ? "default" : "destructive"}>
                      {selectedPkg.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended")}
                    </Badge>
                  </div>

                  {/* Resource Meters */}
                  <div className="space-y-4">
                    {[
                      { label: bn ? "অ্যাকাউন্ট স্লট" : "Account Slots", icon: Users, used: selectedPkg.used_accounts, max: selectedPkg.max_accounts, format: (v: number) => String(v) },
                      { label: bn ? "ডিস্ক স্পেস" : "Disk Space", icon: HardDrive, used: selectedPkg.used_disk_mb, max: selectedPkg.max_disk_mb, format: formatSize },
                      { label: bn ? "মাসিক ব্যান্ডউইথ" : "Monthly Bandwidth", icon: Wifi, used: selectedPkg.used_bandwidth_mb, max: selectedPkg.max_bandwidth_mb, format: formatSize },
                    ].map((r, i) => {
                      const p = pct(r.used, r.max);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <r.icon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-foreground">{r.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{r.format(r.used)} / {r.format(r.max)}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-secondary/50 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full transition-colors ${getBarColor(p)} ${p > 90 ? "animate-pulse" : ""}`} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-[10px] ${getStatusColor(p)}`}>{p.toFixed(1)}% {bn ? "ব্যবহৃত" : "used"}</p>
                            <p className="text-[10px] text-muted-foreground">{r.format(r.max - r.used)} {bn ? "অবশিষ্ট" : "free"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Server Info */}
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-primary" />
                    {bn ? "সার্ভার তথ্য" : "Server Information"}
                  </h4>
                  <div className="space-y-0">
                    {[
                      { label: bn ? "সার্ভার হোস্ট" : "Server Host", value: selectedPkg.whm_server_host || "—", mono: true },
                      { label: bn ? "WHM ইউজারনেম" : "WHM Username", value: selectedPkg.whm_username || "—", mono: true },
                      { label: bn ? "স্ট্যাটাস" : "Status", value: selectedPkg.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended") },
                      { label: "cPanel", value: "Port 2083" },
                      { label: "WHM", value: "Port 2087" },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <span className={`text-xs font-medium text-foreground ${s.mono ? "font-mono" : ""}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                {selectedPkg.whm_server_host && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "WHM Panel", url: `https://${selectedPkg.whm_server_host}:2087`, icon: Shield },
                      { label: "cPanel", url: `https://${selectedPkg.whm_server_host}:2083`, icon: Globe },
                    ].map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="glass-card flex items-center gap-2.5 p-3 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <link.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{link.label}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{selectedPkg.whm_server_host}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Package Specs */}
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-foreground mb-3">{bn ? "প্যাকেজ স্পেসিফিকেশন" : "Package Specifications"}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Users, label: bn ? "সর্বোচ্চ অ্যাকাউন্ট" : "Max Accounts", value: String(selectedPkg.max_accounts) },
                      { icon: HardDrive, label: bn ? "সর্বোচ্চ ডিস্ক" : "Max Disk", value: formatSize(selectedPkg.max_disk_mb) },
                      { icon: Wifi, label: bn ? "সর্বোচ্চ ব্যান্ডউইথ" : "Max Bandwidth", value: formatSize(selectedPkg.max_bandwidth_mb) },
                      { icon: Activity, label: bn ? "ব্যবহৃত অ্যাকাউন্ট" : "Used Accounts", value: String(selectedPkg.used_accounts) },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/20">
                        <f.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-muted-foreground">{f.label}</p>
                          <p className="text-xs font-bold text-foreground">{f.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Create Account Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              {bn ? "নতুন cPanel অ্যাকাউন্ট" : "Create cPanel Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedPkg && selectedPkg.used_accounts >= selectedPkg.max_accounts - 2 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {bn ? `মাত্র ${selectedPkg.max_accounts - selectedPkg.used_accounts}টি স্লট বাকি` : `Only ${selectedPkg.max_accounts - selectedPkg.used_accounts} slots remaining`}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডোমেইন" : "Domain"} *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={createForm.domain} onChange={e => setCreateForm(p => ({ ...p, domain: e.target.value }))} placeholder="example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ইউজারনেম" : "Username"} *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 16) }))}
                    placeholder="username" maxLength={16}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{bn ? "৩-১৬ অক্ষর" : "3-16 chars, alphanumeric"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "পাসওয়ার্ড" : "Password"} *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={createForm.password}
                    onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ইমেইল" : "Email"}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="client@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/30">
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                {bn ? "রিসোর্স কনফিগারেশন" : "Resource Configuration"}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "প্ল্যান" : "Plan"}</label>
                  <select value={createForm.plan_name} onChange={e => setCreateForm(p => ({ ...p, plan_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30">
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডিস্ক (MB)" : "Disk (MB)"}</label>
                  <input type="number" value={createForm.disk_quota_mb} onChange={e => setCreateForm(p => ({ ...p, disk_quota_mb: +e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ব্যান্ডউইথ" : "BW (MB)"}</label>
                  <input type="number" value={createForm.bandwidth_mb} onChange={e => setCreateForm(p => ({ ...p, bandwidth_mb: +e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {selectedPkg && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {bn ? "অবশিষ্ট:" : "Available:"} {formatSize(selectedPkg.max_disk_mb - selectedPkg.used_disk_mb)} {bn ? "ডিস্ক" : "disk"}, {formatSize(selectedPkg.max_bandwidth_mb - selectedPkg.used_bandwidth_mb)} {bn ? "ব্যান্ডউইথ" : "bandwidth"}
                </p>
              )}
            </div>

            <button onClick={handleCreateAccount} disabled={creating}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {creating ? (bn ? "তৈরি হচ্ছে..." : "Creating...") : (bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResellerDashboard;
