import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Eye, ShoppingCart, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type ThemeOrder = Tables<"theme_orders"> & { theme_name?: string; user_name?: string; user_email?: string };

const CallCenterOrders = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [orders, setOrders] = useState<ThemeOrder[]>([]);
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"theme" | "service">("theme");

  const fetchData = async () => {
    setLoading(true);
    const [themeOrders, themes, profiles, svcData] = await Promise.all([
      supabase.from("theme_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("themes").select("id, name"),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("services").select("*").order("created_at", { ascending: false }),
    ]);

    const enriched: ThemeOrder[] = (themeOrders.data || []).map(o => ({
      ...o,
      theme_name: (themes.data || []).find(t => t.id === o.theme_id)?.name || "—",
      user_name: (profiles.data || []).find(p => p.user_id === o.user_id)?.full_name || "—",
    }));
    setOrders(enriched);
    setServices(svcData.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateThemeOrder = async (id: string, status: string) => {
    await supabase.from("theme_orders").update({ status }).eq("id", id);
    toast({ title: bn ? "আপডেট হয়েছে" : "Updated" });
    fetchData();
  };

  const updateService = async (id: string, status: string) => {
    await supabase.from("services").update({ status: status as any }).eq("id", id);
    toast({ title: bn ? "আপডেট হয়েছে" : "Updated" });
    fetchData();
  };

  const statusColor = (s: string) => {
    if (s === "pending") return "bg-orange-500/10 text-orange-500";
    if (s === "paid" || s === "active" || s === "approved") return "bg-green-500/10 text-green-500";
    if (s === "cancelled" || s === "rejected") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bn ? "অর্ডার ম্যানেজমেন্ট" : "Order Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bn ? "থিম ও সার্ভিস অর্ডার এপ্রুভ/রিজেক্ট করুন" : "Approve or reject theme & service orders"}</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("theme")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "theme" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}>
          {bn ? "থিম অর্ডার" : "Theme Orders"} ({orders.length})
        </button>
        <button onClick={() => setTab("service")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "service" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}>
          {bn ? "সার্ভিস অর্ডার" : "Service Orders"} ({services.filter(s => s.status === "pending").length})
        </button>
      </div>

      {tab === "theme" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{bn ? "কোনো অর্ডার নেই" : "No orders"}</p>
          ) : orders.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="glass-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{o.theme_name}</p>
                <p className="text-xs text-muted-foreground">{o.user_name} • {formatAmount(Number(o.amount_bdt), lang)}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}</p>
              </div>
              <Badge className={`${statusColor(o.status)} border-0 text-xs`}>{o.status}</Badge>
              {o.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => updateThemeOrder(o.id, "paid")} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check className="w-4 h-4" /></button>
                  <button onClick={() => updateThemeOrder(o.id, "cancelled")} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><X className="w-4 h-4" /></button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === "service" && (
        <div className="space-y-3">
          {services.filter(s => s.status === "pending").length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{bn ? "কোনো পেন্ডিং সার্ভিস নেই" : "No pending services"}</p>
          ) : services.filter(s => s.status === "pending").map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="glass-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.service_type} • {s.plan} • {formatAmount(Number(s.price_bdt), lang)}</p>
              </div>
              <Badge className={`${statusColor(s.status)} border-0 text-xs`}>{s.status}</Badge>
              <div className="flex gap-2">
                <button onClick={() => updateService(s.id, "active")} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check className="w-4 h-4" /></button>
                <button onClick={() => updateService(s.id, "cancelled")} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CallCenterOrders;
