import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { OrdersSkeleton } from "@/components/DashboardSkeleton";
import EmptyState from "@/components/EmptyState";
import { ShoppingBag, Package, Clock, CheckCircle2, XCircle, Truck, CreditCard, Eye, ChevronDown, ChevronUp, Globe, Server, Palette } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/formatPrice";
import DataToolbar from "@/components/DataToolbar";
import DataPagination from "@/components/DataPagination";
import { downloadCsv, csvDate } from "@/lib/export-csv";

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal_bdt: number;
  discount_bdt: number;
  total_bdt: number;
  payment_method: string | null;
  payment_status: string;
  coupon_code: string | null;
  order_note: string | null;
  created_at: string;
  confirmed_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  paid_at: string | null;
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

const statusSteps = [
  { key: "pending", icon: Clock, en: "Pending", bn: "পেন্ডিং" },
  { key: "confirmed", icon: CheckCircle2, en: "Confirmed", bn: "কনফার্মড" },
  { key: "processing", icon: Truck, en: "Processing", bn: "প্রসেসিং" },
  { key: "active", icon: Package, en: "Active", bn: "সক্রিয়" },
];

const statusConfig: Record<string, { color: string; en: string; bn: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", en: "Pending", bn: "পেন্ডিং" },
  confirmed: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", en: "Confirmed", bn: "কনফার্মড" },
  processing: { color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", en: "Processing", bn: "প্রসেসিং" },
  provisioning: { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", en: "Provisioning", bn: "প্রভিশনিং" },
  active: { color: "bg-green-500/10 text-green-600 border-green-500/20", en: "Active", bn: "সক্রিয়" },
  completed: { color: "bg-green-500/10 text-green-600 border-green-500/20", en: "Completed", bn: "সম্পন্ন" },
  cancelled: { color: "bg-destructive/10 text-destructive border-destructive/20", en: "Cancelled", bn: "বাতিল" },
  refunded: { color: "bg-muted text-muted-foreground border-border", en: "Refunded", bn: "ফেরতকৃত" },
};

const itemIcon = (type: string) => {
  switch (type) {
    case "hosting": return Server;
    case "theme": return Palette;
    default: return Globe;
  }
};

const OrdersPage = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const ordersList = (ordersData || []) as Order[];
      setOrders(ordersList);

      // Fetch items for all orders
      if (ordersList.length > 0) {
        const orderIds = ordersList.map(o => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        const grouped: Record<string, OrderItem[]> = {};
        (itemsData || []).forEach((item: any) => {
          if (!grouped[item.order_id]) grouped[item.order_id] = [];
          grouped[item.order_id].push(item as OrderItem);
        });
        setOrderItems(grouped);
      }
      setLoading(false);
    };
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel("user-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(bn ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStepIndex = (status: string) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : (status === "completed" ? statusSteps.length : -1);
  };

  const stats = {
    total: orders.length,
    active: orders.filter(o => ["active", "completed"].includes(o.status)).length,
    pending: orders.filter(o => ["pending", "confirmed", "processing", "provisioning"].includes(o.status)).length,
    totalSpent: orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_bdt), 0),
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      const items = orderItems[o.id] || [];
      const okSearch = !q || [o.order_number, o.status, o.payment_method, o.coupon_code, String(o.total_bdt), ...items.map(it => it.item_name), ...items.map(it => it.domain_name)]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      const okStatus =
        statusFilter === "all" ? true :
        statusFilter === "active" ? ["active", "completed"].includes(o.status) :
        statusFilter === "progress" ? ["pending", "confirmed", "processing", "provisioning"].includes(o.status) :
        ["cancelled", "refunded"].includes(o.status);
      return okSearch && okStatus;
    });
  }, [orders, orderItems, search, statusFilter]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [search, statusFilter]);
  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page, pageSize]
  );

  const exportOrders = () => {
    downloadCsv(
      "yesshost-orders",
      ["order_number", "date", "status", "payment_status", "payment_method", "items", "discount_bdt", "total_bdt"],
      filteredOrders.map(o => [
        o.order_number,
        csvDate(o.created_at),
        o.status,
        o.payment_status,
        o.payment_method || "",
        (orderItems[o.id] || []).map(i => i.item_name).join(" | "),
        o.discount_bdt,
        o.total_bdt,
      ]),
    );
  };

  const orderFilters = [
    { value: "all", label: bn ? "সব" : "All", count: orders.length },
    { value: "active", label: bn ? "সক্রিয়" : "Active", count: stats.active },
    { value: "progress", label: bn ? "প্রসেসিং" : "In progress", count: stats.pending },
    { value: "closed", label: bn ? "বাতিল/ফেরত" : "Cancelled", count: orders.filter(o => ["cancelled", "refunded"].includes(o.status)).length },
  ];

  if (loading) return <OrdersSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {bn ? "অর্ডার ট্র্যাকিং" : "Order Tracking"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {bn ? "আপনার সকল অর্ডারের রিয়েলটাইম স্ট্যাটাস" : "Real-time status of all your orders"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: bn ? "মোট অর্ডার" : "Total Orders", value: stats.total, icon: ShoppingBag },
          { label: bn ? "সক্রিয়" : "Active", value: stats.active, icon: CheckCircle2 },
          { label: bn ? "প্রসেসিং" : "In Progress", value: stats.pending, icon: Clock },
          { label: bn ? "মোট ব্যয়" : "Total Spent", value: `৳${formatAmount(stats.totalSpent, lang)}`, icon: CreditCard },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <s.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {orders.length > 0 && (
        <DataToolbar
          search={search}
          onSearch={setSearch}
          placeholder={bn ? "অর্ডার নম্বর, প্ল্যান বা ডোমেইন খুঁজুন..." : "Search order no., plan or domain..."}
          filters={orderFilters}
          activeFilter={statusFilter}
          onFilter={setStatusFilter}
          onExport={exportOrders}
          resultCount={filteredOrders.length}
        />
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={bn ? "কোনো অর্ডার নেই" : "No Orders Yet"}
          description={bn ? "আপনার প্রথম অর্ডার দিন এবং এখানে ট্র্যাক করুন" : "Place your first order and track it here"}
          actionLabel={bn ? "প্ল্যান দেখুন" : "Browse Plans"}
          actionTo="/#pricing"
        />
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
          {bn ? "এই ফিল্টারে কোনো অর্ডার পাওয়া যায়নি" : "No orders match this filter"}
        </div>
      ) : (
        <div className="space-y-4">
          {pagedOrders.map((order, i) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];
            const currentStep = getStepIndex(order.status);
            const isCancelled = order.status === "cancelled" || order.status === "refunded";

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-xl overflow-hidden"
              >
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{order.order_number}</span>
                          <Badge className={`${sc.color} border text-[10px] px-1.5 py-0`}>
                            {bn ? sc.bn : sc.en}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(order.created_at)} • {items.length} {bn ? "আইটেম" : "items"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-lg font-bold text-foreground">৳{formatAmount(Number(order.total_bdt), lang)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-border"
                  >
                    {/* Status Timeline */}
                    {!isCancelled && (
                      <div className="px-4 sm:px-5 py-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                          {bn ? "অর্ডার প্রগ্রেস" : "Order Progress"}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {statusSteps.map((step, idx) => {
                            const isActive = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            const StepIcon = step.icon;
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                                    isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                                    isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                                  }`}>
                                    <StepIcon className="w-4 h-4" />
                                  </div>
                                  <span className={`text-[10px] mt-1.5 font-medium text-center ${isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                    {bn ? step.bn : step.en}
                                  </span>
                                </div>
                                {idx < statusSteps.length - 1 && (
                                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${
                                    idx < currentStep ? "bg-primary" : "bg-border"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="px-4 sm:px-5 pb-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {bn ? "আইটেমসমূহ" : "Items"}
                      </p>
                      {items.map(item => {
                        const Icon = itemIcon(item.item_type);
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.item_name}</p>
                              {item.item_description && <p className="text-[11px] text-muted-foreground truncate">{item.item_description}</p>}
                              {item.domain_name && <p className="text-[11px] text-primary font-mono">{item.domain_name}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-foreground">৳{formatAmount(Number(item.price_bdt), lang)}</p>
                              {item.provisioned_at && (
                                <span className="text-[10px] text-green-600">✓ {bn ? "সক্রিয়" : "Active"}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Details */}
                    <div className="px-4 sm:px-5 pb-4">
                      <div className="p-3 rounded-xl bg-secondary/20 border border-border/50 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{bn ? "পেমেন্ট মেথড" : "Payment"}</span>
                          <span className="text-foreground font-medium capitalize">{order.payment_method || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{bn ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}</span>
                          <span className={`font-medium capitalize ${order.payment_status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                            {order.payment_status === "paid" ? (bn ? "পরিশোধিত" : "Paid") : (bn ? "অপরিশোধিত" : "Unpaid")}
                          </span>
                        </div>
                        {order.discount_bdt > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{bn ? "ডিসকাউন্ট" : "Discount"}</span>
                            <span className="text-primary font-medium">-৳{formatAmount(Number(order.discount_bdt), lang)} {order.coupon_code && `(${order.coupon_code})`}</span>
                          </div>
                        )}
                        {order.order_note && (
                          <div className="pt-1.5 border-t border-border/50">
                            <span className="text-muted-foreground">{bn ? "নোট: " : "Note: "}</span>
                            <span className="text-foreground">{order.order_note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          <DataPagination
            total={filteredOrders.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
