import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Globe, Trash2, ArrowRight, CreditCard, Building2, CheckCircle2, AlertCircle, Loader2, Server, Palette, Tag, X, MessageSquare, Wallet } from "lucide-react";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PublicLayout from "@/components/PublicLayout";
import { formatPrice, formatAmount } from "@/lib/formatPrice";

import bkashLogo from "@/assets/partners/bkash.svg";
import nagadLogo from "@/assets/partners/nagad.svg";
import sslLogo from "@/assets/partners/ssl-wireless.png";

const paymentMethods = [
  { id: "wallet", label: "Wallet Balance", labelBn: "ওয়ালেট ব্যালেন্স", icon: Wallet, desc: "Pay from your wallet balance", descBn: "ওয়ালেট ব্যালেন্স থেকে পে করুন", ready: true },
  { id: "sslcommerz", label: "SSLCommerz", labelBn: "SSLCommerz", logo: sslLogo, desc: "Visa, Master, bKash, Nagad, Mobile Banking", ready: true },
  { id: "bkash", label: "bKash", labelBn: "বিকাশ", logo: bkashLogo, desc: "bKash Tokenized Payment", ready: false },
  { id: "nagad", label: "Nagad", labelBn: "নগদ", logo: nagadLogo, desc: "Nagad Digital Payment", ready: false },
  { id: "bank", label: "Bank Transfer", labelBn: "ব্যাংক ট্রান্সফার", icon: Building2, desc: "Manual Bank Transfer", ready: true },
];

const itemIcon = (type: CartItem["type"]) => {
  switch (type) {
    case "hosting": return Server;
    case "theme": return Palette;
    default: return Globe;
  }
};

const itemTypeLabel = (item: CartItem, bn: boolean) => {
  switch (item.type) {
    case "domain": return bn ? "ডোমেইন রেজিস্ট্রেশন • ১ বছর" : "Domain Registration • 1 Year";
    case "hosting": return item.description || (bn ? "হোস্টিং প্ল্যান" : "Hosting Plan");
    case "theme": return item.description || (bn ? "ওয়েবসাইট থিম" : "Website Theme");
  }
};

