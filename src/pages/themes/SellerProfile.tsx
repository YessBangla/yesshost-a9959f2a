import { useEffect, useState } from "react";
import { Store, Globe as GlobeIcon } from "lucide-react";
import { useParams, Link } from "@/lib/router-compat";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";

type Profile = {
  user_id: string;
  display_name: string;
  slug: string;
  logo_url: string | null;
  bio_bn: string | null;
  bio_en: string | null;
  website: string | null;
};

type ThemeRow = { id: string; name: string; slug: string; thumbnail_url: string | null; price_bdt: number; discount_price_bdt: number | null };

const SellerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("theme_seller_profiles")
        .select("user_id,display_name,slug,logo_url,bio_bn,bio_en,website")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      setProfile(data ?? null);
      if (data) {
        const { data: rows } = await supabase
          .from("themes")
          .select("id,name,slug,thumbnail_url,price_bdt,discount_price_bdt")
          .eq("seller_user_id", data.user_id)
          .eq("is_active", true)
          .eq("approval_status", "approved")
          .order("created_at", { ascending: false });
        setThemes((rows ?? []) as ThemeRow[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  return (
    <PublicLayout>
      <SEOHead
        title={profile ? `${profile.display_name} — Theme Seller | Yess Host` : "Theme Seller | Yess Host"}
        description={profile ? (bn ? profile.bio_bn : profile.bio_en) || `${profile.display_name} themes on Yess Host` : "Yess Host theme seller profile"}
        canonical={`/sellers/${slug}`}
      />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-5xl">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-secondary/50 rounded-2xl" />
            <div className="grid sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-48 bg-secondary/50 rounded-2xl" />)}
            </div>
          </div>
        ) : !profile ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{bn ? "সেলার পাওয়া যায়নি" : "Seller not found"}</p>
            <Link to="/themes" className="text-primary hover:underline mt-3 inline-block">{bn ? "সকল থিম" : "All themes"}</Link>
          </div>
        ) : (
          <>
            <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.display_name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center"><Store className="w-7 h-7 text-primary" /></div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-foreground">{profile.display_name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{(bn ? profile.bio_bn : profile.bio_en) || (bn ? "Yess Host থিম সেলার" : "Yess Host theme seller")}</p>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <GlobeIcon className="w-4 h-4" /> {profile.website}
                  </a>
                )}
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary">{formatAmount(themes.length, lang)}</p>
                <p className="text-xs text-muted-foreground">{bn ? "প্রকাশিত থিম" : "Published themes"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              {themes.map((t) => (
                <Link key={t.id} to={`/themes/${t.slug}`} className="glass-card overflow-hidden hover:shadow-lg transition-all">
                  {t.thumbnail_url && <img src={t.thumbnail_url} alt={t.name} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-primary font-extrabold mt-1">৳{formatAmount(Number(t.discount_price_bdt || t.price_bdt), lang)}</p>
                  </div>
                </Link>
              ))}
              {themes.length === 0 && (
                <p className="text-sm text-muted-foreground">{bn ? "এই সেলারের কোনো প্রকাশিত থিম নেই।" : "This seller has no published themes yet."}</p>
              )}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
};

export default SellerProfile;
