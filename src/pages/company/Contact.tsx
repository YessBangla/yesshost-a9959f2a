import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";

const iconMap: Record<string, typeof Mail> = { Mail, Phone, MapPin, Clock };

const Contact = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("site_content").select("*").eq("page", "contact").eq("is_active", true).order("sort_order")
      .then(({ data }) => setContent(data || []));
  }, []);

  const get = (key: string) => content.find(c => c.section_key === key);
  const hero = get("hero");
  const title = hero ? (bn ? hero.title_bn : hero.title_en) : (bn ? "আমাদের সাথে যোগাযোগ করুন" : "Get in Touch");
  const desc = hero ? (bn ? hero.content_bn : hero.content_en) : (bn ? "যেকোনো প্রশ্ন বা সাহায্যের জন্য আমাদের সাথে যোগাযোগ করুন।" : "Contact us for any questions or assistance.");

  const contactInfo = useMemo(() => {
    const item = get("info");
    if (item?.metadata?.contacts) return item.metadata.contacts.map((c: any) => ({
      icon: iconMap[c.icon] || Phone,
      title: bn ? c.title_bn : c.title_en,
      value: c.value_bn ? (bn ? c.value_bn : c.value_en) : c.value,
      sub: bn ? (c.sub_bn || "") : (c.sub_en || ""),
    }));
    return [
      { icon: Phone, title: bn ? "ফোন" : "Phone", value: "+88 096 38 205 205", sub: bn ? "সকাল ১০টা - রাত ৮টা" : "10AM - 8PM" },
      { icon: Mail, title: bn ? "ইমেইল" : "Email", value: "support@yesshost.com", sub: bn ? "২৪ ঘণ্টার মধ্যে রিপ্লাই" : "Reply within 24 hours" },
      { icon: MapPin, title: bn ? "ঠিকানা" : "Address", value: bn ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh", sub: "" },
      { icon: Clock, title: bn ? "অফিস সময়" : "Office Hours", value: bn ? "শনি - বৃহস্পতি" : "Sat - Thu", sub: bn ? "সকাল ১০:০০ - রাত ৮:০০" : "10:00 AM - 8:00 PM" },
    ];
  }, [content, bn]);

  return (
    <PublicLayout>
      <SEOHead title="Contact Us - Yess Host" description="Get in touch with Yess Host support team. Call +88 096 38 205 205 or email support@yesshost.com. Available Saturday to Thursday, 10AM-8PM." canonical="/contact" />
      <div className="pt-20 lg:pt-24 pb-16">
        <section className="container mx-auto px-4 text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold gradient-primary text-primary-foreground mb-4">
              {bn ? "যোগাযোগ" : "Contact"}
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">{title}</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{desc}</p>
          </motion.div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((c: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-3"><c.icon className="w-5 h-5 text-primary" /></div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm text-foreground">{c.value}</p>
                  {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{bn ? "মেসেজ পাঠান" : "Send a Message"}</h2>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
                  toast.error(bn ? "সব ফিল্ড পূরণ করুন" : "Please fill all fields");
                  return;
                }
                setSending(true);
                const { error } = await supabase.from("contact_messages").insert({
                  name: form.name.trim(),
                  email: form.email.trim(),
                  subject: form.subject.trim(),
                  message: form.message.trim(),
                });
                setSending(false);
                if (error) {
                  toast.error(bn ? "মেসেজ পাঠাতে সমস্যা হয়েছে" : "Failed to send message");
                } else {
                  setSent(true);
                  setForm({ name: "", email: "", subject: "", message: "" });
                  toast.success(bn ? "মেসেজ সফলভাবে পাঠানো হয়েছে!" : "Message sent successfully!");
                  setTimeout(() => setSent(false), 3000);
                }
              }}>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={bn ? "আপনার নাম" : "Your Name"} required
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={bn ? "ইমেইল ঠিকানা" : "Email Address"} type="email" required
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder={bn ? "বিষয়" : "Subject"} required
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30" />
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={bn ? "আপনার মেসেজ লিখুন..." : "Write your message..."} rows={4} required
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 resize-none" />
                <button type="submit" disabled={sending} className="w-full py-3.5 font-semibold rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {sending ? (bn ? "পাঠানো হচ্ছে..." : "Sending...") : sent ? (bn ? "পাঠানো হয়েছে!" : "Sent!") : (bn ? "পাঠান" : "Send Message")}
                </button>
              </form>
            </motion.div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Contact;
