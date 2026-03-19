import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Eye, ShoppingCart, RefreshCw, Package, Clock, Globe, Server, Palette, CreditCard, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  subtotal_bdt: number;
  discount_bdt: number;
  total_bdt: number;
  payment_method: string | null;
  payment_status: string;
  coupon_code: string | null;
  order_note: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  item_type: string;
  item_name: string;
  item_description: string | null;
  price_bdt: number;
  domain_name: string | null;
  provisioned_at: string | null;
};

const statusConfig: Record<string, { color: string; en: string; bn: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600", en: "Pending", bn: "পেন্ডিং" },
  confirmed: { color: "bg-blue-500/10 text-blue-600", en: "Confirmed", bn: "কনফার্মড" },
  processing: { color: "bg-indigo-500/10 text-indigo-600", en: "Processing", bn: "প্রসেসিং" },
  provisioning: { color: "bg-purple-500/10 text-purple-600", en: "Provisioning", bn: "প্রভিশনিং" },
  active: { color: "bg-green-500/10 text-green-600", en: "Active", bn: "সক্রিয়" },
  completed: { color: "bg-green-500/10 text-green-600", en: "Completed", bn: "সম্পন্ন" },
  cancelled: { color: "bg-destructive/10 text-destructive", en: "Cancelled", bn: "বাতিল" },
  refunded: { color: "bg-muted text-muted-foreground", en: "Refunded", bn: "ফেরতকৃত" },
};

const itemIcon = (type: string) => {
  switch (type) {
    case "hosting": return Server;
    case "theme": return Palette;
    default: return Globe;
  }
};

const CallCenterOrders = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    const enriched: Order[] = (ordersRes.data || []).map((o: any) => ({
      ...o,
      user_name: (profilesRes.data || []).find((p: any) => p.user_id === o.user_id)?.full_name || "—",
    }));
    setOrders(enriched);

    // Fetch all items
    if (enriched.length > 0) {
      const ids = enriched.map(o => o.id);
      const { data: itemsData } = await supabase.from("order_items").select("*").in("order_id", ids);
      const grouped: Record<string, OrderItem[]> = {};
      (itemsData || []).forEach((item: any) => {
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push(item as OrderItem);
      });
      setOrderItems(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime
    const channel = supabase
      .channel("callcenter-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setProcessingId(orderId);
    const updateFields: any = { status: newStatus };
    if (newStatus === "confirmed") updateFields.confirmed_at = new Date().toISOString();
    if (newStatus === "processing") updateFields.processed_at = new Date().toISOString();
    if (newStatus === "cancelled") updateFields.cancelled_at = new Date().toISOString();

    await supabase.from("orders").update(updateFields).eq("id", orderId);
    toast({ title: bn ? "অর্ডার আপডেট হয়েছে" : "Order Updated" });
    setProcessingId(null);
    fetchData();
  };

  const provisionOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const { error } = await supabase.rpc("provision_order", { _order_id: orderId });
      if (error) throw error;
      toast({ title: bn ? "অর্ডার প্রভিশন সফল!" : "Order Provisioned!", description: bn ? "সকল সার্ভিস সক্রিয় করা হয়েছে" : "All services have been activated" });
    } catch (err: any) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: err.message, variant: "destructive" });
    }
    setProcessingId(null);
    fetchData();
  };

  const filteredOrders = filter === "all" ? orders :
    filter === "pending" ? orders.filter(o => ["pending", "confirmed", "processing"].includes(o.status)) :
    orders.filter(o => ["active", "completed"].includes(o.status));

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => ["confirmed", "processing"].includes(o.status)).length,
    active: orders.filter(o => ["active", "completed"].includes(o.status)).length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bn ? "অর্ডার ম্যানেজমেন্ট" : "Order Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bn ? "সকল অর্ডার প্রসেস ও প্রভিশনিং" : "Process and provision all orders"}</p>
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl hover:bg-secondary/60 text-muted-foreground active:scale-95 transition-all">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: bn ? "মোট" : "Total", value: stats.total, icon: ShoppingCart, color: "text-foreground" },
          { label: bn ? "নতুন" : "New", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: bn ? "প্রসেসিং" : "Processing", value: stats.processing, icon: Package, color: "text-indigo-600" },
          { label: bn ? "সক্রিয়" : "Active", value: stats.active, icon: Check, color: "text-green-600" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: "all" as const, label: bn ? "সকল" : "All", count: orders.length },
          { key: "pending" as const, label: bn ? "পেন্ডিং" : "Pending", count: orders.filter(o => ["pending", "confirmed", "processing"].includes(o.status)).length },
          { key: "active" as const, label: bn ? "সক্রিয়" : "Active", count: orders.filter(o => ["active", "completed"].includes(o.status)).length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{bn ? "কোনো অর্ডার নেই" : "No orders found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, i) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];
            const isProcessing = processingId === order.id;

            return (
              <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="glass-card rounded-xl overflow-hidden">
                
                {/* Header */}
                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full p-4 text-left hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${order.status === "pending" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                        <Package className={`w-5 h-5 ${order.status === "pending" ? "text-amber-600" : "text-primary"}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{order.order_number}</span>
                          <Badge className={`${sc.color} border-0 text-[10px] px-1.5 py-0`}>
                            {bn ? sc.bn : sc.en}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.user_name} • {items.length} {bn ? "আইটেম" : "items"} • {new Date(order.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-lg font-bold text-foreground">৳{formatAmount(Number(order.total_bdt), lang)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border">
                    {/* Items */}
                    <div className="p-4 space-y-2">
                      {items.map(item => {
                        const Icon = itemIcon(item.item_type);
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.item_name}</p>
                              {item.domain_name && <p className="text-[11px] text-primary font-mono">{item.domain_name}</p>}
                            </div>
                            <p className="text-sm font-semibold text-foreground shrink-0">৳{formatAmount(Number(item.price_bdt), lang)}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Details & Actions */}
                    <div className="p-4 pt-0 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{bn ? "পেমেন্ট:" : "Payment:"} <span className="capitalize font-medium text-foreground">{order.payment_method}</span></p>
                        {order.coupon_code && <p>{bn ? "কুপন:" : "Coupon:"} <span className="text-primary font-medium">{order.coupon_code}</span></p>}
                        {order.order_note && <p className="max-w-sm">{bn ? "নোট:" : "Note:"} {order.order_note}</p>}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, "confirmed")}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> {bn ? "কনফার্ম" : "Confirm"}
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, "cancelled")}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> {bn ? "বাতিল" : "Cancel"}
                            </button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <button
                            onClick={() => provisionOrder(order.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" /> {bn ? "প্রভিশন করুন" : "Provision"}
                          </button>
                        )}
                        {order.status === "processing" && (
                          <button
                            onClick={() => provisionOrder(order.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" /> {bn ? "এক্টিভেট" : "Activate"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CallCenterOrders;
