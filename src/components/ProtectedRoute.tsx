import { Navigate, useLocation } from "@/lib/router-compat";
import { Clock, ShieldAlert, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const AccountStatusGate = ({ status }: { status: "pending" | "suspended" }) => {
  const { signOut, user } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const pending = status === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            pending ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"
          }`}
        >
          {pending ? <Clock className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {pending
            ? bn ? "আপনার অ্যাকাউন্ট অনুমোদনের অপেক্ষায়" : "Your account is awaiting approval"
            : bn ? "আপনার অ্যাকাউন্ট স্থগিত" : "Your account is suspended"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {pending
            ? bn
              ? "আমাদের টিম আপনার অ্যাকাউন্ট যাচাই করছে। অনুমোদনের পর আপনি ইমেইলে জানতে পারবেন এবং ড্যাশবোর্ড ব্যবহার করতে পারবেন।"
              : "Our team is reviewing your account. You will receive an email once it is approved and the dashboard unlocks."
            : bn
              ? "আপনার অ্যাকাউন্টের প্রবেশাধিকার স্থগিত করা হয়েছে। বিস্তারিত জানতে সাপোর্ট টিমে যোগাযোগ করুন।"
              : "Access to your account has been suspended. Please contact our support team for details."}
        </p>
        {user?.email && (
          <p className="mt-3 text-xs text-muted-foreground">
            {bn ? "অ্যাকাউন্ট:" : "Account:"} <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href="mailto:support@yesshost.com"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Mail className="h-4 w-4" />
            {bn ? "সাপোর্টে যোগাযোগ" : "Contact support"}
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            {bn ? "সাইন আউট" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const status = profile?.account_status;
  if (status === "pending" || status === "suspended") {
    return <AccountStatusGate status={status} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
