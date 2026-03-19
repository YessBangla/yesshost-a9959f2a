import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Plus, HardDrive, Wifi, Users, Globe, Mail,
  Lock, Pause, Play, Trash2, X, Check, AlertTriangle, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    domain: "", username: "", password: "", email: "",
    plan_name: "Basic", disk_quota_mb: 1000, bandwidth_mb: 10000,
  });

  useEffect(() => {
    fetchPackages();
  }, [user]);

  const fetchPackages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reseller_packages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPackages(data || []);
    setLoading(false);
    if (data && data.length > 0 && !selectedPkg) {
      setSelectedPkg(data[0]);
      fetchAccounts(data[0].id);
    }
  };

  const fetchAccounts = async (pkgId: string) => {
    setAccountsLoading(true);
    const { data } = await supabase
      .from("reseller_accounts")
      .select("*")
      .eq("reseller_package_id", pkgId)
      .order("created_at", { ascending: false });
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
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("whm-manage", {
        body: {
          action: "create_account",
          reseller_package_id: selectedPkg.id,
          ...createForm,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: bn ? "অ্যাকাউন্ট তৈরি হয়েছে!" : "Account created!" });
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
    if (action === "terminate_account" && !confirm(bn ? "আপনি কি নিশ্চিত?" : "Are you sure?")) return;
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

  const quotaPercent = (used: number, max: number) => max > 0 ? Math.min(100, (used / max) * 100) : 0;

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
        <Server className="w-16 h-16 text-muted-foreground/30" />
        <div>
          <h2 className="text-xl font-bold text-foreground">{bn ? "রিসেলার প্যাকেজ নেই" : "No Reseller Package"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {bn ? "রিসেলার হোস্টিং ক্রয় করলে এখানে আপনার প্যাকেজ দেখা যাবে।" : "Purchase a reseller hosting plan to manage sub-accounts here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bn ? "রিসেলার ম্যানেজমেন্ট" : "Reseller Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bn ? "আপনার হোস্টিং প্যাকেজ ও ক্লায়েন্ট অ্যাকাউন্ট পরিচালনা করুন" : "Manage your hosting packages and client accounts"}</p>
        </div>
        {selectedPkg && (
          <button
            onClick={() => setShowCreate(true)}
            disabled={selectedPkg.used_accounts >= selectedPkg.max_accounts}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {bn ? "নতুন অ্যাকাউন্ট" : "New Account"}
          </button>
        )}
      </div>

      {/* Package Selector (if multiple) */}
      {packages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => selectPackage(pkg)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedPkg?.id === pkg.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/30"
              }`}
            >
              {pkg.package_name}
            </button>
          ))}
        </div>
      )}

      {/* Quota Overview */}
      {selectedPkg && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: bn ? "অ্যাকাউন্ট" : "Accounts",
              icon: Users,
              used: selectedPkg.used_accounts,
              max: selectedPkg.max_accounts,
              unit: "",
              color: "text-primary",
            },
            {
              label: bn ? "ডিস্ক স্পেস" : "Disk Space",
              icon: HardDrive,
              used: selectedPkg.used_disk_mb,
              max: selectedPkg.max_disk_mb,
              unit: "MB",
              color: "text-blue-500",
              format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)} GB` : `${v} MB`,
            },
            {
              label: bn ? "ব্যান্ডউইথ" : "Bandwidth",
              icon: Wifi,
              used: selectedPkg.used_bandwidth_mb,
              max: selectedPkg.max_bandwidth_mb,
              unit: "MB",
              color: "text-emerald-500",
              format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)} GB` : `${v} MB`,
            },
          ].map((q, i) => {
            const pct = quotaPercent(q.used, q.max);
            const formatFn = q.format || ((v: number) => String(v));
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <q.icon className={`w-4.5 h-4.5 ${q.color}`} />
                  <span className="text-sm font-semibold text-foreground">{q.label}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-foreground">{formatFn(q.used)}</span>
                  <span className="text-xs text-muted-foreground">/ {formatFn(q.max)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className={`text-[11px] mt-1.5 ${pct > 90 ? "text-destructive" : "text-muted-foreground"}`}>
                  {pct.toFixed(0)}% {bn ? "ব্যবহৃত" : "used"}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Accounts Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{bn ? "ক্লায়েন্ট অ্যাকাউন্ট" : "Client Accounts"}</h3>
          <Badge variant="secondary" className="text-[10px]">{accounts.length} {bn ? "টি" : "total"}</Badge>
        </div>

        {accountsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <Server className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">{bn ? "কোনো অ্যাকাউন্ট তৈরি হয়নি" : "No accounts created yet"}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{bn ? "\"নতুন অ্যাকাউন্ট\" বাটন ক্লিক করুন" : "Click \"New Account\" to get started"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{bn ? "ডোমেইন" : "Domain"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">{bn ? "ইউজারনেম" : "Username"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">{bn ? "প্ল্যান" : "Plan"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">{bn ? "ডিস্ক" : "Disk"}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{bn ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{bn ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate text-sm">{acc.domain}</p>
                          {acc.email && <p className="text-[10px] text-muted-foreground truncate">{acc.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-muted-foreground text-xs font-mono">{acc.username}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px]">{acc.plan_name}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{acc.disk_quota_mb >= 1000 ? `${(acc.disk_quota_mb / 1000).toFixed(1)} GB` : `${acc.disk_quota_mb} MB`}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={acc.status === "active" ? "default" : acc.status === "suspended" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {acc.status === "active" ? (bn ? "সক্রিয়" : "Active") : acc.status === "suspended" ? (bn ? "স্থগিত" : "Suspended") : acc.status}
                      </Badge>
                      {acc.cpanel_created && (
                        <Badge variant="outline" className="text-[10px] ml-1">cPanel</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {acc.status === "active" ? (
                          <button
                            onClick={() => handleAction(acc.id, "suspend_account")}
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-colors"
                            title={bn ? "স্থগিত করুন" : "Suspend"}
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : acc.status === "suspended" ? (
                          <button
                            onClick={() => handleAction(acc.id, "unsuspend_account")}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                            title={bn ? "পুনরায় সক্রিয়" : "Unsuspend"}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleAction(acc.id, "terminate_account")}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          title={bn ? "মুছুন" : "Terminate"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {bn ? "নতুন cPanel অ্যাকাউন্ট তৈরি করুন" : "Create New cPanel Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Quota warning */}
            {selectedPkg && selectedPkg.used_accounts >= selectedPkg.max_accounts - 2 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {bn ? `মাত্র ${selectedPkg.max_accounts - selectedPkg.used_accounts}টি অ্যাকাউন্ট বাকি আছে` : `Only ${selectedPkg.max_accounts - selectedPkg.used_accounts} accounts remaining`}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ডোমেইন" : "Domain"} *</label>
                <input
                  value={createForm.domain}
                  onChange={e => setCreateForm(p => ({ ...p, domain: e.target.value }))}
                  placeholder="example.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ইউজারনেম" : "Username"} *</label>
                <input
                  value={createForm.username}
                  onChange={e => setCreateForm(p => ({ ...p, username: e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 16) }))}
                  placeholder="myuser"
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "পাসওয়ার্ড" : "Password"} *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ইমেইল" : "Email"}</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  onChange={e => setCreateForm(p => ({ ...p, disk_quota_mb: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">{bn ? "ব্যান্ডউইথ (MB)" : "BW (MB)"}</label>
                <input
                  type="number"
                  value={createForm.bandwidth_mb}
                  onChange={e => setCreateForm(p => ({ ...p, bandwidth_mb: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {creating ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account"}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResellerDashboard;
