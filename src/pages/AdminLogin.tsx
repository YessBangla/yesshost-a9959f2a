import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import logoWhite from "@/assets/logo-white.png";
import SEOHead from "@/components/SEOHead";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const bn = lang === "bn";

  useEffect(() => {
    if (user) {
      checkRoleAndRedirect(user.id);
    }
  }, [user]);

  const checkRoleAndRedirect = async (userId: string) => {
    const [adminCheck, ccCheck] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" as any }),
      supabase.rpc("has_role", { _user_id: userId, _role: "call_center" as any }),
    ]);
    if (adminCheck.data) navigate("/admin", { replace: true });
    else if (ccCheck.data) navigate("/call-center", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      let desc = error.message;
      if (error.message.includes("Invalid login credentials")) {
        desc = bn ? "ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।" : "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        desc = bn ? "আপনার ইমেইল এখনো ভেরিফাই হয়নি। ইনবক্স চেক করুন।" : "Your email is not verified yet. Please check your inbox.";
      } else if (error.message.includes("Too many requests")) {
        desc = bn ? "অনেকবার চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "Too many attempts. Please try again later.";
      }
      toast({ title: bn ? "লগইন ব্যর্থ" : "Login Failed", description: desc, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) { setLoading(false); return; }

    const [adminCheck, ccCheck] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" as any }),
      supabase.rpc("has_role", { _user_id: userId, _role: "call_center" as any }),
    ]);

    if (adminCheck.data) {
      navigate("/admin");
    } else if (ccCheck.data) {
      navigate("/call-center");
    } else {
      await supabase.auth.signOut();
      toast({ title: bn ? "অ্যাক্সেস নেই" : "Access Denied", description: bn ? "আপনার অ্যাডমিন বা কল সেন্টার অ্যাক্সেস নেই।" : "You don't have admin or call center access.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <SEOHead title={bn ? "অ্যাডমিন লগইন - Yess Host" : "Admin Login - Yess Host"} description="Admin & Call Center login" canonical="/admin-login" noindex />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-10 mx-auto mb-6" /></Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">{bn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{bn ? "অ্যাডমিন বা কল সেন্টার আইডি দিয়ে লগইন করুন" : "Login with admin or call center credentials"}</p>
        </div>

        <div className="glass-card-elevated p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{bn ? "ইমেইল" : "Email"}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yesshost.com" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-destructive/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{bn ? "পাসওয়ার্ড" : "Password"}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-destructive/30 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-destructive hover:underline">{bn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot Password?"}</Link>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-destructive/20 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" /> : <>{bn ? "লগইন করুন" : "Sign In"} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />{bn ? "হোমে ফিরে যান" : "Back to Home"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
