import { Phone, MessageCircle, TicketCheck, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

const NeedHelpSection = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const navigate = useNavigate();

  const options = [
    {
      icon: Phone,
      titleBn: "কল করুন",
      titleEn: "Call Us",
      descBn: "১০AM - ৮PM (প্রতিদিন)",
      descEn: "10AM - 8PM (Everyday)",
      href: "tel:+8809638205205",
      external: true,
      color: "from-emerald-500 to-green-600",
    },
    {
      icon: MessageCircle,
      titleBn: "লাইভ চ্যাট",
      titleEn: "Live Chat",
      descBn: "তাৎক্ষণিক সাহায্য পান",
      descEn: "Get instant help",
      action: "livechat",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: TicketCheck,
      titleBn: "সাপোর্ট টিকেট",
      titleEn: "Support Ticket",
      descBn: "বিস্তারিত সমস্যা জানান",
      descEn: "Submit detailed issues",
      href: "/dashboard/support",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: Mail,
      titleBn: "ইমেইল করুন",
      titleEn: "Email Us",
      descBn: "support@yesshost.com",
      descEn: "support@yesshost.com",
      href: "mailto:support@yesshost.com",
      external: true,
      color: "from-purple-500 to-violet-600",
    },
  ];

  const handleClick = (opt: (typeof options)[0]) => {
    if (opt.action === "livechat") {
      navigate("/chat-rooms");
    }
  };

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: brandCurve }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
            {bn ? "সাহায্য" : "Support"}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-3">
            {bn ? "সাহায্য দরকার? আমরা এখানে আছি" : "Need Help? We Are Here"}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            {bn
              ? "যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন — আমরা সবসময় প্রস্তুত"
              : "Contact us anytime — our team is always ready to help"}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            const inner = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: brandCurve, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass-card rounded-2xl p-6 text-center cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-shadow group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
                  {bn ? opt.titleBn : opt.titleEn}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {bn ? opt.descBn : opt.descEn}
                </p>
              </motion.div>
            );

            if (opt.action) {
              return (
                <div key={i} onClick={() => handleClick(opt)}>
                  {inner}
                </div>
              );
            }

            if (opt.external) {
              return (
                <a key={i} href={opt.href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              );
            }

            return (
              <Link key={i} to={opt.href!}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NeedHelpSection;
