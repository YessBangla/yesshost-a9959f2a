import { motion } from "framer-motion";
import { DollarSign, Users, Share2, Award, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

const iconMap: Record<string, any> = { DollarSign, Users, Share2, Award };

const defaultSteps = [
  { icon: "Users", title_bn: "অ্যাকাউন্ট তৈরি করুন", title_en: "Create Account", desc_bn: "ফ্রি অ্যাফিলিয়েট অ্যাকাউন্ট খুলুন।", desc_en: "Open a free affiliate account." },
  { icon: "Share2", title_bn: "শেয়ার করুন", title_en: "Share", desc_bn: "আপনার রেফারেল লিংক শেয়ার করুন।", desc_en: "Share your referral link." },
  { icon: "DollarSign", title_bn: "কমিশন পান", title_en: "Earn Commission", desc_bn: "প্রতিটি সেলে ১৫% কমিশন পান।", desc_en: "Get 15% commission on every sale." },
];

const defaultBenefits = [
  { title_bn: "১৫% কমিশন", title_en: "15% Commission", desc_bn: "প্রতিটি সফল রেফারেলে ১৫% কমিশন।", desc_en: "15% commission on every successful referral." },
  { title_bn: "রিকারিং ইনকাম", title_en: "Recurring Income", desc_bn: "ক্লায়েন্ট রিনিউ করলে আপনিও পাবেন।", desc_en: "You earn when clients renew too." },
  { title_bn: "তাৎক্ষণিক পেমেন্ট", title_en: "Instant Payment", desc_bn: "বিকাশ, নগদ বা ব্যাংকে পেমেন্ট।", desc_en: "Payment via bKash, Nagad or bank." },
  { title_bn: "মার্কেটিং ম্যাটেরিয়াল", title_en: "Marketing Materials", desc_bn: "ব্যানার, লিংক ও প্রোমো কোড।", desc_en: "Banners, links and promo codes." },
];

const Affiliate = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const bn = lang === "bn";
  const [siteContent, setSiteContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "affiliate").eq("is_active", true).order("sort_order")
      .then(({ data }) => setSiteContent(data || []));
  }, []);

  const get = (key: string) => siteContent.find(c => c.section_key === key);

  const hero = get("hero");
  const title = hero ? (bn ? hero.title_bn : hero.title_en) : (bn ? "রেফার করুন, আয় করুন" : "Refer & Earn");
  const subtitle = hero ? (bn ? hero.content_bn : hero.content_en) : (bn ? "Yess Host অ্যাফিলিয়েট প্রোগ্রামে যোগ দিন এবং প্রতিটি রেফারেলে ১৫% কমিশন পান।" : "Join Yess Host affiliate program and earn 15% commission on every referral.");
  const badge = hero?.metadata?.badge_bn ? (bn ? hero.metadata.badge_bn : hero.metadata.badge_en) : (bn ? "অ্যাফিলিয়েট প্রোগ্রাম" : "Affiliate Program");

  const steps = useMemo(() => {
    const item = get("steps");
    return item?.metadata?.steps || defaultSteps;
  }, [siteContent]);

  const benefits = useMemo(() => {
    const item = get("benefits");
    return item?.metadata?.benefits || defaultBenefits;
  }, [siteContent]);

  return (
    <PublicLayout>
      <SEOHead title="Affiliate Program - Yess Host" description="Join Yess Host affiliate program and earn 15% commission on every sale. Free to join, easy to share." canonical="/affiliate" />
      <div className="pt-20 lg:pt-24 pb-16">
        <section className="container mx-auto px-4 text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              {badge}
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">{title}</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{subtitle}</p>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((s: any, i: number) => {
              const Icon = iconMap[s.icon] || Users;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">{bn ? `ধাপ ${i + 1}` : `Step ${i + 1}`}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{bn ? s.title_bn : s.title_en}</h3>
                  <p className="text-sm text-muted-foreground">{bn ? s.desc_bn : s.desc_en}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="container mx-auto px-4 mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">{bn ? "সুবিধাসমূহ" : "Benefits"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((b: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card p-5 flex items-start gap-3">
                <Award className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground text-sm">{bn ? b.title_bn : b.title_en}</h3>
                  <p className="text-xs text-muted-foreground">{bn ? b.desc_bn : b.desc_en}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 text-center">
          {user ? (
            <Link to="/dashboard/affiliate" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
              {bn ? "অ্যাফিলিয়েট ড্যাশবোর্ডে যান" : "Go to Affiliate Dashboard"} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
              {bn ? "এখনই যোগ দিন" : "Join Now"} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </section>
      </div>
    </PublicLayout>
  );
};

export default Affiliate;
