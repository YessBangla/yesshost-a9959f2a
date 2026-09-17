import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, Receipt, Clock, CalendarCheck, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDashboardIncome } from "@/lib/dashboard.functions";
import { logApiError } from "@/lib/errorReporting";
import { formatAmount } from "@/lib/formatPrice";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";

const DashboardIncome = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const fetchIncome = useServerFn(getDashboardIncome);
  const incomeQuery = useQuery({
    queryKey: ["dashboard", "income", user?.id ?? "anon"],
    queryFn: () => fetchIncome(),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (incomeQuery.error) logApiError("dashboard.income", incomeQuery.error, { area: "api" });
  }, [incomeQuery.error]);

  const data = incomeQuery.data;

  if (!user || incomeQuery.isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const t = data?.totals;
  const monthLabel = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(bn ? "bn-BD" : "en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const stats = [
    { icon: TrendingUp, label: bn ? "মোট আয় (লাইফটাইম)" : "Lifetime Income", value: t?.lifetimeSpend ?? 0, tone: "text-primary" },
    { icon: Receipt, label: bn ? "পরিশোধিত ইনভয়েস" : "Paid Invoices", value: t?.paidInvoices ?? 0, tone: "text-success" },
    { icon: Clock, label: bn ? "বকেয়া" : "Pending Due", value: t?.pendingDue ?? 0, tone: "text-warning" },
    { icon: Wallet, label: bn ? "ওয়ালেট ডিপোজিট" : "Wallet Deposits", value: t?.walletDeposits ?? 0, tone: "text-info" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "আয় ও পেমেন্ট" : "Income & Payments"}</h1>
          <p className="text-sm text-muted-foreground">
            {bn ? "সাইন-আপ থেকে পেমেন্ট পর্যন্ত সম্পূর্ণ হিসাব" : "Everything from sign-up to payment, computed on the server"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "income-events",
              ["Reference", "Source", "Method", "Amount (BDT)", "Date"],
              (data?.recent ?? []).map((e) => [e.reference, e.source, e.method ?? "", e.amount, csvDate(e.at)]),
            )
          }
          disabled={!data?.recent.length}
        >
          {bn ? "CSV ডাউনলোড" : "Export CSV"}
        </Button>
      </div>

      {/* Journey */}
      <div className="glass-card rounded-xl p-4 sm:p-5 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[11px] text-muted-foreground">{bn ? "সাইন-আপ" : "Signed up"}</p>
            <p className="text-sm font-semibold text-foreground">
              {data?.signupAt ? new Date(data.signupAt).toLocaleDateString(bn ? "bn-BD" : "en-US") : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-success" />
          <div>
            <p className="text-[11px] text-muted-foreground">{bn ? "প্রথম পেমেন্ট" : "First payment"}</p>
            <p className="text-sm font-semibold text-foreground">
              {t?.firstPaymentAt ? new Date(t.firstPaymentAt).toLocaleDateString(bn ? "bn-BD" : "en-US") : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-warning" />
          <div>
            <p className="text-[11px] text-muted-foreground">{bn ? "সাইন-আপ → পেমেন্ট" : "Sign-up to payment"}</p>
            <p className="text-sm font-semibold text-foreground">
              {t?.daysToFirstPayment !== null && t?.daysToFirstPayment !== undefined
                ? `${formatAmount(t.daysToFirstPayment, lang)} ${bn ? "দিন" : "days"}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card rounded-xl p-4"
          >
            <s.icon className={`w-5 h-5 mb-2 ${s.tone}`} />
            <p className={`text-lg font-bold ${s.tone}`}>৳{formatAmount(s.value, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly chart */}
      {data?.monthly.length ? (
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">{bn ? "মাসভিত্তিক পেমেন্ট" : "Monthly payments"}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => `৳${formatAmount(v, lang)}`} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title={bn ? "এখনো কোনো পেমেন্ট নেই" : "No payments yet"}
          description={bn ? "প্রথম অর্ডার সম্পন্ন হলে এখানে আয়ের হিসাব দেখা যাবে" : "Complete your first order to see income here"}
          actionLabel={bn ? "প্ল্যান দেখুন" : "Browse Plans"}
          actionTo="/hosting-plans"
        />
      )}

      {/* By method */}
      {data?.byMethod.length ? (
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">{bn ? "পেমেন্ট মেথড" : "By payment method"}</h2>
          <div className="space-y-2">
            {data.byMethod.map((m) => (
              <div key={m.method} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{m.method}</span>
                <span className="font-semibold text-foreground">
                  ৳{formatAmount(m.amount, lang)} · {formatAmount(m.count, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent events */}
      {data?.recent.length ? (
        <div className="glass-card rounded-xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">{bn ? "সাম্প্রতিক পেমেন্ট" : "Recent payments"}</h2>
          <div className="space-y-2">
            {data.recent.map((e) => (
              <div key={`${e.source}-${e.id}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.reference}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(e.at).toLocaleDateString(bn ? "bn-BD" : "en-US")} · {e.method ?? (bn ? "অজানা" : "unknown")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-success">৳{formatAmount(e.amount, lang)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardIncome;
