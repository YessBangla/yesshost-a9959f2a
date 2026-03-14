import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "হোস্টিং প্ল্যান কি যেকোনো সময় আপগ্রেড করা যায়?",
    a: "হ্যাঁ, আপনি যেকোনো সময় আপনার হোস্টিং প্ল্যান আপগ্রেড বা ডাউনগ্রেড করতে পারেন। আপগ্রেডের পর আপনার ডেটা এবং সেটিংস সব ঠিক থাকবে।",
  },
  {
    q: "ফ্রি মাইগ্রেশন সার্ভিস কীভাবে কাজ করে?",
    a: "আমাদের এক্সপার্ট টিম আপনার বর্তমান হোস্টিং থেকে সব ডেটা, ওয়েবসাইট, ইমেইল এবং ডাটাবেজ ফ্রিতে মাইগ্রেট করে দিবে। কোনো ডাউনটাইম ছাড়াই।",
  },
  {
    q: "পেমেন্ট মেথড কী কী সাপোর্ট করে?",
    a: "আমরা bKash, Nagad, Rocket, ব্যাংক ট্রান্সফার, SSLCommerz (Visa/Mastercard), Stripe এবং PayPal সাপোর্ট করি।",
  },
  {
    q: "মানি-ব্যাক গ্যারান্টি আছে?",
    a: "হ্যাঁ, ৩০ দিনের মানি-ব্যাক গ্যারান্টি আছে। যদি সন্তুষ্ট না হন, সম্পূর্ণ রিফান্ড পাবেন।",
  },
  {
    q: "সাপোর্ট টিমের সাথে কীভাবে যোগাযোগ করব?",
    a: "আমাদের সাথে লাইভ চ্যাট, ফোন, ইমেইল এবং সাপোর্ট টিকেটের মাধ্যমে যোগাযোগ করতে পারেন। আমরা ২৪/৭ সাপোর্ট দিই।",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            সচরাচর জিজ্ঞাসা
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: brandCurve, delay: i * 0.06 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  openIndex === i ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
