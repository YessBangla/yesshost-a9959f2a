import DynamicLegalPage from "@/components/DynamicLegalPage";

const fallbackSections = [
  { title_bn: "১. সেবার বিবরণ", title_en: "1. Service Description", content_bn: "Yess Host ওয়েব হোস্টিং, ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার, ডেডিকেটেড সার্ভার এবং সংশ্লিষ্ট সেবা প্রদান করে।", content_en: "Yess Host provides web hosting, domain registration, VPS servers, dedicated servers and related services." },
  { title_bn: "২. অ্যাকাউন্ট দায়িত্ব", title_en: "2. Account Responsibility", content_bn: "আপনি আপনার অ্যাকাউন্টের নিরাপত্তার জন্য দায়ী।", content_en: "You are responsible for your account security." },
  { title_bn: "৩. পেমেন্ট পলিসি", title_en: "3. Payment Policy", content_bn: "সকল পেমেন্ট বাংলাদেশি টাকায় (BDT) প্রদান করতে হবে।", content_en: "All payments must be made in Bangladeshi Taka (BDT)." },
  { title_bn: "৪. গ্রহণযোগ্য ব্যবহার", title_en: "4. Acceptable Use", content_bn: "অবৈধ কন্টেন্ট, স্প্যাম, ম্যালওয়্যার বিতরণ নিষিদ্ধ।", content_en: "Illegal content, spam, malware distribution are prohibited." },
  { title_bn: "৫. আপটাইম গ্যারান্টি", title_en: "5. Uptime Guarantee", content_bn: "আমরা ৯৯.৯% আপটাইম গ্যারান্টি দিই।", content_en: "We guarantee 99.9% uptime." },
  { title_bn: "৬. ডেটা ব্যাকআপ", title_en: "6. Data Backup", content_bn: "আপনার নিজের ডেটার ব্যাকআপ রাখার দায়িত্ব আপনার।", content_en: "You are responsible for your own data backups." },
  { title_bn: "৭. যোগাযোগ", title_en: "7. Contact", content_bn: "support@yesshost.com এ যোগাযোগ করুন।", content_en: "Contact support@yesshost.com." },
];

const Terms = () => (
  <DynamicLegalPage
    pageKey="terms"
    fallbackTitle={{ bn: "সেবার শর্তাবলী", en: "Terms of Service" }}
    fallbackSections={fallbackSections}
    seoDescription="Yess Host Terms of Service. Read our policies on hosting, payments, acceptable use, uptime guarantee and data backup."
  />
);

export default Terms;
