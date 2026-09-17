import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
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
          <div className="flex gap-3 justify-center mt-6">
            {status === "success" ? (
              <Link
                to="/dashboard/billing"
                className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {lang === "bn" ? "বিলিং দেখুন" : "View Billing"}
              </Link>
            ) : (
              <Link
                to="/checkout"
                className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                {lang === "bn" ? "পুনরায় চেষ্টা করুন" : "Try Again"}
              </Link>
            )}
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
};

export const PaymentSuccess = () => <PaymentResult status="success" />;
export const PaymentFail = () => <PaymentResult status="fail" />;
export const PaymentCancel = () => <PaymentResult status="cancel" />;
