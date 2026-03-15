import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tr } = useLanguage();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "Error", description: tr("auth.passwordMinError"), variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone }, emailRedirectTo: window.location.origin } });
    if (error) { toast({ title: "Signup Failed", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success!", description: tr("auth.accountCreated") }); navigate("/login"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src={logoWhite} alt="YessHost" className="h-10 mx-auto mb-6" /></Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            হোমে ফিরে যান
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{tr("auth.createAccount")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tr("auth.createAccountSubtitle")}</p>
        </div>

        <div className="glass-card-elevated p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.fullName")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={tr("auth.fullNamePlaceholder")} required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.phone")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tr("auth.passwordMin")} required className="w-full pl-10 pr-12 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>{tr("auth.createAccount")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tr("auth.hasAccount")}{" "}<Link to="/login" className="text-primary font-semibold hover:underline">{tr("auth.signIn")}</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
