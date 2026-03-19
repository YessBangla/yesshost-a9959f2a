import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Plus, HardDrive, Wifi, Users, Globe, Mail, Lock, Pause, Play, Trash2,
  X, Check, AlertTriangle, BarChart3, Package, Settings, Shield, Activity,
  Search, RefreshCw, Copy, Eye, EyeOff, Cpu, Zap, Clock, Database,
  ArrowUpDown, FileText, Download, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatSize = (mb: number) => mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb} MB`;
const pct = (used: number, max: number) => max > 0 ? Math.min(100, (used / max) * 100) : 0;

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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    domain: "", username: "", password: "", email: "",
    plan_name: "Basic", disk_quota_mb: 1000, bandwidth_mb: 10000,
  });

  useEffect(() => { fetchPackages(); }, [user]);

  const fetchPackages = async () => {
    if (!user) {
      setPackages([]);
      setSelectedPkg(null);
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("reseller_packages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setPackages([]);
      setSelectedPkg(null);
      setAccounts([]);
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    const nextPackages = data || [];
    setPackages(nextPackages);

    if (nextPackages.length === 0) {
      setSelectedPkg(null);
      setAccounts([]);
      setLoading(false);
      return;
    }

    const nextSelected = nextPackages.find((pkg) => pkg.id === selectedPkg?.id) || nextPackages[0];
    setSelectedPkg(nextSelected);
    await fetchAccounts(nextSelected.id);
    setLoading(false);
  };

  const fetchAccounts = async (pkgId: string) => {
    setAccountsLoading(true);
    const { data, error } = await supabase
      .from("reseller_accounts")
      .select("*")
      .eq("reseller_package_id", pkgId)
      .order("created_at", { ascending: false });

    if (error) {
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }

    setAccounts(data || []);
    setAccountsLoading(false);
  };

  const selectPackage = (pkg: any) => {
    setSelectedPkg(pkg);
    fetchAccounts(pkg.id);
  };

  const handleCreateAccount = async () => {
    if (!selectedPkg || !createForm.domain || !createForm.username || !createForm.password) {
      toast({ title: bn ? "সকল ফিল্ড পূরণ করুন" : "Fill all required fields", variant: "destructive" });
      return;
    }
    if (createForm.username.length < 3 || createForm.username.length > 16) {
      toast({ title: bn ? "ইউজারনেম ৩-১৬ অক্ষরের হতে হবে" : "Username must be 3-16 characters", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("whm-manage", {
        body: { action: "create_account", reseller_package_id: selectedPkg.id, ...createForm },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: bn ? "অ্যাকাউন্ট তৈরি হয়েছে!" : "Account created successfully!" });
      setShowCreate(false);
      setCreateForm({ domain: "", username: "", password: "", email: "", plan_name: "Basic", disk_quota_mb: 1000, bandwidth_mb: 10000 });
      fetchPackages();
      fetchAccounts(selectedPkg.id);
    } catch (err: any) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleAction = async (accountId: string, action: "suspend_account" | "unsuspend_account" | "terminate_account") => {
    if (action === "terminate_account" && !confirm(bn ? "আপনি কি নিশ্চিত? এই অ্যাকাউন্ট ও সমস্ত ডেটা মুছে যাবে।" : "Are you sure? This account and all data will be deleted.")) return;
    try {
      const { data, error } = await supabase.functions.invoke("whm-manage", {
        body: { action, reseller_package_id: selectedPkg.id, account_id: accountId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: bn ? "সফল!" : "Success!" });
      fetchPackages();
      fetchAccounts(selectedPkg.id);
    } catch (err: any) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" });
    }
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

  const accountStats = useMemo(() => {
    const active = accounts.filter(a => a.status === "active").length;
    const suspended = accounts.filter(a => a.status === "suspended").length;
    return { total: accounts.length, active, suspended };
  }, [accounts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center">
          <Server className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{bn ? "রিসেলার প্যাকেজ নেই" : "No Reseller Package"}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {bn ? "রিসেলার হোস্টিং ক্রয় করলে এখানে আপনার প্যাকেজ দেখা যাবে এবং ক্লায়েন্ট অ্যাকাউন্ট পরিচালনা করতে পারবেন।" : "Purchase a reseller hosting plan to manage client accounts here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            {bn ? "রিসেলার প্যানেল" : "Reseller Panel"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {bn ? "আপনার হোস্টিং প্যাকেজ ও ক্লায়েন্ট অ্যাকাউন্ট পরিচালনা করুন" : "Manage your hosting packages and client accounts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchPackages(); if (selectedPkg) fetchAccounts(selectedPkg.id); }}
            className="p-2.5 rounded-xl border border-border/50 hover:bg-secondary/50 text-muted-foreground transition-all"
            title={bn ? "রিফ্রেশ" : "Refresh"}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {selectedPkg && (
            <button
              onClick={() => setShowCreate(true)}
              disabled={selectedPkg.used_accounts >= selectedPkg.max_accounts}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{bn ? "নতুন অ্যাকাউন্ট" : "New Account"}</span>
              <span className="sm:hidden">{bn ? "নতুন" : "New"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Package Selector */}
      {packages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => selectPackage(pkg)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedPkg?.id === pkg.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/30"
              }`}
            >
              {pkg.package_name}
            </button>
          ))}
        </div>
      )}

      {selectedPkg && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid sm:grid-cols-4 h-auto p-1 bg-secondary/40 rounded-xl">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {bn ? "ওভারভিউ" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {bn ? "অ্যাকাউন্ট" : "Accounts"}
            </TabsTrigger>
            <TabsTrigger value="packages" className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {bn ? "প্যাকেজ" : "Packages"}
            </TabsTrigger>
            <TabsTrigger value="server" className="text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm hidden sm:block">
              {bn ? "সার্ভার" : "Server"}
            </TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quota Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: bn ? "অ্যাকাউন্ট" : "Accounts", icon: Users, used: selectedPkg.used_accounts, max: selectedPkg.max_accounts, color: "text-primary", bg: "bg-primary/10", format: (v: number) => String(v) },
                { label: bn ? "সক্রিয়" : "Active", icon: Check, used: accountStats.active, max: accountStats.total || 1, color: "text-emerald-500", bg: "bg-emerald-500/10", format: (v: number) => String(v) },
                { label: bn ? "ডিস্ক" : "Disk", icon: HardDrive, used: selectedPkg.used_disk_mb, max: selectedPkg.max_disk_mb, color: "text-blue-500", bg: "bg-blue-500/10", format: formatSize },
                { label: bn ? "ব্যান্ডউইথ" : "Bandwidth", icon: Wifi, used: selectedPkg.used_bandwidth_mb, max: selectedPkg.max_bandwidth_mb, color: "text-amber-500", bg: "bg-amber-500/10", format: formatSize },
              ].map((q, i) => {
                const p = pct(q.used, q.max);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-3 sm:p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${q.bg} flex items-center justify-center`}>
                        <q.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${q.color}`} />
                      </div>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{q.format(q.used)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-muted-foreground">{q.label}</p>
                      <p className="text-[10px] text-muted-foreground">/ {q.format(q.max)}</p>
                    </div>
                    <Progress value={p} className="h-1.5 mt-2" />
                    {p > 85 && (
                      <p className="text-[10px] text-destructive mt-1 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> {p.toFixed(0)}% {bn ? "ব্যবহৃত" : "used"}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">{bn ? "দ্রুত কাজ" : "Quick Actions"}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: bn ? "অ্যাকাউন্ট তৈরি" : "Create Account", icon: Plus, action: () => setShowCreate(true), disabled: selectedPkg.used_accounts >= selectedPkg.max_accounts },
                  { label: bn ? "অ্যাকাউন্ট দেখুন" : "View Accounts", icon: Users, action: () => setActiveTab("accounts") },
                  { label: bn ? "প্যাকেজ ডিটেইল" : "Package Details", icon: Package, action: () => setActiveTab("packages") },
                  { label: bn ? "সার্ভার ইনফো" : "Server Info", icon: Server, action: () => setActiveTab("server") },
                ].map((qa, i) => (
                  <button
                    key={i}
                    onClick={qa.action}
                    disabled={qa.disabled}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/30 hover:bg-secondary/30 hover:border-primary/20 transition-all text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <qa.icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium text-center">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Accounts */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{bn ? "সাম্প্রতিক অ্যাকাউন্ট" : "Recent Accounts"}</h3>
                <button onClick={() => setActiveTab("accounts")} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
                  {bn ? "সব দেখুন" : "View all"} <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {accounts.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Server className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-xs">{bn ? "এখনো কোনো অ্যাকাউন্ট তৈরি হয়নি" : "No accounts created yet"}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {accounts.slice(0, 5).map(acc => (
                    <div key={acc.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{acc.domain}</p>
                          <p className="text-[10px] text-muted-foreground">{acc.username} · {formatSize(acc.disk_quota_mb)}</p>
                        </div>
                      </div>
                      <Badge variant={acc.status === "active" ? "default" : "destructive"} className="text-[10px] shrink-0">
                        {acc.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== ACCOUNTS TAB ===== */}
          <TabsContent value="accounts" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={bn ? "ডোমেইন, ইউজারনেম বা ইমেইল..." : "Search domain, username or email..."}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex gap-1.5">
                {["all", "active", "suspended"].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/30"
                    }`}
                  >
                    {s === "all" ? (bn ? "সব" : "All") : s === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended")}
                    <span className="ml-1 opacity-60">
                      {s === "all" ? accounts.length : accounts.filter(a => a.status === s).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Cards (mobile-first) */}
            {accountsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="px-4 py-12 text-center text-muted-foreground glass-card rounded-xl">
                <Server className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm">{searchTerm ? (bn ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found") : (bn ? "কোনো অ্যাকাউন্ট নেই" : "No accounts yet")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAccounts.map((acc, i) => (
                  <motion.div
                    key={acc.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground truncate">{acc.domain}</p>
                            <Badge variant={acc.status === "active" ? "default" : "destructive"} className="text-[10px]">
                              {acc.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended")}
                            </Badge>
                            {acc.cpanel_created && <Badge variant="outline" className="text-[10px]">cPanel</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {acc.username}</span>
                            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {formatSize(acc.disk_quota_mb)}</span>
                            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> {formatSize(acc.bandwidth_mb)}</span>
                            {acc.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {acc.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {acc.status === "active" ? (
                          <button
                            onClick={() => handleAction(acc.id, "suspend_account")}
                            className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-colors"
                            title={bn ? "স্থগিত করুন" : "Suspend"}
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : acc.status === "suspended" ? (
                          <button
                            onClick={() => handleAction(acc.id, "unsuspend_account")}
                            className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                            title={bn ? "সক্রিয় করুন" : "Unsuspend"}
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleAction(acc.id, "terminate_account")}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          title={bn ? "মুছুন" : "Terminate"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== PACKAGES TAB ===== */}
          <TabsContent value="packages" className="space-y-4">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedPkg.package_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {bn ? "তৈরি:" : "Created:"} {new Date(selectedPkg.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                  </p>
                </div>
                <Badge variant={selectedPkg.status === "active" ? "default" : "destructive"} className="ml-auto">
                  {selectedPkg.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended")}
                </Badge>
              </div>

              {/* Resource Bars */}
              <div className="space-y-4">
                {[
                  { label: bn ? "অ্যাকাউন্ট স্লট" : "Account Slots", icon: Users, used: selectedPkg.used_accounts, max: selectedPkg.max_accounts, format: (v: number) => String(v), color: "bg-primary" },
                  { label: bn ? "ডিস্ক স্পেস" : "Disk Space", icon: HardDrive, used: selectedPkg.used_disk_mb, max: selectedPkg.max_disk_mb, format: formatSize, color: "bg-blue-500" },
                  { label: bn ? "মাসিক ব্যান্ডউইথ" : "Monthly Bandwidth", icon: Wifi, used: selectedPkg.used_bandwidth_mb, max: selectedPkg.max_bandwidth_mb, format: formatSize, color: "bg-emerald-500" },
                ].map((r, i) => {
                  const p = pct(r.used, r.max);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <r.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{r.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {r.format(r.used)} / {r.format(r.max)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${r.color} ${p > 90 ? "animate-pulse" : ""}`}
                        />
                      </div>
                      <p className={`text-[11px] mt-1 ${p > 90 ? "text-destructive" : "text-muted-foreground"}`}>
                        {p.toFixed(1)}% {bn ? "ব্যবহৃত" : "used"} — {r.format(r.max - r.used)} {bn ? "অবশিষ্ট" : "remaining"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Package Features */}
            <div className="glass-card rounded-xl p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">{bn ? "প্যাকেজ ফিচার" : "Package Features"}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: Users, label: bn ? "সর্বোচ্চ অ্যাকাউন্ট" : "Max Accounts", value: String(selectedPkg.max_accounts) },
                  { icon: HardDrive, label: bn ? "সর্বোচ্চ ডিস্ক" : "Max Disk", value: formatSize(selectedPkg.max_disk_mb) },
                  { icon: Wifi, label: bn ? "সর্বোচ্চ ব্যান্ডউইথ" : "Max Bandwidth", value: formatSize(selectedPkg.max_bandwidth_mb) },
                  { icon: Shield, label: bn ? "WHM সার্ভার" : "WHM Server", value: selectedPkg.whm_server_host || (bn ? "কনফিগার হয়নি" : "Not configured") },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/20">
                    <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ===== SERVER TAB ===== */}
          <TabsContent value="server" className="space-y-4">
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                {bn ? "সার্ভার তথ্য" : "Server Information"}
              </h3>
              <div className="space-y-3">
                {[
                  { label: bn ? "সার্ভার হোস্ট" : "Server Host", value: selectedPkg.whm_server_host || "—", icon: Globe },
                  { label: bn ? "WHM ইউজারনেম" : "WHM Username", value: selectedPkg.whm_username || "—", icon: Users },
                  { label: bn ? "স্ট্যাটাস" : "Status", value: selectedPkg.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended"), icon: Activity },
                  { label: bn ? "cPanel পোর্ট" : "cPanel Port", value: "2083", icon: Lock },
                  { label: bn ? "WHM পোর্ট" : "WHM Port", value: "2087", icon: Shield },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <s.icon className="w-4 h-4" />
                      <span className="text-sm">{s.label}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground font-mono">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            {selectedPkg.whm_server_host && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">{bn ? "দ্রুত লিংক" : "Quick Links"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "WHM Panel", url: `https://${selectedPkg.whm_server_host}:2087`, icon: Shield },
                    { label: "cPanel Login", url: `https://${selectedPkg.whm_server_host}:2083`, icon: Globe },
                  ].map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-primary/5 hover:border-primary/20 transition-all text-foreground"
                    >
                      <link.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{link.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create Account Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {bn ? "নতুন cPanel অ্যাকাউন্ট" : "Create cPanel Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedPkg && selectedPkg.used_accounts >= selectedPkg.max_accounts - 2 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {bn ? `মাত্র ${selectedPkg.max_accounts - selectedPkg.used_accounts}টি অ্যাকাউন্ট বাকি` : `Only ${selectedPkg.max_accounts - selectedPkg.used_accounts} slots remaining`}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডোমেইন" : "Domain"} *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={createForm.domain}
                    onChange={e => setCreateForm(p => ({ ...p, domain: e.target.value }))}
                    placeholder="example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ইউজারনেম" : "Username"} *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={createForm.username}
                    onChange={e => setCreateForm(p => ({ ...p, username: e.target.value.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 16) }))}
                    placeholder="username"
                    maxLength={16}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{bn ? "৩-১৬ অক্ষর, শুধু ইংরেজি" : "3-16 chars, alphanumeric only"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "পাসওয়ার্ড" : "Password"} *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ইমেইল" : "Email"}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="client@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
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
                  <select
                    value={createForm.plan_name}
                    onChange={e => setCreateForm(p => ({ ...p, plan_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডিস্ক (MB)" : "Disk (MB)"}</label>
                  <input
                    type="number"
                    value={createForm.disk_quota_mb}
                    onChange={e => setCreateForm(p => ({ ...p, disk_quota_mb: +e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ব্যান্ডউইথ" : "BW (MB)"}</label>
                  <input
                    type="number"
                    value={createForm.bandwidth_mb}
                    onChange={e => setCreateForm(p => ({ ...p, bandwidth_mb: +e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              {selectedPkg && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {bn ? "অবশিষ্ট:" : "Available:"} {formatSize(selectedPkg.max_disk_mb - selectedPkg.used_disk_mb)} {bn ? "ডিস্ক" : "disk"}, {formatSize(selectedPkg.max_bandwidth_mb - selectedPkg.used_bandwidth_mb)} {bn ? "ব্যান্ডউইথ" : "bandwidth"}
                </p>
              )}
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={creating}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {creating ? (bn ? "তৈরি হচ্ছে..." : "Creating...") : (bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResellerDashboard;
