import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, User } from "lucide-react";

const DashboardProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [city, setCity] = useState(profile?.city || "");
  const [country, setCountry] = useState(profile?.country || "Bangladesh");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [companyWebsite, setCompanyWebsite] = useState(profile?.company_website || "");
  const [vatId, setVatId] = useState(profile?.vat_id || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        address,
        city,
        country,
        company_name: companyName,
        company_website: companyWebsite,
        vat_id: vatId,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "প্রোফাইল আপডেট হয়েছে!" });
      await refreshProfile();
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">আপনার প্রোফাইল তথ্য আপডেট করুন</p>
      </div>

      <div className="glass-card p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {(fullName || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{fullName || "User"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="পুরো নাম" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+880 1XXXXXXXXX" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="ঠিকানা" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder="শহর" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Country</label>
              <input value={country} onChange={e => setCountry(e.target.value)} className={inputClass} placeholder="দেশ" />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Company Information (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="কোম্পানির নাম" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} className={inputClass} placeholder="https://" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">VAT/Tax ID</label>
              <input value={vatId} onChange={e => setVatId(e.target.value)} className={inputClass} placeholder="VAT/Tax ID (যদি থাকে)" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardProfile;