const Checkout = () => {
  const { items, clearCart, removeItem } = useCart();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount: number | null;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");
      const balance = (data || []).reduce((sum, t) => {
        const isCredit = t.type === "deposit" || t.type === "refund";
        return isCredit ? sum + Number(t.amount_bdt) : sum - Number(t.amount_bdt);
      }, 0);
      setWalletBalance(balance);
    };
    fetchBalance();
  }, [user]);

  const parseBdtPrice = (price: string): number => {
    const ascii = price.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
    return parseInt(ascii.replace(/[^\d]/g, ""), 10) || 0;
  };
  const subtotalBdt = items.reduce((sum, item) => sum + parseBdtPrice(item.price_bdt), 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.min(
          Math.round(subtotalBdt * appliedCoupon.discount_value / 100),
          appliedCoupon.max_discount_amount ?? Infinity
        )
      : Math.min(appliedCoupon.discount_value, subtotalBdt)
    : 0;
  const totalBdt = subtotalBdt - discountAmount;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setCouponLoading(true);

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setCouponError(bn ? "কুপন কোড ভুল বা মেয়াদ শেষ" : "Invalid or expired coupon code");
        setCouponLoading(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError(bn ? "কুপনের মেয়াদ শেষ হয়ে গেছে" : "Coupon has expired");
        setCouponLoading(false);
        return;
      }

      if (data.max_uses !== null && data.used_count >= data.max_uses) {
        setCouponError(bn ? "কুপন ব্যবহারের সীমা শেষ" : "Coupon usage limit reached");
        setCouponLoading(false);
        return;
      }

      if (data.min_order_amount && subtotalBdt < data.min_order_amount) {
        setCouponError(
          bn
            ? `সর্বনিম্ন অর্ডার ৳${data.min_order_amount} প্রয়োজন`
            : `Minimum order of ৳${data.min_order_amount} required`
        );
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discount_type: data.discount_type as "percentage" | "fixed",
        discount_value: Number(data.discount_value),
        max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
      });
      toast({
        title: bn ? "কুপন প্রয়োগ হয়েছে!" : "Coupon Applied!",
        description: data.discount_type === "percentage"
          ? `${data.discount_value}% ${bn ? "ডিসকাউন্ট" : "discount"}`
          : `৳${data.discount_value} ${bn ? "ছাড়" : "off"}`,
      });
    } catch {
      setCouponError(bn ? "কুপন যাচাই করতে সমস্যা হয়েছে" : "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: bn ? "লগইন প্রয়োজন" : "Login Required", description: bn ? "অর্ডার করতে লগইন করুন" : "Please login to place an order", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!selectedPayment) {
      toast({ title: bn ? "পেমেন্ট মেথড নির্বাচন করুন" : "Select Payment Method", description: bn ? "একটি পেমেন্ট পদ্ধতি বেছে নিন" : "Please select a payment method", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          subtotal_bdt: subtotalBdt,
          discount_bdt: discountAmount,
          total_bdt: totalBdt,
          payment_method: selectedPayment,
          coupon_code: appliedCoupon?.code || null,
          order_note: orderNote.trim() || null,
          status: "pending" as const,
          payment_status: "unpaid",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;
      const orderId = orderData.id;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: orderId,
        item_type: item.type,
        item_name: item.name,
        item_description: item.description || null,
        price_bdt: parseBdtPrice(item.price_bdt),
        domain_name: item.domain || null,
        domain_ext: item.ext || null,
        plan_id: item.plan_id || null,
        billing_cycle: item.billing_cycle || null,
        hosting_category: item.category || null,
        theme_id: item.theme_id || null,
        theme_slug: item.theme_slug || null,
        include_hosting: item.include_hosting || false,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Increment coupon usage
      if (appliedCoupon) {
        await supabase.rpc("increment_coupon_usage" as any, { coupon_id: appliedCoupon.id });
      }

      // 4. Create invoice
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const descParts: string[] = [];
      const domainItems = items.filter(i => i.type === "domain");
      const hostingItems = items.filter(i => i.type === "hosting");
      const themeItems = items.filter(i => i.type === "theme");
      if (domainItems.length) descParts.push(`Domain: ${domainItems.map(i => i.domain).join(", ")}`);
      if (hostingItems.length) descParts.push(`Hosting: ${hostingItems.map(i => i.name).join(", ")}`);
      if (themeItems.length) descParts.push(`Theme: ${themeItems.map(i => i.name).join(", ")}`);
      if (appliedCoupon) descParts.push(`Coupon: ${appliedCoupon.code} (-৳${discountAmount})`);

      const { data: invoiceData, error: invoiceError } = await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: invoiceNumber,
        amount_bdt: totalBdt,
        description: descParts.join(" | "),
        status: "unpaid" as const,
        payment_method: selectedPayment,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }).select("id").single();

      if (invoiceError) throw invoiceError;

      // 5. Link invoice to order
      await supabase.from("orders").update({ invoice_id: invoiceData.id }).eq("id", orderId);

      // 6. Route to payment
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

      if (selectedPayment === "wallet") {
        if (walletBalance < totalBdt) {
          toast({ title: bn ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient Balance", description: bn ? `আপনার ওয়ালেটে ৳${walletBalance} আছে, প্রয়োজন ৳${totalBdt}` : `Wallet has ৳${walletBalance}, need ৳${totalBdt}`, variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("wallet-pay-invoice", {
          body: { invoice_id: invoiceData.id },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        setWalletBalance(data.new_balance);
        setPlacedOrderNumber(orderNumber);
        setOrderPlaced(true);
        clearCart();
        toast({ title: bn ? "পেমেন্ট সফল!" : "Payment Successful!", description: bn ? `ওয়ালেট থেকে ৳${totalBdt} কেটে নেওয়া হয়েছে` : `৳${totalBdt} paid from wallet` });
        return;
      } else if (selectedPayment === "sslcommerz") {
        const { data, error } = await supabase.functions.invoke("sslcommerz-init", {
          body: {
            invoice_id: invoiceData.id,
            amount: totalBdt,
            customer_name: profile?.full_name || "Customer",
            customer_email: user.email,
            customer_phone: profile?.phone || "01700000000",
            description: descParts.join(" | "),
          },
        });
        if (error) throw error;
        if (data?.gateway_url) {
          clearCart();
          if (data.is_sandbox) {
            toast({ title: "🧪 Sandbox Mode", description: bn ? "এটি টেস্ট পেমেন্ট।" : "This is a test payment." });
          }
          window.location.href = data.gateway_url;
          return;
        } else {
          throw new Error(data?.error || "Failed to create payment session");
        }
      } else if (selectedPayment === "bkash") {
        const { data, error } = await supabase.functions.invoke("bkash-init", {
          body: { invoice_id: invoiceData.id, amount: totalBdt, payer_reference: user.email },
        });
        if (error || data?.error) {
          if (data?.is_sandbox) {
            toast({ title: "⚠️ bKash Not Configured", description: data?.message || "bKash credentials not yet configured", variant: "destructive" });
            setLoading(false);
            return;
          }
          throw new Error(data?.error || error?.message);
        }
        if (data?.bkash_url) { clearCart(); window.location.href = data.bkash_url; return; }
      } else if (selectedPayment === "nagad") {
        const { data, error } = await supabase.functions.invoke("nagad-init", {
          body: { invoice_id: invoiceData.id, amount: totalBdt },
        });
        if (error || data?.error) {
          if (data?.is_sandbox) {
            toast({ title: "⚠️ Nagad Not Configured", description: data?.message || "Nagad credentials not yet configured", variant: "destructive" });
            setLoading(false);
            return;
          }
          throw new Error(data?.error || error?.message);
        }
      } else if (selectedPayment === "bank") {
        // Mark order as confirmed (awaiting bank transfer)
        await supabase.from("orders").update({ status: "confirmed" as const, confirmed_at: new Date().toISOString() }).eq("id", orderId);
        setPlacedOrderNumber(orderNumber);
        setOrderPlaced(true);
        clearCart();
        toast({
          title: bn ? "অর্ডার সফল!" : "Order Placed!",
          description: bn ? `অর্ডার: ${orderNumber}। ব্যাংক ট্রান্সফারের পর আমাদের জানান।` : `Order: ${orderNumber}. Notify us after bank transfer.`,
        });
        return;
      }
    } catch (err: any) {
      console.error("Order error:", err);
      toast({ title: bn ? "ত্রুটি!" : "Error!", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 pt-20">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{bn ? "অর্ডার সফল হয়েছে!" : "Order Placed Successfully!"}</h1>
            <p className="text-xs font-mono text-primary bg-primary/5 px-3 py-1.5 rounded-lg inline-block mb-4">{placedOrderNumber}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedPayment === "bank"
                ? (bn ? "অনুগ্রহ করে নিচের ব্যাংক অ্যাকাউন্টে টাকা পাঠান এবং আমাদের জানান।" : "Please transfer the amount to our bank account and notify us.")
                : (bn ? "আপনার অর্ডার প্রসেস করা হচ্ছে।" : "Your order is being processed.")}
            </p>
            {selectedPayment === "bank" && (
              <div className="glass-card p-4 mb-6 text-left text-sm space-y-2">
                <p className="font-semibold text-foreground">{bn ? "ব্যাংক তথ্য:" : "Bank Details:"}</p>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <p>Bank: Dutch Bangla Bank Ltd</p>
                  <p>Account: Yess Host Technologies</p>
                  <p>A/C No: 123-456-7890</p>
                  <p>Branch: Dhaka Main</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Link to="/dashboard/orders" className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                {bn ? "অর্ডার ট্র্যাক করুন" : "Track Order"}
              </Link>
              <Link to="/" className="px-6 py-3 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/60 text-foreground transition-all">
                {bn ? "হোমে যান" : "Go Home"}
              </Link>
            </div>
          </motion.div>
        </div>
      </PublicLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 pt-20">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">{bn ? "কার্ট খালি" : "Cart is Empty"}</h1>
            <p className="text-sm text-muted-foreground mb-6">{bn ? "ডোমেইন, হোস্টিং বা থিম যোগ করুন" : "Add domains, hosting or themes to cart"}</p>
            <Link to="/" className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              {bn ? "সার্ভিস দেখুন" : "Browse Services"}
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold text-foreground mb-8">{bn ? "চেকআউট" : "Checkout"}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card-elevated rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                {bn ? "আপনার আইটেমসমূহ" : "Your Items"}
              </h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const Icon = itemIcon(item.type);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{itemTypeLabel(item, bn)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">৳{formatPrice(item.price_bdt, lang)}</span>
                        <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment method */}
            <div className="glass-card-elevated rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {bn ? "পেমেন্ট পদ্ধতি নির্বাচন করুন" : "Select Payment Method"}
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPayment === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-secondary/30"
                    }`}
                  >
                    {method.logo ? (
                      <img src={method.logo} alt={method.label} className="w-10 h-10 object-contain rounded-lg" />
                    ) : method.icon ? (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <method.icon className="w-5 h-5 text-primary" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{bn ? method.labelBn : method.label}</span>
                        {!method.ready && (
                          <span className="text-[9px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">{bn ? "শীঘ্রই আসছে" : "Coming Soon"}</span>
                        )}
                        {method.id === "sslcommerz" && (
                          <span className="text-[9px] font-bold gradient-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">🧪 Sandbox</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{method.desc}</p>
                      {method.id === "wallet" && user && (
                        <p className={`text-[11px] mt-0.5 font-semibold ${walletBalance >= totalBdt ? "text-primary" : "text-destructive"}`}>
                          {bn ? `ব্যালেন্স: ৳${walletBalance}` : `Balance: ৳${walletBalance}`}
                          {walletBalance < totalBdt && (` • ${bn ? "অপর্যাপ্ত" : "Insufficient"}`)}
                        </p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPayment === method.id ? "border-primary bg-primary" : "border-border"}`}>
                      {selectedPayment === method.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground">
                  {bn ? "বর্তমানে SSLCommerz Sandbox (টেস্ট) মোডে চলছে। লাইভ পেমেন্টের জন্য মার্চেন্ট credentials প্রয়োজন।" : "SSLCommerz is currently in Sandbox (test) mode. Merchant credentials needed for live payments."}
                </p>
              </div>
            </div>

            {/* Order Note */}
            <div className="glass-card-elevated rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                {bn ? "অর্ডার নোট (ঐচ্ছিক)" : "Order Note (Optional)"}
              </h2>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={bn ? "বিশেষ নির্দেশনা বা মন্তব্য লিখুন..." : "Any special instructions or comments..."}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30 resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{orderNote.length}/500</p>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="glass-card-elevated rounded-xl p-5 sticky top-24">
              <h2 className="text-sm font-semibold text-foreground mb-4">{bn ? "অর্ডার সামারি" : "Order Summary"}</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                    <span className="text-foreground font-medium shrink-0">৳{formatPrice(item.price_bdt, lang)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="border-t border-border pt-3 mb-4">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  {bn ? "কুপন কোড" : "Coupon Code"}
                </p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <div>
                      <span className="text-xs font-bold text-primary">{appliedCoupon.code}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {appliedCoupon.discount_type === "percentage"
                          ? `${appliedCoupon.discount_value}% ${bn ? "ছাড়" : "off"}`
                          : `৳${formatAmount(appliedCoupon.discount_value, lang)} ${bn ? "ছাড়" : "off"}`}
                      </p>
                    </div>
                    <button onClick={removeCoupon} className="p-1 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      placeholder={bn ? "কোড লিখুন" : "Enter code"}
                      maxLength={30}
                      className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (bn ? "প্রয়োগ" : "Apply")}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] text-destructive mt-1.5">{couponError}</p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{bn ? "সাবটোটাল" : "Subtotal"}</span>
                  <span className="text-foreground font-medium">৳{formatAmount(subtotalBdt, lang)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary font-medium">{bn ? "ডিসকাউন্ট" : "Discount"}</span>
                    <span className="text-primary font-semibold">-৳{formatAmount(discountAmount, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">{bn ? "সর্বমোট" : "Total"}</span>
                  <span className="text-xl font-bold text-foreground">৳{formatAmount(totalBdt, lang)}</span>
                </div>
              </div>

              {!user && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">{bn ? "অর্ডার করতে আপনাকে লগইন করতে হবে।" : "You need to login to place an order."}</p>
                  <Link to="/login" className="text-xs text-primary font-semibold hover:underline">{bn ? "লগইন করুন" : "Login now"}</Link>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading || !selectedPayment}
                className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {selectedPayment === "bank" ? (bn ? "অর্ডার দিন" : "Place Order") : (bn ? "পেমেন্ট করুন" : "Pay Now")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Checkout;
