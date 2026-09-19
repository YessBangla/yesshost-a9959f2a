import { ArrowLeft, Eye, Monitor, Tablet, Smartphone, ExternalLink, ImageOff } from "lucide-react";
import { Link, useParams } from "@/lib/router-compat";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";

type ThemeRow = {
  name: string;
  slug: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  screenshots: unknown;
  category: string | null;
};

const DEVICES = {
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "820px", label: "Tablet", icon: Tablet },
  mobile: { width: "420px", label: "Mobile", icon: Smartphone },
} as const;

type DeviceKey = keyof typeof DEVICES;

const ThemeDemo = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [theme, setTheme] = useState<ThemeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<DeviceKey>("desktop");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("themes")
      .select("name, slug, thumbnail_url, preview_url, screenshots, category")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        setTheme((data as ThemeRow) ?? null);
        setLoading(false);
      });
  }, [slug]);

  const shots: string[] = Array.isArray(theme?.screenshots)
    ? (theme!.screenshots as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  const gallery = shots.length ? shots : theme?.thumbnail_url ? [theme.thumbnail_url] : [];

  return (
    <PublicLayout>
      <SEOHead
        title={bn ? `${theme?.name || "থিম"} — লাইভ ডেমো | Yess Host` : `${theme?.name || "Theme"} — Live Demo | Yess Host`}
        description={bn
          ? `${theme?.name || "থিম"} এর লাইভ ডেমো ডেস্কটপ, ট্যাবলেট ও মোবাইলে দেখুন।`
          : `Preview the ${theme?.name || "theme"} live demo on desktop, tablet and mobile.`}
      />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  to={slug ? `/themes/${slug}` : "/themes"}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {bn ? "থিমে ফিরে যান" : "Back to theme"}
                </Link>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
                  {theme?.name || (bn ? "থিম ডেমো" : "Theme demo")}
                </h1>
              </div>

              {theme?.preview_url && (
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-border bg-card p-1">
                    {(Object.keys(DEVICES) as DeviceKey[]).map(key => {
                      const Icon = DEVICES[key].icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDevice(key)}
                          aria-label={DEVICES[key].label}
                          className={`flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                            device === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{DEVICES[key].label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <a
                    href={theme.preview_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {bn ? "নতুন ট্যাবে" : "Open in new tab"}
                  </a>
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-[70vh] rounded-2xl border border-border bg-secondary/40 animate-pulse" />
            ) : theme?.preview_url ? (
              <div className="rounded-2xl border border-border bg-secondary/30 p-3 sm:p-4">
                <div className="mx-auto transition-all duration-300" style={{ width: DEVICES[device].width, maxWidth: "100%" }}>
                  <iframe
                    key={device}
                    src={theme.preview_url}
                    title={`${theme.name} demo`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    className="h-[70vh] w-full rounded-xl border border-border bg-background shadow-lg"
                  />
                </div>
              </div>
            ) : gallery.length ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {bn
                    ? "এই থিমের ইন্টারঅ্যাকটিভ ডেমো এখনো যুক্ত হয়নি — নিচে পূর্ণ স্ক্রিনশট প্রিভিউ দেখুন।"
                    : "An interactive demo is not connected yet — browse the full screenshot preview below."}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {gallery.map((src, i) => (
                    <div key={`${src}-${i}`} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                      <img src={src} alt={`${theme?.name || "Theme"} preview ${i + 1}`} loading="lazy" className="w-full h-auto object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <ImageOff className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {bn ? "প্রিভিউ পাওয়া যায়নি" : "Preview not available"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {bn
                    ? "এই থিমের জন্য এখনো কোনো ডেমো লিংক বা স্ক্রিনশট যুক্ত করা হয়নি।"
                    : "No demo link or screenshots have been added for this theme yet."}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to={slug ? `/themes/${slug}` : "/themes"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {bn ? "থিমের বিস্তারিত" : "Theme details"}
              </Link>
              <Link
                to="/themes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all border border-border"
              >
                <Eye className="w-4 h-4" />
                {bn ? "সকল থিম দেখুন" : "Browse themes"}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ThemeDemo;
