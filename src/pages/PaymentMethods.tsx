import { motion } from "framer-motion";
import { CreditCard, Building2, Smartphone, Globe, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const PaymentMethods = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const methods = [
    {
      icon: Smartphone,
      name: "bKash",
      color: "from-pink-500 to-rose-600",
      typeBn: "মোবাইল ব্যাংকিং",
      typeEn: "Mobile Banking",
      detailsBn: [
        "পার্সোনাল bKash অ্যাকাউন্ট থেকে পেমেন্ট করুন",
        "মার্চেন্ট নম্বর: 01XXXXXXXXX",
        "Send Money অপশন ব্যবহার করুন",
        "রেফারেন্সে আপনার ইনভয়েস নম্বর দিন",
      ],
      detailsEn: [
        "Pay from your personal bKash account",
        "Merchant number: 01XXXXXXXXX",
        "Use Send Money option",
        "Add your invoice number as reference",
      ],
    },
    {
      icon: Smartphone,
      name: "Nagad",
      color: "from-orange-500 to-amber-600",
      typeBn: "মোবাইল ব্যাংকিং",
      typeEn: "Mobile Banking",
      detailsBn: [
        "Nagad অ্যাকাউন্ট থেকে পেমেন্ট করুন",
        "মার্চেন্ট নম্বর: 01XXXXXXXXX",
        "Send Money অপশন ব্যবহার করুন",
        "রেফারেন্সে আপনার ইনভয়েস নম্বর দিন",
      ],
      detailsEn: [
        "Pay from your Nagad account",
        "Merchant number: 01XXXXXXXXX",
        "Use Send Money option",
        "Add your invoice number as reference",
      ],
    },
    {
      icon: CreditCard,
      name: "SSLCommerz",
      color: "from-blue-500 to-indigo-600",
      typeBn: "অনলাইন পেমেন্ট",
      typeEn: "Online Payment",
      detailsBn: [
        "Visa, Mastercard, AMEX কার্ড সাপোর্ট",
        "বাংলাদেশী ও আন্তর্জাতিক কার্ড গ্রহণযোগ্য",
        "সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড",
        "তাৎক্ষণিক পেমেন্ট কনফার্মেশন",
      ],
      detailsEn: [
        "Visa, Mastercard, AMEX card support",
        "Bangladeshi & international cards accepted",
        "Fully secure & encrypted",
        "Instant payment confirmation",
      ],
    },
    {
      icon: Building2,
      name: bn ? "ব্যাংক ট্রান্সফার" : "Bank Transfer",
      color: "from-emerald-500 to-green-600",
      typeBn: "ব্যাংক পেমেন্ট",
      typeEn: "Bank Payment",
      detailsBn: [
        "ব্যাংক: ডাচ-বাংলা ব্যাংক লিমিটেড",
        "অ্যাকাউন্ট নাম: Yess Host",
        "অ্যাকাউন্ট নম্বর: XXXXXXXXXX",
        "ব্রাঞ্চ: ঢাকা মেইন ব্রাঞ্চ",
      ],
      detailsEn: [
        "Bank: Dutch-Bangla Bank Limited",
        "Account Name: Yess Host",
        "Account Number: XXXXXXXXXX",
        "Branch: Dhaka Main Branch",
      ],
    },
    {
      icon: Globe,
      name: "PayPal",
      color: "from-sky-500 to-blue-600",
      typeBn: "আন্তর্জাতিক পেমেন্ট",
      typeEn: "International Payment",
      detailsBn: [
        "PayPal অ্যাকাউন্ট দিয়ে পেমেন্ট করুন",
        "ইমেইল: pay@yesshost.com",
        "USD ও অন্যান্য কারেন্সি গ্রহণযোগ্য",
        "বিদেশ থেকে পেমেন্টের জন্য আদর্শ",
      ],
      detailsEn: [
        "Pay with your PayPal account",
        "Email: pay@yesshost.com",
        "USD & other currencies accepted",
        "Ideal for international payments",
      ],
    },
    {
      icon: Smartphone,
      name: "Rocket",
      color: "from-purple-500 to-violet-600",
      typeBn: "মোবাইল ব্যাংকিং",
      typeEn: "Mobile Banking",
      detailsBn: [
        "Rocket অ্যাকাউন্ট থেকে পেমেন্ট করুন",
        "মার্চেন্ট নম্বর: 01XXXXXXXXX",
        "Send Money অপশন ব্যবহার করুন",
        "রেফারেন্সে আপনার ইনভয়েস নম্বর দিন",
      ],
      detailsEn: [
        "Pay from your Rocket account",
        "Merchant number: 01XXXXXXXXX",
        "Use Send Money option",
        "Add your invoice number as reference",
      ],
    },
  ];

  const steps = [
    { icon: CreditCard, titleBn: "পেমেন্ট মেথড বেছে নিন", titleEn: "Choose Payment Method" },
    { icon: Clock, titleBn: "পেমেন্ট সম্পন্ন করুন", titleEn: "Complete Payment" },
    { icon: CheckCircle2, titleBn: "কনফার্মেশন পান", titleEn: "Get Confirmation" },
  ];

  return (
    <PublicLayout>
      <SEOHead title="Payment Methods - Yess Host" description="Pay with bKash, Nagad, SSLCommerz, bank transfer, PayPal or Rocket. Secure and fast payment options for hosting services in Bangladesh." canonical="/payment" />
      <div className="pt-20 lg:pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: brandCurve }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {bn ? "পেমেন্ট মেথড" : "Payment Methods"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {bn
                ? "আমরা বাংলাদেশের জনপ্রিয় সকল পেমেন্ট মেথড সাপোর্ট করি। আপনার সুবিধামতো যেকোনো মাধ্যমে পেমেন্ট করুন।"
                : "We support all popular payment methods in Bangladesh. Pay conveniently using any method."}
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-xl glass-card">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-foreground">{bn ? s.titleBn : s.titleEn}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Payment Methods Grid */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {methods.map((m, i) => {
              const Icon = m.icon;
              const details = bn ? m.detailsBn : m.detailsEn;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="glass-card rounded-2xl overflow-hidden group"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${m.color}`} />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{m.name}</h3>
                        <p className="text-xs text-muted-foreground">{bn ? m.typeBn : m.typeEn}</p>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Notice */}
        <section className="container mx-auto px-4 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto glass-card rounded-2xl p-6 text-center"
          >
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground mb-2">
              {bn ? "গুরুত্বপূর্ণ তথ্য" : "Important Information"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {bn
                ? "ম্যানুয়াল পেমেন্ট (bKash, Nagad, ব্যাংক ট্রান্সফার) এর ক্ষেত্রে পেমেন্ট করার পর অবশ্যই সাপোর্ট টিকেট খুলে ট্রানজেকশন আইডি ও ইনভয়েস নম্বর জানান। অটোমেটিক পেমেন্ট (SSLCommerz) এর ক্ষেত্রে পেমেন্ট তাৎক্ষণিকভাবে কনফার্ম হয়ে যাবে।"
                : "For manual payments (bKash, Nagad, Bank Transfer), please open a support ticket with your Transaction ID and Invoice number after payment. Automatic payments (SSLCommerz) will be confirmed instantly."}
            </p>
          </motion.div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PaymentMethods;
