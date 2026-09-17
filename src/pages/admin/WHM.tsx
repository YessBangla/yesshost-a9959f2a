import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Server, Users, HardDrive, Wifi, Plus, Settings, Eye, Trash2,
  Shield, Activity, Globe, Package, AlertTriangle, Check, X,
  Search, ChevronDown, BarChart3, Cpu, Zap, Clock, Pencil,
  KeyRound, RefreshCw, Loader2, Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResellerPkg {
  id: string;
  user_id: string;
  package_name: string;
  max_accounts: number;
  used_accounts: number;
  max_disk_mb: number;
  used_disk_mb: number;
  max_bandwidth_mb: number;
  used_bandwidth_mb: number;
  status: string;
  whm_server_host: string | null;
  whm_username: string | null;
  service_id: string | null;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null } | null;
  account_count?: number;
}

const formatSize = (mb: number) => mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb} MB`;

const AdminWHM = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";

  const [packages, setPackages] = useState<ResellerPkg[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<ResellerPkg | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({
    user_id: "", package_name: "Reseller Package",
    max_accounts: 25, max_disk_mb: 50000, max_bandwidth_mb: 500000,
    whm_server_host: "", whm_username: "",
  });
  const [editForm, setEditForm] = useState({
    id: "", package_name: "", max_accounts: 25, max_disk_mb: 50000, max_bandwidth_mb: 500000,
    whm_server_host: "", whm_username: "",
  });
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [hostMode, setHostMode] = useState(false);
  const createRef = useRef<HTMLDivElement | null>(null);
  const [createForm, setCreateForm] = useState({
    domain: "", username: "", password: "", email: "", plan_name: "",
    disk_quota_mb: 1000, bandwidth_mb: 10000,
  });

  // Confirmation + success summary
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);

  // Live status panel
  const [autoPoll, setAutoPoll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // WHM API token
  const [tokenStatus, setTokenStatus] = useState<{ configured: boolean; masked: string | null; source: string | null } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenEditing, setTokenEditing] = useState(false);
  const [tokenSaving, setTokenSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total_packages: 0, active_packages: 0, total_accounts: 0, total_disk_used: 0, total_disk_max: 0
  });

  useEffect(() => { fetchAll(); fetchTokenStatus(); }, []);

  // Auto-poll account statuses while the accounts dialog is open
  useEffect(() => {
    if (!showAccounts || !selectedPkg || !autoPoll) return;
    const id = setInterval(() => { refreshAccounts(true); }, 10000);
    return () => clearInterval(id);
  }, [showAccounts, selectedPkg?.id, autoPoll]);

  const fetchTokenStatus = async () => {
    const { data } = await supabase.functions.invoke("whm-manage", {
      body: { action: "token_status", reseller_package_id: "" },
    });
    if (data?.success) setTokenStatus({ configured: !!data.configured, masked: data.masked, source: data.source });
  };

  const handleSaveToken = async () => {
    if (tokenInput.trim().length < 8) {
      toast({ title: bn ? "টোকেনটি খুব ছোট মনে হচ্ছে" : "Token looks too short", variant: "destructive" });
      return;
    }
    setTokenSaving(true);
    const { data, error } = await supabase.functions.invoke("whm-manage", {
      body: { action: "save_token", reseller_package_id: "", api_token: tokenInput.trim() },
    });
    setTokenSaving(false);
    const errMsg = error?.message || (data as any)?.error;
    if (errMsg) {
      toast({ title: bn ? "সেভ ব্যর্থ" : "Save failed", description: String(errMsg), variant: "destructive" });
      return;
    }
    setTokenStatus({ configured: true, masked: (data as any).masked, source: (data as any).source });
    setTokenInput("");
    setTokenEditing(false);
    setShowToken(false);
    toast({ title: bn ? "টোকেন নিরাপদে সংরক্ষিত হয়েছে" : "Token stored securely" });
  };

  const handleRemoveToken = async () => {
    if (!confirm(bn ? "সংরক্ষিত WHM টোকেন মুছে ফেলবেন?" : "Remove the stored WHM token?")) return;
    setTokenSaving(true);
    const { data, error } = await supabase.functions.invoke("whm-manage", {
      body: { action: "remove_token", reseller_package_id: "" },
    });
    setTokenSaving(false);
    if (error) {
      toast({ title: bn ? "মুছতে ব্যর্থ" : "Remove failed", description: error.message, variant: "destructive" });
      return;
    }
    setTokenStatus({ configured: !!(data as any)?.configured, masked: (data as any)?.masked ?? null, source: (data as any)?.source ?? null });
    toast({ title: bn ? "টোকেন মুছে ফেলা হয়েছে" : "Token removed" });
  };

  const refreshAccounts = async (silent = false) => {
    if (!selectedPkg) return;
    if (!silent) setRefreshing(true);
    const { data } = await supabase
      .from("reseller_accounts")
      .select("*")
      .eq("reseller_package_id", selectedPkg.id)
      .order("created_at", { ascending: false });
    setAccounts(data || []);
    setLastSync(new Date());
    if (!silent) setRefreshing(false);
  };

  const accountState = (acc: any) => {
    if (acc.status === "suspended") return { key: "suspended", label: bn ? "স্থগিত" : "Suspended", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    if (acc.status !== "active") return { key: acc.status, label: acc.status, cls: "bg-secondary text-muted-foreground border-border/50" };
    if (!acc.cpanel_created) return { key: "provisioning", label: bn ? "প্রোভিশনিং" : "Provisioning", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30" };
    return { key: "active", label: bn ? "সক্রিয়" : "Active", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
  };

  const fetchAll = async () => {
    setLoading(true);
    // Fetch packages with profile join
    const { data: pkgs } = await supabase
      .from("reseller_packages")
      .select("*")
      .order("created_at", { ascending: false });

    const pkgList = pkgs || [];

    // Fetch profiles for each user
    const userIds = [...new Set(pkgList.map(p => p.user_id))];
    let profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
    }

    // Fetch account counts per package
    const { data: accs } = await supabase
      .from("reseller_accounts")
      .select("reseller_package_id");

    const countMap: Record<string, number> = {};
    (accs || []).forEach(a => {
      countMap[a.reseller_package_id] = (countMap[a.reseller_package_id] || 0) + 1;
    });

    const enriched = pkgList.map(p => ({
      ...p,
      profile: profileMap[p.user_id] || null,
      account_count: countMap[p.id] || 0,
    }));

    setPackages(enriched);
    setStats({
      total_packages: enriched.length,
      active_packages: enriched.filter(p => p.status === "active").length,
      total_accounts: (accs || []).length,
      total_disk_used: enriched.reduce((s, p) => s + p.used_disk_mb, 0),
      total_disk_max: enriched.reduce((s, p) => s + p.max_disk_mb, 0),
    });
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, phone").limit(100);
    setUsers(data || []);
  };

  const handleAssign = async () => {
    if (!assignForm.user_id) {
      toast({ title: bn ? "ইউজার সিলেক্ট করুন" : "Select a user", variant: "destructive" });
      return;
    }
    setAssigning(true);
    const { error } = await supabase.from("reseller_packages").insert({
      user_id: assignForm.user_id,
      package_name: assignForm.package_name,
      max_accounts: assignForm.max_accounts,
      max_disk_mb: assignForm.max_disk_mb,
      max_bandwidth_mb: assignForm.max_bandwidth_mb,
      whm_server_host: assignForm.whm_server_host || null,
      whm_username: assignForm.whm_username || null,
    });
    if (error) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: bn ? "রিসেলার প্যাকেজ অ্যাসাইন হয়েছে!" : "Reseller package assigned!" });
      setShowAssign(false);
      setAssignForm({ user_id: "", package_name: "Reseller Package", max_accounts: 25, max_disk_mb: 50000, max_bandwidth_mb: 500000, whm_server_host: "", whm_username: "" });
      fetchAll();
    }
    setAssigning(false);
  };

  const handleViewAccounts = async (pkg: ResellerPkg, hostMode = false) => {
    setSelectedPkg(pkg);
    setConnResult(null);
    setHostMode(hostMode);
    const { data } = await supabase
      .from("reseller_accounts")
      .select("*")
      .eq("reseller_package_id", pkg.id)
      .order("created_at", { ascending: false });
    setAccounts(data || []);
    setShowAccounts(true);
    if (hostMode) {
      setTimeout(() => createRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
      if (pkg.whm_server_host) handleTestConnection(pkg);
    }
  };

  const handleTestConnection = async (pkg: ResellerPkg) => {
    setTestingConn(true);
    setConnResult(null);
    const { data, error } = await supabase.functions.invoke("whm-manage", {
      body: { action: "test_connection", reseller_package_id: pkg.id },
    });
    setTestingConn(false);
    if (error) {
      setConnResult({ ok: false, message: error.message });
      return;
    }
    setConnResult(
      data?.connected
        ? { ok: true, message: `${bn ? "সংযুক্ত" : "Connected"} — ${data.server} (WHM ${data.version})` }
        : { ok: false, message: data?.error || (bn ? "সংযোগ ব্যর্থ" : "Connection failed") }
    );
  };

  const requestCreateAccount = () => {
    if (!selectedPkg) return;
    if (!createForm.domain || !createForm.username || !createForm.password) {
      toast({ title: bn ? "ডোমেইন, ইউজারনেম ও পাসওয়ার্ড দিন" : "Domain, username and password required", variant: "destructive" });
      return;
    }
    setConfirmCreate(true);
  };

  const handleCreateAccount = async () => {
    if (!selectedPkg) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("whm-manage", {
      body: {
        action: "create_account",
        reseller_package_id: selectedPkg.id,
        domain: createForm.domain.trim(),
        username: createForm.username.trim(),
        password: createForm.password,
        email: createForm.email.trim() || undefined,
        plan_name: createForm.plan_name || undefined,
        disk_quota_mb: createForm.disk_quota_mb,
        bandwidth_mb: createForm.bandwidth_mb,
      },
    });
    setCreating(false);
    const errMsg = error?.message || (data && (data as any).error);
    if (errMsg) {
      setConfirmCreate(false);
      toast({ title: bn ? "অ্যাকাউন্ট তৈরি ব্যর্থ" : "Account creation failed", description: String(errMsg), variant: "destructive" });
      return;
    }
    setConfirmCreate(false);
    setCreatedAccount({
      ...((data as any)?.account || {}),
      cpanel_created: (data as any)?.cpanel_created,
      password: createForm.password,
      server_host: selectedPkg.whm_server_host,
    });
    toast({
      title: bn ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account created",
      description: (data as any)?.cpanel_created
        ? (bn ? "cPanel সার্ভারে আসল অ্যাকাউন্ট তৈরি হয়েছে" : "Real cPanel account created on the server")
        : (bn ? "শুধু রেকর্ড সেভ হয়েছে — WHM টোকেন/হোস্ট সেট নেই" : "Recorded only — WHM host/token not configured"),
    });
    setCreateForm({ domain: "", username: "", password: "", email: "", plan_name: "", disk_quota_mb: 1000, bandwidth_mb: 10000 });
    refreshAccounts(true);
    fetchAll();
  };

  const handleDeletePkg = async (pkgId: string) => {
    if (!confirm(bn ? "এই প্যাকেজটি মুছে ফেলতে চান?" : "Delete this package?")) return;
    // Delete accounts first, then package
    await supabase.from("reseller_accounts").delete().eq("reseller_package_id", pkgId);
    await supabase.from("reseller_packages").delete().eq("id", pkgId);
    toast({ title: bn ? "মুছে ফেলা হয়েছে" : "Deleted" });
    fetchAll();
  };

  const handleToggleStatus = async (pkg: ResellerPkg) => {
    const newStatus = pkg.status === "active" ? "suspended" : "active";
    await supabase.from("reseller_packages").update({ status: newStatus }).eq("id", pkg.id);
    toast({ title: bn ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated" });
    fetchAll();
  };

  const openEditDialog = (pkg: ResellerPkg) => {
    setEditForm({
      id: pkg.id,
      package_name: pkg.package_name,
      max_accounts: pkg.max_accounts,
      max_disk_mb: pkg.max_disk_mb,
      max_bandwidth_mb: pkg.max_bandwidth_mb,
      whm_server_host: pkg.whm_server_host || "",
      whm_username: pkg.whm_username || "",
    });
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    setEditing(true);
    const { error } = await supabase.from("reseller_packages").update({
      package_name: editForm.package_name,
      max_accounts: editForm.max_accounts,
      max_disk_mb: editForm.max_disk_mb,
      max_bandwidth_mb: editForm.max_bandwidth_mb,
      whm_server_host: editForm.whm_server_host || null,
      whm_username: editForm.whm_username || null,
    }).eq("id", editForm.id);
    if (error) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: bn ? "প্যাকেজ আপডেট হয়েছে!" : "Package updated!" });
      setShowEdit(false);
      fetchAll();
    }
    setEditing(false);
  };

  const filtered = packages.filter(p => {
    const term = searchTerm.toLowerCase();
    return !term || (p.profile?.full_name || "").toLowerCase().includes(term)
      || p.package_name.toLowerCase().includes(term)
      || (p.whm_server_host || "").toLowerCase().includes(term);
  });

  const diskPct = stats.total_disk_max > 0 ? (stats.total_disk_used / stats.total_disk_max * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            {bn ? "WHM সার্ভার ম্যানেজমেন্ট" : "WHM Server Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bn ? "রিসেলার প্যাকেজ, সার্ভার কনফিগারেশন ও মনিটরিং" : "Reseller packages, server configuration & monitoring"}
          </p>
        </div>
        <button
          onClick={() => { setShowAssign(true); fetchUsers(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          {bn ? "প্যাকেজ অ্যাসাইন করুন" : "Assign Package"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: bn ? "মোট প্যাকেজ" : "Total Packages", value: stats.total_packages, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: bn ? "সক্রিয় প্যাকেজ" : "Active Packages", value: stats.active_packages, icon: Check, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: bn ? "মোট অ্যাকাউন্ট" : "Total Accounts", value: stats.total_accounts, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: bn ? "ডিস্ক ব্যবহার" : "Disk Usage", value: `${diskPct.toFixed(0)}%`, icon: HardDrive, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* WHM API Token */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              {bn ? "WHM API টোকেন" : "WHM API token"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {bn
                ? "টোকেনটি শুধু সার্ভারে সংরক্ষিত থাকে — ব্রাউজারে কখনো পাঠানো হয় না।"
                : "The token is stored server-side only and is never sent back to the browser."}
            </p>
          </div>
          <Badge variant={tokenStatus?.configured ? "default" : "destructive"} className="text-[10px] shrink-0">
            {tokenStatus?.configured ? (bn ? "কনফিগার করা" : "Configured") : (bn ? "সেট করা নেই" : "Not set")}
          </Badge>
        </div>

        {!tokenEditing ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-xs font-mono text-foreground">
              {tokenStatus?.masked || "—"}
            </code>
            {tokenStatus?.source && (
              <span className="text-[10px] text-muted-foreground">
                {tokenStatus.source === "database"
                  ? (bn ? "সংরক্ষিত: নিরাপদ কনফিগ" : "Stored: secure config")
                  : (bn ? "সংরক্ষিত: সার্ভার সিক্রেট" : "Stored: server secret")}
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => { setTokenEditing(true); setTokenInput(""); }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-border/50 hover:border-primary/50"
              >
                <Pencil className="w-3.5 h-3.5" />
                {tokenStatus?.configured ? (bn ? "এডিট" : "Edit") : (bn ? "টোকেন যোগ করুন" : "Add token")}
              </button>
              {tokenStatus?.source === "database" && (
                <button
                  onClick={handleRemoveToken}
                  disabled={tokenSaving}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {bn ? "রিমুভ" : "Remove"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder={bn ? "WHM API টোকেন পেস্ট করুন" : "Paste the WHM API token"}
                className="flex-1 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm font-mono text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => setShowToken(v => !v)}
                className="px-3 py-2.5 rounded-xl border border-border/50 text-xs font-medium hover:border-primary/50"
              >
                {showToken ? (bn ? "লুকান" : "Hide") : (bn ? "দেখুন" : "Show")}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToken}
                disabled={tokenSaving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {tokenSaving ? (bn ? "সেভ হচ্ছে…" : "Saving…") : (bn ? "নিরাপদে সেভ করুন" : "Save securely")}
              </button>
              <button
                onClick={() => { setTokenEditing(false); setTokenInput(""); setShowToken(false); }}
                className="px-4 py-2 rounded-lg border border-border/50 text-xs font-medium hover:border-primary/50"
              >
                {bn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={bn ? "ইউজার, প্যাকেজ বা সার্ভার খুঁজুন..." : "Search by user, package or server..."}
          className="flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Packages Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{bn ? "রিসেলার প্যাকেজ তালিকা" : "Reseller Packages"}</h3>
          <Badge variant="secondary" className="text-[10px]">{filtered.length} {bn ? "টি" : "total"}</Badge>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">{bn ? "কোনো রিসেলার প্যাকেজ নেই" : "No reseller packages found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{bn ? "ক্লায়েন্ট" : "Client"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">{bn ? "প্যাকেজ" : "Package"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{bn ? "অ্যাকাউন্ট" : "Accounts"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{bn ? "ডিস্ক" : "Disk"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{bn ? "সার্ভার" : "Server"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{bn ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{bn ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pkg, i) => {
                  const diskPct = pkg.max_disk_mb > 0 ? (pkg.used_disk_mb / pkg.max_disk_mb * 100) : 0;
                  return (
                    <motion.tr
                      key={pkg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/30 hover:bg-secondary/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {(pkg.profile?.full_name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate text-sm">{pkg.profile?.full_name || "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{pkg.profile?.phone || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-foreground">{pkg.package_name}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm font-medium text-foreground">{pkg.used_accounts}/{pkg.max_accounts}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{formatSize(pkg.used_disk_mb)}</span>
                            <span>{formatSize(pkg.max_disk_mb)}</span>
                          </div>
                          <Progress value={diskPct} className="h-1.5" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">{pkg.whm_server_host || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={pkg.status === "active" ? "default" : "destructive"} className="text-[10px]">
                          {pkg.status === "active" ? (bn ? "সক্রিয়" : "Active") : (bn ? "স্থগিত" : "Suspended")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewAccounts(pkg, true)}
                            disabled={pkg.used_accounts >= pkg.max_accounts}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                            title={bn ? "এই প্যাকেজে নতুন অ্যাকাউন্ট হোস্ট করুন" : "Host a new account on this package"}
                          >
                            <Server className="w-3.5 h-3.5" />
                            {bn ? "হোস্ট করুন" : "Host"}
                          </button>
                          <button
                            onClick={() => openEditDialog(pkg)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                            title={bn ? "এডিট করুন" : "Edit"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleViewAccounts(pkg)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title={bn ? "অ্যাকাউন্ট দেখুন" : "View Accounts"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(pkg)}
                            className={`p-1.5 rounded-lg transition-colors ${pkg.status === "active" ? "hover:bg-amber-500/10 text-amber-500" : "hover:bg-emerald-500/10 text-emerald-500"}`}
                            title={pkg.status === "active" ? (bn ? "স্থগিত" : "Suspend") : (bn ? "সক্রিয়" : "Activate")}
                          >
                            {pkg.status === "active" ? <Shield className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeletePkg(pkg.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            title={bn ? "মুছুন" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Package Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {bn ? "রিসেলার প্যাকেজ অ্যাসাইন করুন" : "Assign Reseller Package"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* User Selection */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ক্লায়েন্ট সিলেক্ট করুন" : "Select Client"} *</label>
              <select
                value={assignForm.user_id}
                onChange={e => setAssignForm(p => ({ ...p, user_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{bn ? "-- ইউজার বাছুন --" : "-- Select user --"}</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.full_name || u.user_id} {u.phone ? `(${u.phone})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "প্যাকেজ নাম" : "Package Name"}</label>
              <input
                value={assignForm.package_name}
                onChange={e => setAssignForm(p => ({ ...p, package_name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "সর্বোচ্চ অ্যাকাউন্ট" : "Max Accounts"}</label>
                <input
                  type="number"
                  value={assignForm.max_accounts}
                  onChange={e => setAssignForm(p => ({ ...p, max_accounts: +e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডিস্ক (MB)" : "Disk (MB)"}</label>
                <input
                  type="number"
                  value={assignForm.max_disk_mb}
                  onChange={e => setAssignForm(p => ({ ...p, max_disk_mb: +e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ব্যান্ডউইথ (MB)" : "BW (MB)"}</label>
                <input
                  type="number"
                  value={assignForm.max_bandwidth_mb}
                  onChange={e => setAssignForm(p => ({ ...p, max_bandwidth_mb: +e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/30">
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                {bn ? "WHM সার্ভার কনফিগারেশন (ঐচ্ছিক)" : "WHM Server Config (Optional)"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "সার্ভার হোস্ট" : "Server Host"}</label>
                  <input
                    value={assignForm.whm_server_host}
                    onChange={e => setAssignForm(p => ({ ...p, whm_server_host: e.target.value }))}
                    placeholder="server1.yesshost.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "WHM ইউজারনেম" : "WHM Username"}</label>
                  <input
                    value={assignForm.whm_username}
                    onChange={e => setAssignForm(p => ({ ...p, whm_username: e.target.value }))}
                    placeholder="root"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAssign}
              disabled={assigning}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {assigning ? (bn ? "অ্যাসাইন হচ্ছে..." : "Assigning...") : (bn ? "প্যাকেজ অ্যাসাইন করুন" : "Assign Package")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Accounts Dialog */}
      <Dialog open={showAccounts} onOpenChange={setShowAccounts}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {selectedPkg?.profile?.full_name || "Client"} — {bn ? "অ্যাকাউন্ট তালিকা" : "Account List"}
            </DialogTitle>
          </DialogHeader>

          {selectedPkg && (
            <div className="space-y-4 mt-2">
              {/* Package Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: bn ? "অ্যাকাউন্ট" : "Accounts", value: `${selectedPkg.used_accounts}/${selectedPkg.max_accounts}`, pct: selectedPkg.max_accounts > 0 ? (selectedPkg.used_accounts / selectedPkg.max_accounts * 100) : 0 },
                  { label: bn ? "ডিস্ক" : "Disk", value: `${formatSize(selectedPkg.used_disk_mb)} / ${formatSize(selectedPkg.max_disk_mb)}`, pct: selectedPkg.max_disk_mb > 0 ? (selectedPkg.used_disk_mb / selectedPkg.max_disk_mb * 100) : 0 },
                  { label: bn ? "ব্যান্ডউইথ" : "Bandwidth", value: `${formatSize(selectedPkg.used_bandwidth_mb)} / ${formatSize(selectedPkg.max_bandwidth_mb)}`, pct: selectedPkg.max_bandwidth_mb > 0 ? (selectedPkg.used_bandwidth_mb / selectedPkg.max_bandwidth_mb * 100) : 0 },
                ].map((q, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{q.label}</p>
                    <p className="text-xs font-semibold text-foreground">{q.value}</p>
                    <Progress value={q.pct} className="h-1 mt-1.5" />
                  </div>
                ))}
              </div>

              {/* Server connection */}
              <div className="p-3 rounded-xl border border-border/40 bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{bn ? "WHM সার্ভার সংযোগ" : "WHM server connection"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {selectedPkg.whm_server_host
                        ? `${selectedPkg.whm_username || "—"}@${selectedPkg.whm_server_host}:2087`
                        : (bn ? "সার্ভার হোস্ট সেট করা নেই — প্যাকেজ এডিট করে দিন" : "No server host set — edit the package to add it")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTestConnection(selectedPkg)}
                    disabled={testingConn}
                    className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium border border-border/50 hover:border-primary/50 disabled:opacity-60"
                  >
                    {testingConn ? (bn ? "পরীক্ষা চলছে…" : "Testing…") : (bn ? "সংযোগ পরীক্ষা" : "Test connection")}
                  </button>
                </div>
                {connResult && (
                  <p className={`text-[11px] break-words ${connResult.ok ? "text-emerald-600" : "text-destructive"}`}>
                    {connResult.message}
                  </p>
                )}
              </div>

              {/* Create real cPanel account */}
              <div ref={createRef} className={`p-3 rounded-xl space-y-3 transition-all ${hostMode ? "border-2 border-primary bg-primary/10 ring-4 ring-primary/10" : "border border-primary/25 bg-primary/5"}`}>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  {bn ? "নতুন cPanel অ্যাকাউন্ট তৈরি" : "Create cPanel account"}
                </p>
                {hostMode && !selectedPkg.whm_server_host && (
                  <p className="text-[11px] text-amber-600 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    {bn
                      ? "এই প্যাকেজে সার্ভারের ঠিকানা দেওয়া নেই — অ্যাকাউন্টটি শুধু রেকর্ড হিসেবে সেভ হবে। প্যাকেজ এডিট করে WHM হোস্ট ও ইউজারনেম দিন।"
                      : "No server address set for this package — the account will only be recorded. Edit the package to add the WHM host and username."}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "domain", label: bn ? "ডোমেইন" : "Domain", ph: "client-domain.com", type: "text" },
                    { key: "username", label: bn ? "ইউজারনেম" : "Username", ph: "clientusr", type: "text" },
                    { key: "password", label: bn ? "পাসওয়ার্ড" : "Password", ph: "••••••••", type: "password" },
                    { key: "email", label: bn ? "ইমেইল" : "Contact email", ph: "client@email.com", type: "email" },
                    { key: "plan_name", label: bn ? "WHM প্যাকেজ" : "WHM package", ph: "default", type: "text" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] text-muted-foreground mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={(createForm as any)[f.key]}
                        onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.ph}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs focus:outline-hidden focus:border-primary/50"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">{bn ? "ডিস্ক (MB)" : "Disk (MB)"}</label>
                      <input
                        type="number"
                        value={createForm.disk_quota_mb}
                        onChange={e => setCreateForm(p => ({ ...p, disk_quota_mb: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs focus:outline-hidden focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">{bn ? "ব্যান্ডউইথ (MB)" : "Bandwidth (MB)"}</label>
                      <input
                        type="number"
                        value={createForm.bandwidth_mb}
                        onChange={e => setCreateForm(p => ({ ...p, bandwidth_mb: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs focus:outline-hidden focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={requestCreateAccount}
                  disabled={creating}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? (bn ? "তৈরি হচ্ছে…" : "Creating…") : (bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account")}
                </button>
              </div>

              {/* Live status panel */}
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-secondary/30 border-b border-border/40">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      {bn ? "লাইভ স্ট্যাটাস" : "Live status"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {lastSync
                        ? `${bn ? "সর্বশেষ আপডেট" : "Last updated"} ${lastSync.toLocaleTimeString()}`
                        : (bn ? "এখনো আপডেট হয়নি" : "Not synced yet")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setAutoPoll(v => !v)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${autoPoll ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-border/50 text-muted-foreground"}`}
                    >
                      {autoPoll ? (bn ? "অটো চালু" : "Auto on") : (bn ? "অটো বন্ধ" : "Auto off")}
                    </button>
                    <button
                      onClick={() => refreshAccounts()}
                      disabled={refreshing}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border/50 hover:border-primary/50 disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      {bn ? "রিফ্রেশ" : "Refresh"}
                    </button>
                  </div>
                </div>

                {accounts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Server className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm">{bn ? "কোনো অ্যাকাউন্ট নেই" : "No accounts"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {accounts.map(acc => {
                      const st = accountState(acc);
                      return (
                        <div key={acc.id} className="flex items-center justify-between gap-2 p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{acc.domain}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{acc.username} · {formatSize(acc.disk_quota_mb)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${st.cls}`}>
                              {st.key === "provisioning" && <Loader2 className="w-3 h-3 animate-spin" />}
                              {st.label}
                            </span>
                            {acc.cpanel_created && <Badge variant="outline" className="text-[10px]">cPanel</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              {bn ? "রিসেলার প্যাকেজ এডিট করুন" : "Edit Reseller Package"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "প্যাকেজ নাম" : "Package Name"}</label>
              <input
                value={editForm.package_name}
                onChange={e => setEditForm(p => ({ ...p, package_name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "সর্বোচ্চ অ্যাকাউন্ট" : "Max Accounts"}</label>
                <input
                  type="number"
                  value={editForm.max_accounts}
                  onChange={e => setEditForm(p => ({ ...p, max_accounts: +e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডিস্ক (MB)" : "Disk (MB)"}</label>
                <input
                  type="number"
                  value={editForm.max_disk_mb}
                  onChange={e => setEditForm(p => ({ ...p, max_disk_mb: +e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ব্যান্ডউইথ (MB)" : "BW (MB)"}</label>
                <input
                  type="number"
                  value={editForm.max_bandwidth_mb}
                  onChange={e => setEditForm(p => ({ ...p, max_bandwidth_mb: +e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/30">
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                {bn ? "WHM সার্ভার কনফিগারেশন (ঐচ্ছিক)" : "WHM Server Config (Optional)"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "সার্ভার হোস্ট" : "Server Host"}</label>
                  <input
                    value={editForm.whm_server_host}
                    onChange={e => setEditForm(p => ({ ...p, whm_server_host: e.target.value }))}
                    placeholder="server1.yesshost.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "WHM ইউজারনেম" : "WHM Username"}</label>
                  <input
                    value={editForm.whm_username}
                    onChange={e => setEditForm(p => ({ ...p, whm_username: e.target.value }))}
                    placeholder="root"
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleEditSave}
              disabled={editing}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {editing ? (bn ? "আপডেট হচ্ছে..." : "Updating...") : (bn ? "আপডেট করুন" : "Update Package")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create confirmation */}
      <Dialog open={confirmCreate} onOpenChange={(o) => { if (!creating) setConfirmCreate(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {bn ? "অ্যাকাউন্ট তৈরি নিশ্চিত করুন" : "Confirm account creation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <p className="text-xs text-muted-foreground">
              {selectedPkg?.whm_server_host
                ? (bn
                  ? `এই তথ্য দিয়ে ${selectedPkg.whm_server_host} সার্ভারে আসল cPanel অ্যাকাউন্ট তৈরি হবে।`
                  : `A real cPanel account will be created on ${selectedPkg.whm_server_host}.`)
                : (bn
                  ? "সার্ভারের ঠিকানা সেট নেই — অ্যাকাউন্টটি শুধু রেকর্ড হিসেবে সেভ হবে।"
                  : "No server host is set — the account will only be recorded.")}
            </p>
            <div className="rounded-xl border border-border/40 divide-y divide-border/30 text-xs">
              {[
                { l: bn ? "প্যাকেজ" : "Package", v: selectedPkg?.package_name || "—" },
                { l: bn ? "ডোমেইন" : "Domain", v: createForm.domain },
                { l: bn ? "ইউজারনেম" : "Username", v: createForm.username },
                { l: bn ? "ইমেইল" : "Email", v: createForm.email || "—" },
                { l: bn ? "ডিস্ক" : "Disk", v: formatSize(createForm.disk_quota_mb) },
                { l: bn ? "ব্যান্ডউইথ" : "Bandwidth", v: formatSize(createForm.bandwidth_mb) },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="font-medium text-foreground truncate">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateAccount}
                disabled={creating}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {creating ? (bn ? "তৈরি হচ্ছে…" : "Creating…") : (bn ? "হ্যাঁ, তৈরি করুন" : "Yes, create it")}
              </button>
              <button
                onClick={() => setConfirmCreate(false)}
                disabled={creating}
                className="px-4 py-2.5 rounded-lg border border-border/50 text-xs font-medium hover:border-primary/50 disabled:opacity-60"
              >
                {bn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success summary */}
      <Dialog open={!!createdAccount} onOpenChange={(o) => { if (!o) setCreatedAccount(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-500" />
              {bn ? "অ্যাকাউন্ট সারাংশ" : "Account summary"}
            </DialogTitle>
          </DialogHeader>
          {createdAccount && (
            <div className="space-y-3 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${createdAccount.cpanel_created ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-blue-500/10 text-blue-600 border-blue-500/30"}`}>
                {!createdAccount.cpanel_created && <Loader2 className="w-3 h-3 animate-spin" />}
                {createdAccount.cpanel_created
                  ? (bn ? "সক্রিয় — cPanel তৈরি হয়েছে" : "Active — cPanel created")
                  : (bn ? "প্রোভিশনিং — শুধু রেকর্ড" : "Provisioning — recorded only")}
              </span>
              <div className="rounded-xl border border-border/40 divide-y divide-border/30 text-xs">
                {[
                  { l: bn ? "ডোমেইন" : "Domain", v: createdAccount.domain },
                  { l: bn ? "ইউজারনেম" : "Username", v: createdAccount.username },
                  { l: bn ? "পাসওয়ার্ড" : "Password", v: createdAccount.password },
                  { l: bn ? "সার্ভার" : "Server", v: createdAccount.server_host || "—" },
                  { l: bn ? "cPanel লগইন" : "cPanel login", v: createdAccount.server_host ? `https://${createdAccount.server_host}:2083` : "—" },
                  { l: bn ? "ডিস্ক" : "Disk", v: formatSize(createdAccount.disk_quota_mb || 0) },
                  { l: bn ? "ব্যান্ডউইথ" : "Bandwidth", v: formatSize(createdAccount.bandwidth_mb || 0) },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-muted-foreground shrink-0">{r.l}</span>
                    <span className="font-mono text-foreground truncate">{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = [
                      `Domain: ${createdAccount.domain}`,
                      `Username: ${createdAccount.username}`,
                      `Password: ${createdAccount.password}`,
                      createdAccount.server_host ? `cPanel: https://${createdAccount.server_host}:2083` : "",
                    ].filter(Boolean).join("\n");
                    navigator.clipboard.writeText(text);
                    toast({ title: bn ? "কপি হয়েছে" : "Copied" });
                  }}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg border border-border/50 text-xs font-medium hover:border-primary/50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {bn ? "ডিটেইলস কপি করুন" : "Copy details"}
                </button>
                <button
                  onClick={() => { setCreatedAccount(null); refreshAccounts(); }}
                  className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                >
                  {bn ? "ঠিক আছে" : "Done"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWHM;
