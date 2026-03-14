import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rahim Ahmed",
    company: "TechBD",
    text: "YessHost এর সার্ভিস অসাধারণ। আমাদের ওয়েবসাইট এখন অনেক ফাস্ট এবং সাপোর্ট টিম সবসময় সাহায্য করতে প্রস্তুত।",
  },
  {
    name: "Fatima Khan",
    company: "ShopNow BD",
    text: "২ বছর ধরে YessHost ব্যবহার করছি। কোনো ডাউনটাইম নেই, প্রাইসিং ট্রান্সপারেন্ট এবং মাইগ্রেশন একদম ফ্রি ছিলো।",
  },
  {
    name: "Kamal Hossain",
    company: "DevStudio",
    text: "VPS হোস্টিং নিয়ে খুবই সন্তুষ্ট। ডেডিকেটেড রিসোর্স, ফুল root access এবং 24/7 সাপোর্ট — সব মিলিয়ে বেস্ট চয়েস।",
  },
];

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const TestimonialsSection = () => {
  return (
    <section className="py-[15vh] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-mono uppercase tracking-widest mb-4">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter mb-4">
            Our Clients Say About Us
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
