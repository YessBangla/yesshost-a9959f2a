import { motion } from "framer-motion";
import { Shield, Users, Globe, Server, Award, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

const iconMap: Record<string, typeof Shield> = { Shield, Users, Globe, Server, Award, Clock };

const About = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "about").eq("is_active", true).order("sort_order")
      .then(({ data }) => setContent(data || []));
  }, []);

  const get = (key: string) => content.find(c => c.section_key === key);

  const hero = get("hero");
  const title = hero ? (bn ? hero.title_bn : hero.title_en) : (bn ? "Yess Host — আপনার বিশ্বস্ত হোস্টিং পার্টনার" : "Yess Host — Your Trusted Hosting Partner");
  const desc = hero ? (bn ? hero.content_bn : hero.content_en) : (bn ? "২০১৫ সাল থেকে বাংলাদেশে প্রিমিয়াম কোয়ালিটি ওয়েব হোস্টিং, ডোমেইন রেজিস্ট্রেশন ও ক্লাউড সার্ভিস প্রদান করে আসছি।" : "Since 2015, we have been providing premium quality web hosting, domain registration and cloud services in Bangladesh.");

  const stats = useMemo(() => {
    const item = get("stats");
    if (item?.metadata?.stats) return item.metadata.stats.map((s: any) => ({ value: s.value, label: bn ? s.label_bn : s.label_en }));
    return [
      { value: "5,000+", label: bn ? "সক্রিয় ক্লায়েন্ট" : "Active Clients" },
      { value: "99.9%", label: bn ? "আপটাইম গ্যারান্টি" : "Uptime Guarantee" },
      { value: "24/7", label: bn ? "সাপোর্ট সার্ভিস" : "Support Service" },
      { value: "10+", label: bn ? "বছরের অভিজ্ঞতা" : "Years Experience" },
    ];
  }, [content, bn]);

  const values = useMemo(() => {
    const item = get("values");
    if (item?.metadata?.values) return item.metadata.values.map((v: any) => ({
      icon: iconMap[v.icon] || Shield, title: bn ? v.title_bn : v.title_en, desc: bn ? v.desc_bn : v.desc_en,
    }));
    return [
      { icon: Shield, title: bn ? "নিরাপত্তা" : "Security", desc: bn ? "আমরা আপনার ডেটার সুরক্ষা সর্বোচ্চ গুরুত্ব দিই।" : "We prioritize the security of your data above all." },
      { icon: Clock, title: bn ? "নির্ভরযোগ্যতা" : "Reliability", desc: bn ? "৯৯.৯% আপটাইম গ্যারান্টি সহ সেবা প্রদান করি।" : "We deliver services with 99.9% uptime guarantee." },
      { icon: Users, title: bn ? "গ্রাহক সেবা" : "Customer Service", desc: bn ? "২৪/৭ বাংলা ও ইংরেজি ভাষায় সাপোর্ট।" : "24/7 support in both Bengali and English." },
      { icon: Globe, title: bn ? "গ্লোবাল নেটওয়ার্ক" : "Global Network", desc: bn ? "USA, সিঙ্গাপুর ও বাংলাদেশে সার্ভার লোকেশন।" : "Server locations in USA, Singapore and Bangladesh." },
      { icon: Server, title: bn ? "আধুনিক প্রযুক্তি" : "Modern Technology", desc: bn ? "NVMe SSD, LiteSpeed ও সর্বশেষ প্রযুক্তি ব্যবহার।" : "Using NVMe SSD, LiteSpeed and latest technology." },
      { icon: Award, title: bn ? "মানসম্মত সেবা" : "Quality Service", desc: bn ? "আন্তর্জাতিক মানের হোস্টিং সেবা প্রদান।" : "Providing international standard hosting services." },
    ];
  }, [content, bn]);

  return (
    <PublicLayout>
      <SEOHead title="About Us - Yess Host" description="Learn about Yess Host, Bangladesh's trusted cloud hosting provider with 99.9% uptime, 24/7 support, and 10+ years of experience." canonical="/about" />
      <div className="pt-20 lg:pt-24 pb-16">
        <section className="container mx-auto px-4 text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              {bn ? "আমাদের সম্পর্কে" : "About Us"}
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">{title}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{desc}</p>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center">
                <p className="text-3xl font-extrabold text-primary mb-1">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">{bn ? "আমাদের মূল্যবোধ" : "Our Values"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {values.map((v: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4"><v.icon className="w-6 h-6 text-primary" /></div>
                <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default About;
