import { useState } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";
import SEOHead from "@/components/SEOHead";
import { logApiError } from "@/lib/errorReporting";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";
  const from = (location.state as any)?.from || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const msg = error.message.includes("Invalid login")
        ? (bn ? "ভুল ইমেইল বা পাসওয়ার্ড" : "Invalid email or password")
        : error.message.includes("Email not confirmed")
        ? (bn ? "অনুগ্রহ করে আপনার ইমেইল ভেরিফাই করুন" : "Please verify your email first")
        : error.message.includes("Too many requests")
        ? (bn ? "অনেক চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন" : "Too many attempts. Please try again later")
        : error.message;
      const entry = logApiError("auth.signInWithPassword", error, { area: "auth", status: (error as { status?: number }).status ?? null });
      toast({
        title: bn ? "লগইন ব্যর্থ" : "Login Failed",
        description: entry ? `${msg} (${entry.code})` : msg,
        variant: "destructive",
      });
    }
    else {
      const refCode = localStorage.getItem("yh_ref");
      if (refCode) {
        supabase.functions.invoke("affiliate-track", { body: { action: "claim", referral_code: refCode } })
          .then(() => localStorage.removeItem("yh_ref")).catch(() => {});
      }
      navigate(from);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <SEOHead
        title={bn ? "লগইন - Yess Host" : "Login - Yess Host"}
        description={bn ? "আপনার Yess Host অ্যাকাউন্টে লগইন করুন।" : "Sign in to your Yess Host account to manage hosting, domains and services."}
        canonical="/login"
        noindex
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-10 mx-auto mb-6" /></Link>
          <h1 className="text-2xl font-bold text-foreground">{tr("auth.welcomeBack")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tr("auth.loginSubtitle")}</p>
        </div>

        <div className="glass-card-elevated p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" className="rounded-sm border-border" />{tr("auth.rememberMe")}</label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">{tr("auth.forgotPassword")}</Link>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>{tr("auth.signIn")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tr("auth.noAccount")}{" "}<Link to="/signup" className="text-primary font-semibold hover:underline">{tr("nav.signup")}</Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />{tr("auth.backToHome")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
