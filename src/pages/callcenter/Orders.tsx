import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ShoppingCart, RefreshCw, Package, Clock, Globe, Server, Palette, ChevronDown, ChevronUp, Zap, Search, CircleDollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DataPagination from "@/components/DataPagination";
import { StaffMetricStrip, StaffPageHeader } from "@/components/staff/StaffConsole";

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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

    const { error } = await supabase.from("orders").update(updateFields).eq("id", orderId);
    if (error) {
      toast({ title: bn ? "অর্ডার আপডেট হয়নি" : "Order was not updated", description: bn ? "আবার চেষ্টা করুন।" : "Please try again.", variant: "destructive" });
      setProcessingId(null);
      return;
    }
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

  const byStatus = filter === "all" ? orders :
    filter === "pending" ? orders.filter(o => ["pending", "confirmed", "processing"].includes(o.status)) :
    orders.filter(o => ["active", "completed"].includes(o.status));
  const query = search.toLowerCase();
  const filteredOrders = byStatus.filter((order) => [order.order_number, order.user_name, order.payment_method, order.payment_status].some((value) => value?.toLowerCase().includes(query)));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => ["confirmed", "processing"].includes(o.status)).length,
    active: orders.filter(o => ["active", "completed"].includes(o.status)).length,
  };

  useEffect(() => setPage(1), [filter, search]);

  if (loading) return <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map((item)=><Skeleton key={item} className="h-28" />)}</div>{[0,1,2,3,4].map((item)=><Skeleton key={item} className="h-20" />)}</div>;

  const totalValue = orders.reduce((sum, order) => sum + Number(order.total_bdt), 0);
  const pendingValue = orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).reduce((sum, order) => sum + Number(order.total_bdt), 0);
  const paidCount = orders.filter((order) => order.payment_status === "paid").length;
  const conversion = orders.length ? Math.round((paidCount / orders.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <StaffPageHeader title={bn ? "অর্ডার ও সেলস" : "Orders & Sales"} description={bn ? "পেমেন্ট, গ্রাহক ও প্রভিশনিংয়ের তথ্যভিত্তিক কিউ" : "A data-led queue for payments, customers and provisioning"} actions={<Button variant="outline" onClick={fetchData}><RefreshCw />{bn?"রিফ্রেশ":"Refresh"}</Button>} />

      {/* Stats */}
      <StaffMetricStrip metrics={[{label:bn?"মোট ভ্যালু":"Order value",value:`৳${formatAmount(totalValue,lang)}`,detail:`${stats.total} ${bn?"অর্ডার":"orders"}`,icon:CircleDollarSign,tone:"primary"},{label:bn?"অপেক্ষমাণ ভ্যালু":"Pending value",value:`৳${formatAmount(pendingValue,lang)}`,detail:`${stats.pending+stats.processing} ${bn?"কাজ":"actions"}`,icon:Clock,tone:"warning"},{label:bn?"পরিশোধিত":"Paid orders",value:paidCount,detail:`${conversion}% ${bn?"হার":"rate"}`,icon:Check,tone:"success"},{label:bn?"সক্রিয়":"Active",value:stats.active,detail:bn?"প্রভিশন সম্পন্ন":"provisioned",icon:Package,tone:"success"}]} />

      {/* Filter tabs */}
      <div className="staff-panel flex flex-col gap-3 p-3 md:flex-row md:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={bn?"অর্ডার, গ্রাহক বা পেমেন্ট খুঁজুন":"Search order, customer or payment"} className="pl-9" /></div><div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: "all" as const, label: bn ? "সকল" : "All", count: orders.length },
          { key: "pending" as const, label: bn ? "পেন্ডিং" : "Pending", count: orders.filter(o => ["pending", "confirmed", "processing"].includes(o.status)).length },
          { key: "active" as const, label: bn ? "সক্রিয়" : "Active", count: orders.filter(o => ["active", "completed"].includes(o.status)).length },
        ].map(tab => (
          <Button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            variant={filter === tab.key ? "default" : "ghost"}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div></div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{bn ? "কোনো অর্ডার নেই" : "No orders found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
           {pagedOrders.map((order, i) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];
            const isProcessing = processingId === order.id;

            return (
              <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="staff-panel overflow-hidden">
                
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
                             <Button
                              onClick={() => updateOrderStatus(order.id, "confirmed")}
                              disabled={isProcessing}
                               variant="secondary" size="sm"
                            >
                              <Check className="w-3.5 h-3.5" /> {bn ? "কনফার্ম" : "Confirm"}
                             </Button>
                             <Button
                              onClick={() => updateOrderStatus(order.id, "cancelled")}
                              disabled={isProcessing}
                               variant="destructive" size="sm"
                            >
                              <X className="w-3.5 h-3.5" /> {bn ? "বাতিল" : "Cancel"}
                             </Button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                           <Button
                            onClick={() => provisionOrder(order.id)}
                            disabled={isProcessing}
                             variant="secondary" size="sm" className="text-success"
                          >
                            <Zap className="w-3.5 h-3.5" /> {bn ? "প্রভিশন করুন" : "Provision"}
                           </Button>
                        )}
                        {order.status === "processing" && (
                           <Button
                            onClick={() => provisionOrder(order.id)}
                            disabled={isProcessing}
                             variant="secondary" size="sm" className="text-success"
                          >
                            <Zap className="w-3.5 h-3.5" /> {bn ? "এক্টিভেট" : "Activate"}
                           </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          <DataPagination total={filteredOrders.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
        </div>
      )}
    </div>
  );
};

export default CallCenterOrders;
