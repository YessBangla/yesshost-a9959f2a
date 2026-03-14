import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Globe, Trash2, ArrowRight, CreditCard, Smartphone, Building2, CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PublicLayout from "@/components/PublicLayout";

const paymentMethods = [
  { id: "bkash", label: "bKash", icon: Smartphone, color: "text-pink-500" },
  { id: "nagad", label: "Nagad", icon: Smartphone, color: "text-orange-500" },
  { id: "bank", label: "Bank Transfer", labelBn: "ব্যাংক ট্রান্সফার", icon: Building2, color: "text-primary" },
  { id: "card", label: "Card Payment", labelBn: "কার্ড পেমেন্ট", icon: CreditCard, color: "text-primary" },
];

const Checkout = () => {
  const { items, clearCart, removeItem } = useCart();
  const { lang, tr } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const parseBdtPrice = (price: string): number => {
    return parseInt(price.replace(/[^\d]/g, ""), 10) || 0;
  };

  const totalBdt = items.reduce((sum, item) => sum + parseBdtPrice(item.price_bdt), 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: lang === "bn" ? "লগইন প্রয়োজন" : "Login Required",
        description: lang === "bn" ? "অর্ডার করতে লগইন করুন" : "Please login to place an order",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!selectedPayment) {
      toast({
        title: lang === "bn" ? "পেমেন্ট মেথড নির্বাচন করুন" : "Select Payment Method",
        description: lang === "bn" ? "একটি পেমেন্ট পদ্ধতি বেছে নিন" : "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create services for each domain
      for (const item of items) {
        const { error: serviceError } = await supabase.from("services").insert({
          user_id: user.id,
          name: `Domain: ${item.domain}`,
          service_type: "domain" as const,
          domain: item.domain,
          price_bdt: parseBdtPrice(item.price_bdt),
          billing_cycle: "yearly",
          status: "pending" as const,
        });
        if (serviceError) throw serviceError;
      }

      // Create invoice
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { error: invoiceError } = await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: invoiceNumber,
        amount_bdt: totalBdt,
        description: `Domain Registration: ${items.map((i) => i.domain).join(", ")}`,
        status: "unpaid" as const,
        payment_method: selectedPayment,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (invoiceError) throw invoiceError;

      setOrderPlaced(true);
      clearCart();
      toast({
        title: lang === "bn" ? "অর্ডার সফল!" : "Order Placed!",
        description: lang === "bn"
          ? `ইনভয়েস নম্বর: ${invoiceNumber}`
          : `Invoice: ${invoiceNumber}`,
      });
    } catch (err: any) {
      console.error("Order error:", err);
      toast({
        title: lang === "bn" ? "ত্রুটি!" : "Error!",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {lang === "bn" ? "অর্ডার সফল হয়েছে!" : "Order Placed Successfully!"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {lang === "bn"
                ? "আপনার অর্ডার প্রসেস করা হচ্ছে। পেমেন্ট সম্পন্ন করতে ড্যাশবোর্ডে যান।"
                : "Your order is being processed. Visit your dashboard to complete payment."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/dashboard/billing"
                className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {lang === "bn" ? "বিলিং দেখুন" : "View Billing"}
              </Link>
              <Link
                to="/"
                className="px-6 py-3 rounded-xl font-semibold text-sm border border-border hover:bg-secondary/60 text-foreground transition-all"
              >
                {lang === "bn" ? "হোমে যান" : "Go Home"}
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
            <h1 className="text-xl font-bold text-foreground mb-2">
              {lang === "bn" ? "কার্ট খালি" : "Cart is Empty"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {lang === "bn" ? "ডোমেইন সার্চ করে কার্টে যোগ করুন" : "Search for domains to add to cart"}
            </p>
            <Link
              to="/"
              className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              {lang === "bn" ? "ডোমেইন খুঁজুন" : "Search Domains"}
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          {lang === "bn" ? "চেকআউট" : "Checkout"}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card-elevated rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                {lang === "bn" ? "আপনার ডোমেইনসমূহ" : "Your Domains"}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.domain}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.domain}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {lang === "bn" ? "রেজিস্ট্রেশন • ১ বছর" : "Registration • 1 Year"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-foreground">৳{item.price_bdt}</span>
                      <button
                        onClick={() => removeItem(item.domain)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="glass-card-elevated rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {lang === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-secondary/30"
                    }`}
                  >
                    <method.icon className={`w-5 h-5 ${method.color}`} />
                    <span className="text-sm font-medium text-foreground">
                      {lang === "bn" && method.labelBn ? method.labelBn : method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="glass-card-elevated rounded-xl p-5 sticky top-24">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                {lang === "bn" ? "অর্ডার সামারি" : "Order Summary"}
              </h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.domain} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{item.domain}</span>
                    <span className="text-foreground font-medium shrink-0">৳{item.price_bdt}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {lang === "bn" ? "সর্বমোট" : "Total"}
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    ৳{totalBdt.toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>

              {!user && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    {lang === "bn"
                      ? "অর্ডার করতে আপনাকে লগইন করতে হবে।"
                      : "You need to login to place an order."}
                  </p>
                  <Link to="/login" className="text-xs text-primary font-semibold hover:underline">
                    {lang === "bn" ? "লগইন করুন" : "Login now"}
                  </Link>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {lang === "bn" ? "অর্ডার দিন" : "Place Order"}
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
