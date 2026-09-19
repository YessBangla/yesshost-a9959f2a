import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, ReceiptText, RotateCcw } from "lucide-react";
import { useSearchParams, Link } from "@/lib/router-compat";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicLayout from "@/components/PublicLayout";

const statusConfig = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-success",
    bgClass: "bg-success/10",
    titleBn: "পেমেন্ট সফল হয়েছে!",
    titleEn: "Payment Successful!",
    descBn: "আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। আপনার সার্ভিস সক্রিয় করা হচ্ছে।",
    descEn: "Your payment was completed successfully. Your service is being activated.",
  },
  fail: {
    icon: XCircle,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    titleBn: "পেমেন্ট ব্যর্থ হয়েছে",
    titleEn: "Payment Failed",
    descBn: "পেমেন্ট সম্পন্ন হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    descEn: "Payment could not be completed. Please try again.",
  },
  cancel: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
    titleBn: "পেমেন্ট বাতিল করা হয়েছে",
    titleEn: "Payment Cancelled",
    descBn: "আপনি পেমেন্ট বাতিল করেছেন। আপনার অর্ডার পেন্ডিং রয়েছে।",
    descEn: "You cancelled the payment. Your order is still pending.",
  },
};

const PaymentResult = ({ status }: { status: "success" | "fail" | "cancel" }) => {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const invoice = searchParams.get("invoice") || "";
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <PublicLayout>
      <div className="mobile-page-shell min-h-[70vh] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mobile-glass-panel w-full max-w-md p-6 text-center sm:p-8"
        >
          <div className={`w-20 h-20 rounded-full ${config.bgClass} flex items-center justify-center mx-auto mb-6`}>
            <Icon className={`w-10 h-10 ${config.iconClass}`} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {lang === "bn" ? config.titleBn : config.titleEn}
          </h1>
          <p className="text-sm text-muted-foreground mb-2">
            {lang === "bn" ? config.descBn : config.descEn}
          </p>
          {ref && (
            <p className="text-xs text-muted-foreground mb-6 font-mono bg-secondary/50 px-3 py-1.5 rounded-lg inline-block">
              Ref: {ref}
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {status === "success" ? (
              <Link
                to="/dashboard/billing"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <ReceiptText className="size-4" /> {lang === "bn" ? "বিলিং দেখুন" : "View Billing"}
              </Link>
            ) : (
              <Link
                to={invoice ? `/dashboard/billing?invoice=${encodeURIComponent(invoice)}&action=pay` : "/dashboard/billing"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <RotateCcw className="size-4" /> {lang === "bn" ? "পুনরায় চেষ্টা করুন" : "Try Again"}
              </Link>
            )}
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary/60"
            >
              {lang === "bn" ? "হোমে যান" : "Go Home"}
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export const PaymentSuccess = () => <PaymentResult status="success" />;
export const PaymentFail = () => <PaymentResult status="fail" />;
export const PaymentCancel = () => <PaymentResult status="cancel" />;
