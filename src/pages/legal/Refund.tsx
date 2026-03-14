import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { motion } from "framer-motion";

const Refund = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-6 text-foreground">
              {bn ? "রিফান্ড পলিসি" : "Refund Policy"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">{bn ? "সর্বশেষ আপডেট: মার্চ ২০২৬" : "Last updated: March 2026"}</p>

            <div className="space-y-6">
              {[
                { title: bn ? "৩০ দিনের মানি-ব্যাক গ্যারান্টি" : "30-Day Money-Back Guarantee", content: bn ? "শেয়ার্ড হোস্টিং, রিসেলার হোস্টিং এবং ইমেইল হোস্টিং প্ল্যানের জন্য ৩০ দিনের মানি-ব্যাক গ্যারান্টি প্রযোজ্য। আপনি ৩০ দিনের মধ্যে সন্তুষ্ট না হলে পূর্ণ রিফান্ড পাবেন।" : "30-day money-back guarantee applies to shared hosting, reseller hosting and email hosting plans. Full refund if not satisfied within 30 days." },
                { title: bn ? "রিফান্ড প্রক্রিয়া" : "Refund Process", content: bn ? "রিফান্ডের জন্য সাপোর্ট টিকেট খুলুন বা support@yesshost.com এ ইমেইল করুন। রিফান্ড ৫-৭ কার্যদিবসের মধ্যে প্রসেস হবে।" : "Open a support ticket or email support@yesshost.com for refund. Refund will be processed within 5-7 business days." },
                { title: bn ? "রিফান্ড প্রযোজ্য নয়" : "Non-Refundable", content: bn ? "ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার, ডেডিকেটেড সার্ভার, SSL সার্টিফিকেট এবং গ্রাফিক্স ডিজাইন সেবায় রিফান্ড প্রযোজ্য নয়।" : "Domain registration, VPS servers, dedicated servers, SSL certificates and graphics design services are non-refundable." },
                { title: bn ? "পেমেন্ট মেথড" : "Payment Method", content: bn ? "রিফান্ড মূল পেমেন্ট মেথডে ফেরত দেওয়া হবে (বিকাশ, নগদ, রকেট বা ব্যাংক)।" : "Refunds will be returned to the original payment method (bKash, Nagad, Rocket or bank)." },
              ].map((s, i) => (
                <div key={i} className="glass-card p-5">
                  <h2 className="text-lg font-bold text-foreground mb-2">{s.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default Refund;
