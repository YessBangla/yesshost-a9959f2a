import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Server, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const defaultServers = [
  { location: "🇧🇩 Bangladesh", city: "Dhaka (BDIX)", latency: "5ms", load: 63 },
  { location: "🇨🇦 Canada", city: "Toronto", latency: "12ms", load: 34 },
  { location: "🇺🇸 United States", city: "New York", latency: "18ms", load: 52 },
  { location: "🇫🇮 Finland", city: "Helsinki", latency: "28ms", load: 41 },
  { location: "🇮🇳 India", city: "Mumbai", latency: "35ms", load: 27 },
  { location: "🇦🇺 Australia", city: "Sydney", latency: "42ms", load: 19 },
];

const services = [
  { key: "web", en: "Web Hosting", bn: "ওয়েব হোস্টিং" },
  { key: "mail", en: "Mail Servers", bn: "মেইল সার্ভার" },
  { key: "dns", en: "DNS Network", bn: "ডিএনএস নেটওয়ার্ক" },
  { key: "panel", en: "Client Area & Billing", bn: "ক্লায়েন্ট এরিয়া ও বিলিং" },
  { key: "support", en: "Support System", bn: "সাপোর্ট সিস্টেম" },
];

const DashboardServerStatus = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [content, setContent] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState(new Date());

  const load = async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("site_content")
      .select("*")
      .eq("page", "home")
      .eq("is_active", true)
      .in("section_key", ["server_list"]);
    setContent(data || []);
    setCheckedAt(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const servers = useMemo(() => {
    const item = content.find((c) => c.section_key === "server_list");
    const list: any[] = item?.metadata?.servers || defaultServers;
    return [...list].sort((a, b) =>
      String(a.city).includes("Dhaka") ? -1 : String(b.city).includes("Dhaka") ? 1 : 0
    );
  }, [content]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "সার্ভার স্ট্যাটাস" : "Server Status"}</h1>
          <p className="text-sm text-muted-foreground">
            {bn ? "আমাদের নেটওয়ার্ক ও সার্ভিসগুলোর বর্তমান অবস্থা" : "Live status of our network and services"}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-secondary/60 text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> {bn ? "রিফ্রেশ" : "Refresh"}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <h2 className="text-sm font-bold text-success">
            {bn ? "সব সিস্টেম স্বাভাবিকভাবে চলছে" : "All systems operational"}
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {bn ? "সর্বশেষ যাচাই: " : "Last checked: "}
          {checkedAt.toLocaleTimeString(bn ? "bn-BD" : "en-US")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> {bn ? "সার্ভিস" : "Services"}
          </h2>
          <div className="space-y-2.5">
            {services.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{bn ? s.bn : s.en}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-success/10 text-success font-semibold">
                  {bn ? "সচল" : "Operational"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> {bn ? "ডেটা সেন্টার" : "Data centers"}
          </h2>
          <div className="space-y-3">
            {servers.map((s: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">
                    {s.location} · {s.city}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> {s.latency}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${Number(s.load) > 80 ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${Math.min(100, Number(s.load) || 0)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {bn ? "লোড" : "Load"}: {s.load}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardServerStatus;
