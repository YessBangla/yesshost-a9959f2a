import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Camera, User, Mail, Phone, MapPin, Building2, Globe, FileText,
  KeyRound, Bell, Eye, EyeOff, ShieldCheck
} from "lucide-react";

const DashboardProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { tr, lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [vatId, setVatId] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Notification settings
  const [notifOrder, setNotifOrder] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifTicket, setNotifTicket] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [notifService, setNotifService] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setCity(profile.city || "");
      setCountry(profile.country || "Bangladesh");
      setCompanyName(profile.company_name || "");
      setCompanyWebsite(profile.company_website || "");
      setVatId(profile.vat_id || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: tr("dash.avatarTooLarge"), variant: "destructive" });
      return;
    }
    setAvatarLoading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setAvatarLoading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    await refreshProfile();
    toast({ title: tr("dash.avatarUpdated") });
    setAvatarLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone, address, city, country,
      company_name: companyName, company_website: companyWebsite, vat_id: vatId
    }).eq("user_id", user.id);
    if (error) {
      toast({ title: "❌", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ " + (bn ? "সফল!" : "Saved!"), description: tr("dash.profileUpdated") || (bn ? "প্রোফাইল আপডেট হয়েছে" : "Profile updated successfully") });
      await refreshProfile();
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      toast({ title: bn ? "পাসওয়ার্ড ত্রুটি" : "Password Error", description: bn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।" : "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: bn ? "পাসওয়ার্ড মিলছে না" : "Passwords don't match", description: bn ? "নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড একই হতে হবে।" : "New password and confirm password must match.", variant: "destructive" });
      return;
    }

    setPwLoading(true);

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      toast({ title: bn ? "বর্তমান পাসওয়ার্ড ভুল" : "Current password is incorrect", description: bn ? "সঠিক বর্তমান পাসওয়ার্ড দিন।" : "Please enter your correct current password.", variant: "destructive" });
      setPwLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "❌", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅", description: bn ? "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!" : "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPwLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 transition-all text-sm";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(bn ? "bn-BD" : "en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </label>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{tr("dash.profileTitle")}</h1>
        <p className="text-sm text-muted-foreground">{tr("dash.profileSubtitle")}</p>
      </div>

      {/* Avatar & Identity Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                  {(fullName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform">
              {avatarLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-foreground">{fullName || "User"}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 justify-center sm:justify-start">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
              {phone && <span className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {phone}</span>}
            </div>
            {memberSince && <p className="text-xs text-muted-foreground mt-2">{tr("dash.memberSince")}: {memberSince}</p>}
          </div>
          <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{tr("dash.clientId")}</p>
            <p className="text-sm font-mono font-bold text-primary mt-0.5">{user?.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> {tr("dash.personalInfo")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.fullName")}</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder={tr("dash.fullName")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.phone")}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+880 1XXXXXXXXX" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> {tr("dash.addressInfo")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.address")}</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder={tr("dash.address")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.city")}</label>
                <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder={tr("dash.city")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.country")}</label>
                <input value={country} onChange={e => setCountry(e.target.value)} className={inputClass} placeholder={tr("dash.country")} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> {tr("dash.companyInfo")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.companyName")}</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder={tr("dash.companyName")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.website")}</label>
              <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} className={inputClass} placeholder="https://" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">{tr("dash.vatId")}</label>
            <input value={vatId} onChange={e => setVatId(e.target.value)} className={inputClass} placeholder={tr("dash.vatId")} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {tr("dash.saveChanges")}
        </button>
      </form>

      {/* Password Change Section */}
      <form onSubmit={handlePasswordChange} className="glass-card p-6">
        <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> {bn ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}
        </h3>
        <p className="text-xs text-muted-foreground mb-5">{bn ? "আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন।" : "Update your account password."}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{bn ? "বর্তমান পাসওয়ার্ড" : "Current Password"}</label>
            <div className="relative">
              <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className={inputClass + " pr-12"} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{bn ? "নতুন পাসওয়ার্ড" : "New Password"}</label>
              <div className="relative">
                <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className={inputClass + " pr-12"} placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{bn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}</label>
              <div className="relative">
                <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={inputClass + " pr-12"} placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {newPassword && (
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? "text-green-500" : "text-muted-foreground"}`} />
              <span className={newPassword.length >= 6 ? "text-green-500" : "text-muted-foreground"}>
                {bn ? "কমপক্ষে ৬ অক্ষর" : "At least 6 characters"}
              </span>
              {confirmPassword && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className={newPassword === confirmPassword ? "text-green-500" : "text-destructive"}>
                    {newPassword === confirmPassword ? (bn ? "পাসওয়ার্ড মিলেছে ✓" : "Passwords match ✓") : (bn ? "পাসওয়ার্ড মিলছে না" : "Passwords don't match")}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
          className="mt-5 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
          {pwLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {bn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Update Password"}
        </button>
      </form>

      {/* Notification Settings Section */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> {bn ? "নোটিফিকেশন সেটিংস" : "Notification Settings"}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{bn ? "কোন ধরনের নোটিফিকেশন পেতে চান তা নির্বাচন করুন।" : "Choose which notifications you want to receive."}</p>

        <div className="divide-y divide-border/40">
          <ToggleSwitch checked={notifOrder} onChange={setNotifOrder} label={bn ? "📦 অর্ডার আপডেট" : "📦 Order Updates"} />
          <ToggleSwitch checked={notifPayment} onChange={setNotifPayment} label={bn ? "💳 পেমেন্ট ও বিলিং" : "💳 Payment & Billing"} />
          <ToggleSwitch checked={notifTicket} onChange={setNotifTicket} label={bn ? "🎫 সাপোর্ট টিকেট" : "🎫 Support Tickets"} />
          <ToggleSwitch checked={notifService} onChange={setNotifService} label={bn ? "🖥️ সার্ভিস স্ট্যাটাস" : "🖥️ Service Status"} />
          <ToggleSwitch checked={notifPromo} onChange={setNotifPromo} label={bn ? "🎁 অফার ও প্রমোশন" : "🎁 Offers & Promotions"} />
        </div>

        <p className="text-[11px] text-muted-foreground mt-4">
          {bn ? "* নোটিফিকেশন সেটিংস আপনার ব্রাউজারে সেভ থাকবে।" : "* Notification settings are saved in your browser."}
        </p>
      </div>
    </div>
  );
};

export default DashboardProfile;
