import { motion } from "framer-motion";
import { DollarSign, Users, Share2, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const Affiliate = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const steps = [
    { icon: Users, title: bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account", desc: bn ? "ফ্রি অ্যাফিলিয়েট অ্যাকাউন্ট খুলুন।" : "Open a free affiliate account." },
    { icon: Share2, title: bn ? "শেয়ার করুন" : "Share", desc: bn ? "আপনার রেফারেল লিংক শেয়ার করুন।" : "Share your referral link." },
    { icon: DollarSign, title: bn ? "কমিশন পান" : "Earn Commission", desc: bn ? "প্রতিটি সেলে ১৫% কমিশন পান।" : "Get 15% commission on every sale." },
  ];

  const benefits = [
    { title: bn ? "১৫% কমিশন" : "15% Commission", desc: bn ? "প্রতিটি সফল রেফারেলে ১৫% কমিশন।" : "15% commission on every successful referral." },
    { title: bn ? "রিকারিং ইনকাম" : "Recurring Income", desc: bn ? "ক্লায়েন্ট রিনিউ করলে আপনিও পাবেন।" : "You earn when clients renew too." },
    { title: bn ? "তাৎক্ষণিক পেমেন্ট" : "Instant Payment", desc: bn ? "বিকাশ, নগদ বা ব্যাংকে পেমেন্ট।" : "Payment via bKash, Nagad or bank." },
    { title: bn ? "মার্কেটিং ম্যাটেরিয়াল" : "Marketing Materials", desc: bn ? "ব্যানার, লিংক ও প্রোমো কোড।" : "Banners, links and promo codes." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <section className="container mx-auto px-4 text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              {bn ? "অ্যাফিলিয়েট প্রোগ্রাম" : "Affiliate Program"}
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "রেফার করুন, আয় করুন" : "Refer & Earn"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {bn ? "YessHost অ্যাফিলিয়েট প্রোগ্রামে যোগ দিন এবং প্রতিটি রেফারেলে ১৫% কমিশন পান।" : "Join YessHost affiliate program and earn 15% commission on every referral."}
            </p>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary mb-2">{bn ? `ধাপ ${i + 1}` : `Step ${i + 1}`}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">{bn ? "সুবিধাসমূহ" : "Benefits"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card p-5 flex items-start gap-3">
                <Award className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground text-sm">{b.title}</h3>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 text-center">
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            {bn ? "এখনই যোগ দিন" : "Join Now"} <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
      <FooterSection />
    </div>
  );
};

export default Affiliate;
