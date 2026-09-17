import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";
import SEOHead from "@/components/SEOHead";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tr, lang } = useLanguage();
  const bn = lang === "bn";

  // Capture affiliate referral code: track the click and remember it for signup attribution
  useEffect(() => {
    const refCode = new URLSearchParams(location.search).get("ref");
    if (!refCode) return;
    localStorage.setItem("yh_ref", refCode);
    supabase.functions.invoke("affiliate-track", { body: { action: "click", referral_code: refCode, source_page: "/signup" } }).catch(() => {});
  }, [location.search]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "Error", description: tr("auth.passwordMinError"), variant: "destructive" }); return; }
    setLoading(true);

    // Check duplicate phone
    if (phone.trim()) {
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phone.trim())
        .maybeSingle();
      if (existingPhone) {
        toast({ title: bn ? "ত্রুটি" : "Error", description: bn ? "এই ফোন নাম্বার দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে" : "An account with this phone number already exists", variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone: phone.trim() }, emailRedirectTo: window.location.origin } });
    if (error) {
      const msg = error.message.includes("already registered")
        ? (bn ? "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট আছে" : "An account with this email already exists")
        : error.message;
      toast({ title: bn ? "সাইনআপ ব্যর্থ" : "Signup Failed", description: msg, variant: "destructive" });
    }
    else { toast({ title: "Success!", description: tr("auth.accountCreated") }); navigate("/login"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4 py-12">
      <SEOHead
        title={bn ? "অ্যাকাউন্ট তৈরি করুন - Yess Host" : "Create Account - Yess Host"}
        description={bn ? "Yess Host-এ ফ্রি অ্যাকাউন্ট তৈরি করুন এবং হোস্টিং, ডোমেইন ও আরো অনেক সেবা পান।" : "Create a free Yess Host account and get access to hosting, domains and more services."}
        canonical="/signup"
        noindex
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-10 mx-auto mb-6" /></Link>
          <h1 className="text-2xl font-bold text-foreground">{tr("auth.createAccount")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tr("auth.createAccountSubtitle")}</p>
        </div>

        <div className="glass-card-elevated p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.fullName")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={tr("auth.fullNamePlaceholder")} required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.phone")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tr("auth.passwordMin")} required className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} lang={lang} />
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {bn ? "আপনার তথ্য সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড" : "Your data is fully secure and encrypted"}
            </p>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>{tr("auth.createAccount")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tr("auth.hasAccount")}{" "}<Link to="/login" className="text-primary font-semibold hover:underline">{tr("auth.signIn")}</Link>
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

export default Signup;
