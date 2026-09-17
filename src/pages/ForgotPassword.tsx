import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { tr } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setSent(true); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-10 mx-auto mb-6" /></Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {tr("auth.backToHome")}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{tr("auth.resetPassword")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tr("auth.resetSubtitle")}</p>
        </div>

        <div className="glass-card-elevated p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-success" /></div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tr("auth.emailSent")}</h3>
              <p className="text-sm text-muted-foreground">{email} {tr("auth.resetLinkSent")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{tr("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                {loading ? tr("auth.sending") : tr("auth.sendResetLink")}
              </button>
            </form>
          )}
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> {tr("auth.backToLogin")}
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
