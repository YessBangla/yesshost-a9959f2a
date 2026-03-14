import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rahim Ahmed",
    company: "TechBD Solutions",
    text: "YessHost এর সার্ভিস অসাধারণ। আমাদের ওয়েবসাইট এখন অনেক ফাস্ট এবং সাপোর্ট টিম সবসময় সাহায্য করতে প্রস্তুত।",
    rating: 5,
    avatar: "RA",
  },
  {
    name: "Fatima Khan",
    company: "ShopNow BD",
    text: "২ বছর ধরে YessHost ব্যবহার করছি। কোনো ডাউনটাইম নেই, প্রাইসিং ট্রান্সপারেন্ট এবং মাইগ্রেশন একদম ফ্রি ছিলো।",
    rating: 5,
    avatar: "FK",
  },
  {
    name: "Kamal Hossain",
    company: "DevStudio BD",
    text: "VPS হোস্টিং নিয়ে খুবই সন্তুষ্ট। ডেডিকেটেড রিসোর্স, ফুল root access এবং 24/7 সাপোর্ট — সব মিলিয়ে বেস্ট চয়েস।",
    rating: 5,
    avatar: "KH",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const TestimonialsSection = () => {
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
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
            আমাদের ক্লায়েন্টরা কী বলেন
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
