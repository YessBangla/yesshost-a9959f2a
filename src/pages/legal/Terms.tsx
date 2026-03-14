import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { motion } from "framer-motion";

const Terms = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-6 text-foreground">
              {bn ? "সেবার শর্তাবলী" : "Terms of Service"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">{bn ? "সর্বশেষ আপডেট: মার্চ ২০২৬" : "Last updated: March 2026"}</p>

            <div className="prose prose-sm max-w-none space-y-6">
              {[
                { title: bn ? "১. সেবার বিবরণ" : "1. Service Description", content: bn ? "YessHost ওয়েব হোস্টিং, ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার, ডেডিকেটেড সার্ভার এবং সংশ্লিষ্ট সেবা প্রদান করে। আমাদের সেবা ব্যবহার করে আপনি এই শর্তাবলী মেনে নিচ্ছেন।" : "YessHost provides web hosting, domain registration, VPS servers, dedicated servers and related services. By using our services, you agree to these terms." },
                { title: bn ? "২. অ্যাকাউন্ট দায়িত্ব" : "2. Account Responsibility", content: bn ? "আপনি আপনার অ্যাকাউন্টের নিরাপত্তার জন্য দায়ী। আপনার অ্যাকাউন্টের মাধ্যমে সংঘটিত সকল কার্যকলাপের দায়িত্ব আপনার। পাসওয়ার্ড শেয়ার করবেন না।" : "You are responsible for your account security. All activities through your account are your responsibility. Do not share passwords." },
                { title: bn ? "৩. পেমেন্ট পলিসি" : "3. Payment Policy", content: bn ? "সকল পেমেন্ট বাংলাদেশি টাকায় (BDT) প্রদান করতে হবে। সেবা নবায়নের জন্য সময়মতো পেমেন্ট করুন। পেমেন্ট না করলে সেবা সাসপেন্ড হতে পারে।" : "All payments must be made in Bangladeshi Taka (BDT). Pay on time for service renewal. Service may be suspended for non-payment." },
                { title: bn ? "৪. গ্রহণযোগ্য ব্যবহার" : "4. Acceptable Use", content: bn ? "অবৈধ কন্টেন্ট, স্প্যাম, ম্যালওয়্যার বিতরণ বা অন্য ব্যবহারকারীদের ক্ষতি করে এমন কোনো কার্যকলাপ নিষিদ্ধ। লঙ্ঘন হলে অ্যাকাউন্ট সাসপেন্ড করা হবে।" : "Illegal content, spam, malware distribution or activities harmful to other users are prohibited. Violations will result in account suspension." },
                { title: bn ? "৫. আপটাইম গ্যারান্টি" : "5. Uptime Guarantee", content: bn ? "আমরা ৯৯.৯% আপটাইম গ্যারান্টি দিই। প্রাকৃতিক দুর্যোগ, নির্ধারিত রক্ষণাবেক্ষণ বা তৃতীয় পক্ষের সমস্যা এর আওতায় পড়বে না।" : "We guarantee 99.9% uptime. Natural disasters, scheduled maintenance or third-party issues are excluded." },
                { title: bn ? "৬. ডেটা ব্যাকআপ" : "6. Data Backup", content: bn ? "আমরা নিয়মিত ব্যাকআপ রাখি, তবে আপনার নিজের ডেটার ব্যাকআপ রাখার দায়িত্ব আপনার। ডেটা হারানোর জন্য YessHost দায়ী নয়।" : "We maintain regular backups, but you are responsible for your own data backups. YessHost is not liable for data loss." },
                { title: bn ? "৭. যোগাযোগ" : "7. Contact", content: bn ? "এই শর্তাবলী সম্পর্কে যেকোনো প্রশ্নের জন্য support@yesshost.com এ যোগাযোগ করুন।" : "Contact support@yesshost.com for any questions about these terms." },
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

export default Terms;
