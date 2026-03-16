import DynamicLegalPage from "@/components/DynamicLegalPage";

const fallbackSections = [
  { title_bn: "১. তথ্য সংগ্রহ", title_en: "1. Information Collection", content_bn: "আমরা আপনার নাম, ইমেইল, ফোন নম্বর, ঠিকানা এবং পেমেন্ট তথ্য সংগ্রহ করি।", content_en: "We collect your name, email, phone number, address and payment information." },
  { title_bn: "২. তথ্যের ব্যবহার", title_en: "2. Use of Information", content_bn: "সংগৃহীত তথ্য সেবা প্রদান, বিলিং, সাপোর্ট এবং সেবার মান উন্নয়নে ব্যবহৃত হয়।", content_en: "Collected information is used for service delivery, billing, support and service improvement." },
  { title_bn: "৩. ডেটা সুরক্ষা", title_en: "3. Data Security", content_bn: "আমরা SSL এনক্রিপশন, ফায়ারওয়াল ব্যবহার করে আপনার ডেটা সুরক্ষিত রাখি।", content_en: "We protect your data using SSL encryption, firewalls and security protocols." },
  { title_bn: "৪. কুকিজ", title_en: "4. Cookies", content_bn: "আমাদের ওয়েবসাইট কুকিজ ব্যবহার করে ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে।", content_en: "Our website uses cookies to improve user experience." },
  { title_bn: "৫. আপনার অধিকার", title_en: "5. Your Rights", content_bn: "আপনার ডেটা দেখা, সংশোধন বা মুছে ফেলার অনুরোধ করতে পারেন।", content_en: "You can request to view, correct or delete your data." },
];

const Privacy = () => (
  <DynamicLegalPage
    pageKey="privacy"
    fallbackTitle={{ bn: "প্রাইভেসি পলিসি", en: "Privacy Policy" }}
    fallbackSections={fallbackSections}
    seoDescription="Yess Host Privacy Policy. Learn how we collect, use and protect your personal data with SSL encryption and security protocols."
  />
);

export default Privacy;
