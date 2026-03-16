import DynamicLegalPage from "@/components/DynamicLegalPage";

const fallbackSections = [
  { title_bn: "৩০ দিনের মানি-ব্যাক গ্যারান্টি", title_en: "30-Day Money-Back Guarantee", content_bn: "শেয়ার্ড হোস্টিং, রিসেলার হোস্টিং এবং ইমেইল হোস্টিং প্ল্যানের জন্য ৩০ দিনের মানি-ব্যাক গ্যারান্টি প্রযোজ্য।", content_en: "30-day money-back guarantee applies to shared hosting, reseller hosting and email hosting plans." },
  { title_bn: "রিফান্ড প্রক্রিয়া", title_en: "Refund Process", content_bn: "রিফান্ডের জন্য সাপোর্ট টিকেট খুলুন বা support@yesshost.com এ ইমেইল করুন।", content_en: "Open a support ticket or email support@yesshost.com for refund." },
  { title_bn: "রিফান্ড প্রযোজ্য নয়", title_en: "Non-Refundable", content_bn: "ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার, ডেডিকেটেড সার্ভার, SSL সার্টিফিকেট এবং গ্রাফিক্স ডিজাইন সেবায় রিফান্ড প্রযোজ্য নয়।", content_en: "Domain registration, VPS servers, dedicated servers, SSL certificates and graphics design services are non-refundable." },
  { title_bn: "পেমেন্ট মেথড", title_en: "Payment Method", content_bn: "রিফান্ড মূল পেমেন্ট মেথডে ফেরত দেওয়া হবে (বিকাশ, নগদ, রকেট বা ব্যাংক)।", content_en: "Refunds will be returned to the original payment method (bKash, Nagad, Rocket or bank)." },
];

const Refund = () => (
  <DynamicLegalPage
    pageKey="refund"
    fallbackTitle={{ bn: "রিফান্ড পলিসি", en: "Refund Policy" }}
    fallbackSections={fallbackSections}
    seoDescription="Yess Host Refund Policy. 30-day money-back guarantee for shared hosting plans. Learn about refund eligibility and process."
  />
);

export default Refund;
