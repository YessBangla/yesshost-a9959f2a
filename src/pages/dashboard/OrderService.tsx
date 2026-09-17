import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Check, ShoppingCart, Server, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { logApiError } from "@/lib/errorReporting";

interface Plan {
  id: string;
  category: string;
  slug: string;
  name: string;
  price_bdt: string;
  annual_price_bdt: string | null;
  subtitle: string | null;
  features: any;
  is_highlighted: boolean | null;
}

const categoryLabels: Record<string, { en: string; bn: string }> = {
  shared: { en: "Shared Hosting", bn: "শেয়ার্ড হোস্টিং" },
  wordpress: { en: "WordPress Hosting", bn: "ওয়ার্ডপ্রেস হোস্টিং" },
  reseller: { en: "Reseller Hosting", bn: "রিসেলার হোস্টিং" },
  vps: { en: "VPS Server", bn: "ভিপিএস সার্ভার" },
  dedicated: { en: "Dedicated Server", bn: "ডেডিকেটেড সার্ভার" },
  email: { en: "Email Hosting", bn: "ইমেইল হোস্টিং" },
  ssl: { en: "SSL Certificate", bn: "এসএসএল সার্টিফিকেট" },
};

const DashboardOrderService = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { addItem, setCartOpen, isInCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    supabase
      .from("pricing_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) logApiError("pricing_plans.select", error, { area: "api" });
        setPlans((data as any) || []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const set = Array.from(new Set(plans.map((p) => p.category)));
    return ["all", ...set];
  }, [plans]);

  const visible = useMemo(
    () => (category === "all" ? plans : plans.filter((p) => p.category === category)),
    [plans, category]
  );

  const label = (c: string) =>
    c === "all" ? (bn ? "সব" : "All") : categoryLabels[c]?.[bn ? "bn" : "en"] || c;

  const price = (p: Plan) =>
    cycle === "annual" && p.annual_price_bdt ? p.annual_price_bdt : p.price_bdt;

  const handleAdd = (p: Plan) => {
    addItem({
      id: `${p.slug}-${cycle}`,
      type: "hosting",
      name: p.name,
      description: p.subtitle || undefined,
      price_bdt: price(p),
      plan_id: p.id,
      billing_cycle: cycle === "annual" ? "annually" : "monthly",
      category: p.category,
    });
    toast({
      title: bn ? "কার্টে যোগ হয়েছে" : "Added to cart",
      description: p.name,
    });
    setCartOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {bn ? "নতুন সার্ভিস অর্ডার" : "Order New Services"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {bn ? "প্ল্যান বাছাই করে সরাসরি কার্টে যোগ করুন" : "Pick a plan and add it straight to your cart"}
          </p>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20"
        >
          <ShoppingCart className="w-4 h-4" /> {bn ? "চেকআউট" : "Checkout"}
        </button>
      </div>

      {/* Billing cycle */}
      <div className="flex items-center gap-2">
        {(["monthly", "annual"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold min-h-[44px] sm:min-h-0 ${
              cycle === c ? "gradient-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground"
            }`}
          >
            {c === "monthly" ? (bn ? "মাসিক" : "Monthly") : bn ? "বার্ষিক" : "Annual"}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold border ${
              category === c
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary/40 text-muted-foreground border-border"
            }`}
          >
            {label(c)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 h-56 animate-pulse bg-secondary/30" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Server className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {bn ? "এই ক্যাটাগরিতে কোনো প্ল্যান নেই।" : "No plans in this category."}
          </p>
          <Link to="/hosting-plans" className="text-sm text-primary font-semibold mt-2 inline-block">
            {bn ? "সব প্ল্যান দেখুন" : "Browse all plans"}
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const features: string[] = Array.isArray(p.features) ? p.features : [];
            const inCart = isInCart(`${p.slug}-${cycle}`);
            return (
              <div
                key={p.id}
                className={`glass-card rounded-2xl p-5 flex flex-col ${p.is_highlighted ? "border-primary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{label(p.category)}</p>
                    <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                  </div>
                  {p.is_highlighted && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {bn ? "জনপ্রিয়" : "Popular"}
                    </span>
                  )}
                </div>
                {p.subtitle && <p className="text-xs text-muted-foreground mb-3">{p.subtitle}</p>}
                <p className="text-2xl font-extrabold text-foreground mb-3">
                  ৳{price(p)}
                  <span className="text-xs font-medium text-muted-foreground">
                    /{cycle === "annual" ? (bn ? "বছর" : "yr") : bn ? "মাস" : "mo"}
                  </span>
                </p>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {features.slice(0, 5).map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>{typeof f === "string" ? f : JSON.stringify(f)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdd(p)}
                    disabled={inCart}
                    className="flex-1 gradient-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {inCart ? (bn ? "কার্টে আছে" : "In cart") : bn ? "কার্টে যোগ" : "Add to cart"}
                  </button>
                  <Link
                    to={`/services/${p.slug}`}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-secondary/60 text-foreground"
                  >
                    {bn ? "বিস্তারিত" : "Details"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardOrderService;
