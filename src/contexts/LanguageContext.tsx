import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "bn" | "en";

type Translations = Record<string, Record<Lang, string>>;

const t: Translations = {
  // === Navbar ===
  "nav.domain": { bn: "ডোমেইন", en: "Domain" },
  "nav.webHosting": { bn: "ওয়েব হোস্টিং", en: "Web Hosting" },
  "nav.basicHosting": { bn: "বেসিক ওয়েব হোস্টিং", en: "Basic Web Hosting" },
  "nav.proHosting": { bn: "প্রো ওয়েব হোস্টিং", en: "Pro Web Hosting" },
  "nav.premiumHosting": { bn: "প্রিমিয়াম হোস্টিং", en: "Premium Hosting" },
  "nav.bdixHosting": { bn: "বিডিআইএক্স হোস্টিং", en: "BDIX Hosting" },
  "nav.reseller": { bn: "রিসেলার", en: "Reseller" },
  "nav.linuxReseller": { bn: "লিনাক্স রিসেলার", en: "Linux Reseller" },
  "nav.bdixReseller": { bn: "বিডিআইএক্স রিসেলার", en: "BDIX Reseller" },
  "nav.vps": { bn: "ভিপিএস", en: "VPS" },
  "nav.usaVps": { bn: "USA VPS", en: "USA VPS" },
  "nav.bdixVps": { bn: "BDIX VPS", en: "BDIX VPS" },
  "nav.dedicated": { bn: "ডেডিকেটেড", en: "Dedicated" },
  "nav.services": { bn: "সার্ভিসেস", en: "Services" },
  "nav.emailHosting": { bn: "ইমেইল হোস্টিং", en: "Email Hosting" },
  "nav.radioHosting": { bn: "রেডিও হোস্টিং", en: "Radio Hosting" },
  "nav.graphicsDesign": { bn: "গ্রাফিক্স ডিজাইন", en: "Graphics Design" },
  "nav.about": { bn: "আমাদের সম্পর্কে", en: "About" },
  "nav.contact": { bn: "যোগাযোগ", en: "Contact" },
  "nav.login": { bn: "লগইন", en: "Login" },
  "nav.signup": { bn: "সাইন আপ", en: "Sign Up" },
  "nav.dashboard": { bn: "ড্যাশবোর্ড", en: "Dashboard" },

  // === Hero ===
  "hero.offer": { bn: "⭐ .TOP ডোমেইন মাত্র ১৮০ টাকা! .COM ডোমেইন ৯৯০ টাকা", en: "⭐ .TOP Domain only ৳180! .COM Domain ৳990" },
  "hero.title1": { bn: "পারফেক্ট ডোমেইন", en: "Perfect Domain" },
  "hero.title2": { bn: "প্রিমিয়াম কোয়ালিটি", en: "Premium Quality" },
  "hero.subtitle": { bn: "ফ্রি DNS ম্যানেজমেন্ট • ফুল ডোমেইন কন্ট্রোল প্যানেল • ডোমেইন প্রাইভেসি প্রোটেকশন", en: "Free DNS Management • Full Domain Control Panel • Domain Privacy Protection" },
  "hero.placeholder": { bn: "আপনার ডোমেইন নাম লিখুন..", en: "Enter domain name here.." },
  "hero.register": { bn: "রেজিস্টার", en: "Register" },
  "hero.activeWebsites": { bn: "সক্রিয় ওয়েবসাইট", en: "Active Websites" },
  "hero.uptimeGuarantee": { bn: "আপটাইম গ্যারান্টি", en: "Uptime Guarantee" },
  "hero.webServer": { bn: "ওয়েব সার্ভার", en: "Web Server" },
  "hero.expertSupport": { bn: "এক্সপার্ট সাপোর্ট", en: "Expert Support" },

  // === Pricing ===
  "pricing.title": { bn: "আপনার পারফেক্ট প্ল্যান বেছে নিন", en: "Select Your Perfect Plan" },
  "pricing.subtitle": { bn: "ট্রান্সপারেন্ট প্রাইসিং, কোনো হিডেন ফি নেই। যেকোনো সময় আপগ্রেড বা ডাউনগ্রেড করুন।", en: "Transparent pricing, no hidden fees. Upgrade or downgrade anytime." },
  "pricing.webHosting": { bn: "ওয়েব হোস্টিং", en: "Web Hosting" },
  "pricing.resellerHosting": { bn: "রিসেলার হোস্টিং", en: "Reseller Hosting" },
  "pricing.vpsServer": { bn: "ভিপিএস সার্ভার", en: "VPS Server" },
  "pricing.emailHosting": { bn: "ইমেইল হোস্টিং", en: "Email Hosting" },
  "pricing.orderNow": { bn: "অর্ডার করুন", en: "Order Now" },
  "pricing.mo": { bn: "/মাস", en: "/mo" },
  "pricing.billedAnnually": { bn: "বার্ষিক বিল", en: "billed annually" },
  "pricing.popular": { bn: "জনপ্রিয়", en: "Popular" },

  // === Features / Services ===
  "features.ourServices": { bn: "আমাদের সার্ভিসসমূহ", en: "Our Services" },
  "features.allHosting": { bn: "সকল হোস্টিং সলিউশন", en: "All Hosting Solutions" },
  "features.servicesSubtitle": { bn: "আপনার অনলাইন বিজনেসের জন্য সেরা হোস্টিং সার্ভিস।", en: "The best hosting services for your online business." },
  "features.startingFrom": { bn: "শুরু হচ্ছে", en: "Starting From" },
  "features.viewPlan": { bn: "প্ল্যান দেখুন", en: "View Plan" },
  "features.extraBenefits": { bn: "অতিরিক্ত সুবিধাসমূহ", en: "Extra Benefits" },
  "features.benefitsTitle": { bn: "আমাদের ফিচার্স ও সার্ভিস!", en: "We Have the Features You Deserve!" },

  "features.domain": { bn: "ডোমেইন", en: "Domain" },
  "features.domainDesc": { bn: ".COM .NET .ORG .XYZ সহ আপনার ডোমেইন নাম রেজিস্টার করুন", en: "Register Your Domain Names .COM .NET .ORG .XYZ and more" },
  "features.webHostingDesc": { bn: "ছোট ও মাঝারি সাইটের জন্য ফাস্ট এবং সিকিউর ওয়েব হোস্টিং", en: "Get fast and secure Web hosting for small & medium sites." },
  "features.proHostingDesc": { bn: "আপনার ওয়েবসাইটের জন্য দ্রুত Pro NVMe cPanel ওয়েব হোস্টিং!", en: "Faster Pro NVMe cPanel Web Hosting for your website!" },
  "features.premiumHostingDesc": { bn: "বড় রিসোর্স এবং আরো ফিচারের জন্য প্রিমিয়াম হোস্টিং", en: "Premium Hosting designed for larger resources and more features" },
  "features.resellerHostingDesc": { bn: "আপনার বিজনেসের জন্য সেরা রিসেলার হোস্টিং প্ল্যান বেছে নিন", en: "Pick the best reseller hosting plan for your Business" },
  "features.vpsServerDesc": { bn: "শক্তিশালী এবং ১০০% কনফিগারযোগ্য VPS সার্ভার", en: "Powerful and 100% Configurable VPS Servers" },
  "features.emailHostingDesc": { bn: "CrossBox Suite Panel সহ প্রফেশনাল ইমেইল হোস্টিং", en: "Professional email hosting with CrossBox Suite Panel" },
  "features.dedicatedServerDesc": { bn: "ডেডিকেটেড সার্ভার শেয়ার্ড হোস্টিং থেকে সম্পূর্ণ ভিন্ন", en: "Dedicated servers are entirely different from shared hostings" },

  "features.freeMigration": { bn: "ফ্রি মাইগ্রেশন সার্ভিস", en: "Free Migration Service" },
  "features.freeMigrationDesc": { bn: "আমাদের মাইগ্রেশন বিশেষজ্ঞদের সাহায্যে আপনার ওয়েবসাইট ফ্রিতে ট্রান্সফার করুন।", en: "Transfer your website to us free with the help of our migration experts." },
  "features.moneyBack": { bn: "৭ দিনের মানি-ব্যাক গ্যারান্টি", en: "7 Days Money Back Guarantee" },
  "features.moneyBackDesc": { bn: "সন্তুষ্ট না হলে ৭ দিনের মধ্যে ক্যানসেল করে রিফান্ড নিন।", en: "If you're not completely satisfied, simply cancel and request a refund within 7 days." },
  "features.oneClick": { bn: "ওয়ান-ক্লিক ডিপ্লয়", en: "One-Click Deploy" },
  "features.oneClickDesc": { bn: "আমাদের ওয়ান ক্লিক ইনস্টলার দিয়ে যেকোনো ধরনের ওয়েবসাইট ইনস্টল করুন।", en: "With our one click installer tool, install any type of website." },
  "features.uptime": { bn: "৯৯.৯% আপটাইম গ্যারান্টি", en: "99.9% Uptime Guarantee" },
  "features.uptimeDesc": { bn: "আমাদের সার্ভার আপনার ওয়েবসাইট সবসময় অনলাইন রাখে। SLA দ্বারা সমর্থিত।", en: "Our servers ensure your websites stay online. Uptime backed by our SLA." },
  "features.support": { bn: "২৪/৭ এক্সপার্ট সাপোর্ট", en: "24/7 Chat with Experts" },
  "features.supportDesc": { bn: "আমাদের কাস্টমার সাপোর্ট ২৪x৭x৩৬৫ দিন। এক্সপার্ট টিমে সবসময় অ্যাক্সেস।", en: "Our customer support is 24x7x365. Gain access to our expert support team." },
  "features.freeSSL": { bn: "ফ্রি SSL সার্টিফিকেট", en: "Free SSL Certificate" },
  "features.freeSSLDesc": { bn: "ফ্রি SSL সার্টিফিকেট, স্বয়ংক্রিয়, ইন্টারনেট সিকিউরিটির জন্য।", en: "Free SSL Certificate, automated, for Internet Security." },

  // === Testimonials ===
  "testimonials.title": { bn: "আমাদের ক্লায়েন্টরা কী বলেন", en: "What Our Clients Say" },
  "testimonials.t1": { bn: "PutulHost এর সার্ভিস অসাধারণ। আমাদের ওয়েবসাইট এখন অনেক ফাস্ট এবং সাপোর্ট টিম সবসময় সাহায্য করতে প্রস্তুত।", en: "PutulHost's service is excellent. Our website is much faster now and the support team is always ready to help." },
  "testimonials.t2": { bn: "২ বছর ধরে PutulHost ব্যবহার করছি। কোনো ডাউনটাইম নেই, প্রাইসিং ট্রান্সপারেন্ট এবং মাইগ্রেশন একদম ফ্রি ছিলো।", en: "Been using PutulHost for 2 years. No downtime, transparent pricing and migration was completely free." },
  "testimonials.t3": { bn: "VPS হোস্টিং নিয়ে খুবই সন্তুষ্ট। ডেডিকেটেড রিসোর্স, ফুল root access এবং 24/7 সাপোর্ট — সব মিলিয়ে বেস্ট চয়েস।", en: "Very satisfied with VPS hosting. Dedicated resources, full root access and 24/7 support — the best choice overall." },

  // === FAQ ===
  "faq.title": { bn: "সচরাচর জিজ্ঞাসা", en: "Frequently Asked Questions" },
  "faq.q1": { bn: "হোস্টিং প্ল্যান কি যেকোনো সময় আপগ্রেড করা যায়?", en: "Can I upgrade my hosting plan at any time?" },
  "faq.a1": { bn: "হ্যাঁ, আপনি যেকোনো সময় আপনার হোস্টিং প্ল্যান আপগ্রেড বা ডাউনগ্রেড করতে পারেন। আপগ্রেডের পর আপনার ডেটা এবং সেটিংস সব ঠিক থাকবে।", en: "Yes, you can upgrade or downgrade your hosting plan at any time. Your data and settings will remain intact after upgrading." },
  "faq.q2": { bn: "ফ্রি মাইগ্রেশন সার্ভিস কীভাবে কাজ করে?", en: "How does the free migration service work?" },
  "faq.a2": { bn: "আমাদের এক্সপার্ট টিম আপনার বর্তমান হোস্টিং থেকে সব ডেটা, ওয়েবসাইট, ইমেইল এবং ডাটাবেজ ফ্রিতে মাইগ্রেট করে দিবে। কোনো ডাউনটাইম ছাড়াই।", en: "Our expert team will migrate all your data, websites, emails and databases from your current hosting for free. Without any downtime." },
  "faq.q3": { bn: "পেমেন্ট মেথড কী কী সাপোর্ট করে?", en: "What payment methods are supported?" },
  "faq.a3": { bn: "আমরা bKash, Nagad, Rocket, ব্যাংক ট্রান্সফার, SSLCommerz (Visa/Mastercard) সাপোর্ট করি।", en: "We support bKash, Nagad, Rocket, bank transfer, and SSLCommerz (Visa/Mastercard)." },
  "faq.q4": { bn: "মানি-ব্যাক গ্যারান্টি আছে?", en: "Is there a money-back guarantee?" },
  "faq.a4": { bn: "হ্যাঁ, ৭ দিনের মানি-ব্যাক গ্যারান্টি আছে। যদি সন্তুষ্ট না হন, সম্পূর্ণ রিফান্ড পাবেন।", en: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied, you'll get a full refund." },
  "faq.q5": { bn: "সাপোর্ট টিমের সাথে কীভাবে যোগাযোগ করব?", en: "How do I contact the support team?" },
  "faq.a5": { bn: "আমাদের সাথে লাইভ চ্যাট, ফোন, ইমেইল এবং সাপোর্ট টিকেটের মাধ্যমে যোগাযোগ করতে পারেন। আমরা ২৪/৭ সাপোর্ট দিই।", en: "You can contact us via live chat, phone, email and support ticket. We provide 24/7 support." },

  // === Server Status ===
  "server.title": { bn: "ডেটা সেন্টার লোকেশনসমূহ", en: "Data Center Locations" },
  "server.subtitle": { bn: "বিশ্বব্যাপী ৬টি ডেটা সেন্টারে আপনার কন্টেন্ট ডেলিভার করুন।", en: "Deliver your content across 6 data centers worldwide." },
  "server.location": { bn: "লোকেশন", en: "Location" },
  "server.status": { bn: "স্ট্যাটাস", en: "Status" },
  "server.latency": { bn: "ল্যাটেন্সি", en: "Latency" },
  "server.load": { bn: "লোড", en: "Load" },
  "server.operational": { bn: "চালু আছে", en: "Operational" },

  // === CTA ===
  "cta.needHelp": { bn: "সাহায্য দরকার? আমরা এখানে আছি", en: "Need Help? We Are Here" },
  "cta.title": { bn: "আজই শুরু করুন!", en: "Get Started Today!" },
  "cta.subtitle": { bn: "৭ দিনের মানি-ব্যাক গ্যারান্টি। কোনো রিস্ক নেই। আজই আপনার ওয়েবসাইট লঞ্চ করুন।", en: "7-day money-back guarantee. No risk. Launch your website today." },
  "cta.callUs": { bn: "কল করুন", en: "Call Us" },
  "cta.liveChat": { bn: "লাইভ চ্যাট", en: "Live Chat" },
  "cta.email": { bn: "ইমেইল", en: "Email" },

  // === Footer ===
  "footer.desc": { bn: "প্রিমিয়াম কোয়ালিটি ডোমেইন ও ওয়েব হোস্টিং সার্ভিস। ২৪/৭ সাপোর্ট, ৯৯.৯% আপটাইম গ্যারান্টি।", en: "Premium Quality Domain & Web Hosting Service. 24/7 support, 99.9% uptime guarantee." },
  "footer.hosting": { bn: "হোস্টিং", en: "Hosting" },
  "footer.services": { bn: "সার্ভিসেস", en: "Services" },
  "footer.support": { bn: "সাপোর্ট", en: "Support" },
  "footer.company": { bn: "কোম্পানি", en: "Company" },
  "footer.paymentMethods": { bn: "পেমেন্ট মেথড", en: "Payment Methods" },
  "footer.allRights": { bn: "সর্বস্বত্ব সংরক্ষিত।", en: "All rights reserved." },
  "footer.allSystems": { bn: "সকল সিস্টেম চালু আছে", en: "All systems operational" },
  "footer.knowledgeBase": { bn: "নলেজ বেস", en: "Knowledge Base" },
  "footer.contactUs": { bn: "যোগাযোগ করুন", en: "Contact Us" },
  "footer.supportTicket": { bn: "সাপোর্ট টিকেট", en: "Support Ticket" },
  "footer.liveChat": { bn: "লাইভ চ্যাট", en: "Live Chat" },
  "footer.aboutUs": { bn: "আমাদের সম্পর্কে", en: "About Us" },
  "footer.affiliate": { bn: "অ্যাফিলিয়েট", en: "Affiliate" },
  "footer.tos": { bn: "সেবার শর্তাবলী", en: "Terms of Service" },
  "footer.refund": { bn: "রিফান্ড পলিসি", en: "Refund Policy" },
  "footer.privacy": { bn: "প্রাইভেসি পলিসি", en: "Privacy Policy" },
  "footer.domainReg": { bn: "ডোমেইন রেজিস্ট্রেশন", en: "Domain Registration" },
  "footer.vpsServer": { bn: "ভিপিএস সার্ভার", en: "VPS Server" },
  "footer.dedicatedServer": { bn: "ডেডিকেটেড সার্ভার", en: "Dedicated Server" },
  "footer.radioHosting": { bn: "রেডিও হোস্টিং", en: "Radio Hosting" },
  "footer.graphicsDesign": { bn: "গ্রাফিক্স ডিজাইন", en: "Graphics Design" },

  // === Language ===
  "lang.bn": { bn: "বাংলা", en: "বাংলা" },
  "lang.en": { bn: "English", en: "English" },
};

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("bn");

  const tr = (key: string): string => {
    return t[key]?.[lang] || t[key]?.["bn"] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
