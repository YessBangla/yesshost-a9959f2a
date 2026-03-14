import { motion } from "framer-motion";
import { Search, BookOpen, Server, Globe, Mail, Shield, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const categories = [
  { icon: Server, titleBn: "হোস্টিং গাইড", titleEn: "Hosting Guide", articles: [
    { bn: "cPanel ব্যবহার করে ওয়েবসাইট আপলোড করুন", en: "Upload website using cPanel" },
    { bn: "FTP দিয়ে ফাইল আপলোড করুন", en: "Upload files via FTP" },
    { bn: "PHP ভার্সন পরিবর্তন করুন", en: "Change PHP version" },
    { bn: "SSL সার্টিফিকেট ইনস্টল করুন", en: "Install SSL certificate" },
  ]},
  { icon: Globe, titleBn: "ডোমেইন গাইড", titleEn: "Domain Guide", articles: [
    { bn: "ডোমেইন নেমসার্ভার পরিবর্তন করুন", en: "Change domain nameservers" },
    { bn: "ডোমেইন ট্রান্সফার করুন", en: "Transfer your domain" },
    { bn: "DNS রেকর্ড সেটআপ করুন", en: "Setup DNS records" },
  ]},
  { icon: Mail, titleBn: "ইমেইল গাইড", titleEn: "Email Guide", articles: [
    { bn: "ইমেইল অ্যাকাউন্ট তৈরি করুন", en: "Create email account" },
    { bn: "আউটলুকে ইমেইল সেটআপ করুন", en: "Setup email in Outlook" },
    { bn: "Gmail এ ইমেইল ফরওয়ার্ড করুন", en: "Forward email to Gmail" },
  ]},
  { icon: Shield, titleBn: "নিরাপত্তা", titleEn: "Security", articles: [
    { bn: "টু-ফ্যাক্টর অথেনটিকেশন চালু করুন", en: "Enable two-factor authentication" },
    { bn: "ম্যালওয়্যার স্ক্যান চালান", en: "Run malware scan" },
    { bn: "ব্যাকআপ ও রিস্টোর গাইড", en: "Backup and restore guide" },
  ]},
];

const KnowledgeBase = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [search, setSearch] = useState("");

  const filtered = categories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(a => (bn ? a.bn : a.en).toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.articles.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <section className="container mx-auto px-4 text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4"><BookOpen className="w-10 h-10 text-primary" /></div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "নলেজ বেস" : "Knowledge Base"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              {bn ? "হোস্টিং, ডোমেইন ও সার্ভার সংক্রান্ত সকল গাইড ও টিউটোরিয়াল।" : "All guides and tutorials related to hosting, domain and server."}
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={bn ? "আর্টিকেল সার্চ করুন..." : "Search articles..."}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </motion.div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {filtered.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10"><cat.icon className="w-5 h-5 text-primary" /></div>
                  <h2 className="text-lg font-bold text-foreground">{bn ? cat.titleBn : cat.titleEn}</h2>
                </div>
                <ul className="space-y-2">
                  {cat.articles.map((a, j) => (
                    <li key={j}>
                      <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5">
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        {bn ? a.bn : a.en}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <FooterSection />
    </div>
  );
};

export default KnowledgeBase;
