import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, MessageCircle, HeadphonesIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const CallCenterDashboard = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [stats, setStats] = useState({ pendingOrders: 0, openChats: 0, openTickets: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [orders, chats, tickets] = await Promise.all([
        supabase.from("theme_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("live_chats").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      ]);
      setStats({
        pendingOrders: orders.count || 0,
        openChats: chats.count || 0,
        openTickets: tickets.count || 0,
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: bn ? "পেন্ডিং অর্ডার" : "Pending Orders", value: stats.pendingOrders, icon: ShoppingCart, color: "text-orange-500 bg-orange-500/10" },
    { label: bn ? "ওপেন চ্যাট" : "Open Chats", value: stats.openChats, icon: MessageCircle, color: "text-blue-500 bg-blue-500/10" },
    { label: bn ? "ওপেন টিকেট" : "Open Tickets", value: stats.openTickets, icon: HeadphonesIcon, color: "text-green-500 bg-green-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{bn ? "কল সেন্টার ড্যাশবোর্ড" : "Call Center Dashboard"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{bn ? "আজকের কাজের সারসংক্ষেপ" : "Today's work summary"}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${c.color}`}><c.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CallCenterDashboard;
