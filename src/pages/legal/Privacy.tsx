import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { motion } from "framer-motion";

const Privacy = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-6 text-foreground">
              {bn ? "প্রাইভেসি পলিসি" : "Privacy Policy"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">{bn ? "সর্বশেষ আপডেট: মার্চ ২০২৬" : "Last updated: March 2026"}</p>

            <div className="space-y-6">
              {[
                { title: bn ? "১. তথ্য সংগ্রহ" : "1. Information Collection", content: bn ? "আমরা আপনার নাম, ইমেইল, ফোন নম্বর, ঠিকানা এবং পেমেন্ট তথ্য সংগ্রহ করি। এই তথ্য সেবা প্রদান ও উন্নত করতে ব্যবহৃত হয়।" : "We collect your name, email, phone number, address and payment information. This data is used to provide and improve our services." },
                { title: bn ? "২. তথ্যের ব্যবহার" : "2. Use of Information", content: bn ? "সংগৃহীত তথ্য সেবা প্রদান, বিলিং, সাপোর্ট এবং সেবার মান উন্নয়নে ব্যবহৃত হয়। আমরা আপনার অনুমতি ছাড়া তৃতীয় পক্ষের কাছে তথ্য বিক্রি করি না।" : "Collected information is used for service delivery, billing, support and service improvement. We do not sell data to third parties without consent." },
                { title: bn ? "৩. ডেটা সুরক্ষা" : "3. Data Security", content: bn ? "আমরা SSL এনক্রিপশন, ফায়ারওয়াল এবং নিরাপত্তা প্রোটোকল ব্যবহার করে আপনার ডেটা সুরক্ষিত রাখি।" : "We protect your data using SSL encryption, firewalls and security protocols." },
                { title: bn ? "৪. কুকিজ" : "4. Cookies", content: bn ? "আমাদের ওয়েবসাইট কুকিজ ব্যবহার করে ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে। আপনি ব্রাউজার সেটিংসে কুকিজ নিষ্ক্রিয় করতে পারেন।" : "Our website uses cookies to improve user experience. You can disable cookies in browser settings." },
                { title: bn ? "৫. আপনার অধিকার" : "5. Your Rights", content: bn ? "আপনার ডেটা দেখা, সংশোধন বা মুছে ফেলার অনুরোধ করতে পারেন। support@yesshost.com এ যোগাযোগ করুন।" : "You can request to view, correct or delete your data. Contact support@yesshost.com." },
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

export default Privacy;
