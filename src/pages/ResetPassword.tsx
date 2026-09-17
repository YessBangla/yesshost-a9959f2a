import { useState, useEffect } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";
import SEOHead from "@/components/SEOHead";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: bn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: bn ? "পাসওয়ার্ড মিলছে না" : "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: bn ? "ত্রুটি" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: bn ? "সফল!" : "Success!", description: bn ? "পাসওয়ার্ড আপডেট হয়েছে!" : "Password updated successfully!" });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <SEOHead
        title={bn ? "নতুন পাসওয়ার্ড সেট করুন - Yess Host" : "Set New Password - Yess Host"}
        description={bn ? "আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড সেট করুন।" : "Set a new password for your Yess Host account."}
        noindex
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-10 mx-auto mb-6" /></Link>
          <h1 className="text-2xl font-bold text-foreground">{bn ? "নতুন পাসওয়ার্ড সেট করুন" : "Set New Password"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bn ? "আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী পাসওয়ার্ড দিন" : "Choose a strong password for your account"}</p>
        </div>
        <div className="glass-card-elevated p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{bn ? "নতুন পাসওয়ার্ড" : "New Password"}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={bn ? "কমপক্ষে ৬ অক্ষর" : "At least 6 characters"}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{bn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={bn ? "পাসওয়ার্ড পুনরায় লিখুন" : "Re-enter password"}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? (bn ? "আপডেট হচ্ছে..." : "Updating...") : (bn ? "পাসওয়ার্ড আপডেট করুন" : "Update Password")}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />{bn ? "লগইনে ফিরে যান" : "Back to Login"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
