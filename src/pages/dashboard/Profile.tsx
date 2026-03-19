import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Camera, User, Mail, Phone, MapPin, Building2, Globe, FileText } from "lucide-react";

const DashboardProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { tr, lang } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [vatId, setVatId] = useState("");

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

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

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
      toast({ title: "✅ " + (lang === "bn" ? "সফল!" : "Saved!"), description: tr("dash.profileUpdated") || (lang === "bn" ? "প্রোফাইল আপডেট হয়েছে" : "Profile updated successfully") });
      await refreshProfile();
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
    : "";

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
          {/* Avatar */}
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              {avatarLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-foreground">{fullName || "User"}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 justify-center sm:justify-start">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </span>
              {phone && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {phone}
                </span>
              )}
            </div>
            {memberSince && (
              <p className="text-xs text-muted-foreground mt-2">
                {tr("dash.memberSince")}: {memberSince}
              </p>
            )}
          </div>

          {/* Client ID Badge */}
          <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{tr("dash.clientId")}</p>
            <p className="text-sm font-mono font-bold text-primary mt-0.5">{user?.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Info */}
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

        {/* Address */}
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

        {/* Company Info */}
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

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {tr("dash.saveChanges")}
        </button>
      </form>
    </div>
  );
};

export default DashboardProfile;
