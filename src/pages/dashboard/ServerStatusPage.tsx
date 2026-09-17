import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Server, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const defaultServers = [
  { location: "🇧🇩 Bangladesh", city: "Dhaka (BDIX)", latency: "5ms", load: 63 },
  { location: "🇨🇦 Canada", city: "Toronto", latency: "12ms", load: 34 },
  { location: "🇺🇸 United States", city: "New York", latency: "18ms", load: 52 },
  { location: "🇫🇮 Finland", city: "Helsinki", latency: "28ms", load: 41 },
  { location: "🇮🇳 India", city: "Mumbai", latency: "35ms", load: 27 },
  { location: "🇦🇺 Australia", city: "Sydney", latency: "42ms", load: 19 },
];

const serviceLabels: Record<string, { en: string; bn: string }> = {
  web: { en: "Website & Hosting Content", bn: "ওয়েবসাইট ও হোস্টিং কনটেন্ট" },
  panel: { en: "Client Area & Billing", bn: "ক্লায়েন্ট এরিয়া ও বিলিং" },
  database: { en: "Database", bn: "ডেটাবেস" },
  dns: { en: "DNS Network", bn: "ডিএনএস নেটওয়ার্ক" },
  support: { en: "Support System", bn: "সাপোর্ট সিস্টেম" },
};

type Check = { key: string; ok: boolean; ms: number; detail?: string };

const DashboardServerStatus = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [content, setContent] = useState<any[]>([]);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    const started = performance.now();
    const [{ data }, healthRes] = await Promise.all([
      supabase
        .from("site_content")
        .select("*")
        .eq("page", "home")
        .eq("is_active", true)
        .in("section_key", ["server_list"]),
      fetch("/api/public/health", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .catch(() => null),
    ]);
    setRoundTripMs(Math.round(performance.now() - started));
    setContent(data || []);
    if (healthRes?.checks) {
      setChecks(healthRes.checks as Check[]);
      setHealthError(false);
    } else {
      setChecks(null);
      setHealthError(true);
    }
    setCheckedAt(new Date());
    setRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const servers = useMemo(() => {
    const item = content.find((c) => c.section_key === "server_list");
    const list: any[] = item?.metadata?.servers || defaultServers;
    return [...list].sort((a, b) =>
      String(a.city).includes("Dhaka") ? -1 : String(b.city).includes("Dhaka") ? 1 : 0
    );
  }, [content]);

  const allOk = !!checks && checks.every((c) => c.ok);
  const degraded = !!checks && !allOk;

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "সার্ভার স্ট্যাটাস" : "Server Status"}</h1>
          <p className="text-sm text-muted-foreground">
            {bn
              ? "আমাদের প্ল্যাটফর্মের সার্ভিসগুলো এখনই যাচাই করা হয়েছে"
              : "Our platform services, checked live just now"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 bg-secondary/60 text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> {bn ? "রিফ্রেশ" : "Refresh"}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          {healthError ? (
            <>
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-warning">
                {bn ? "স্ট্যাটাস যাচাই করা যায়নি" : "Status check unavailable"}
              </h2>
            </>
          ) : allOk ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <h2 className="text-sm font-bold text-success">
                {bn ? "সব সিস্টেম স্বাভাবিকভাবে চলছে" : "All systems operational"}
              </h2>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-warning">
                {bn ? "কিছু সার্ভিসে সমস্যা হচ্ছে" : "Some services are degraded"}
              </h2>
            </>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {bn ? "সর্বশেষ যাচাই: " : "Last checked: "}
          {checkedAt?.toLocaleTimeString(bn ? "bn-BD" : "en-US")}
          {roundTripMs !== null && (
            <>
              {" · "}
              {bn ? "আপনার সংযোগের রেসপন্স" : "Your response time"}: {roundTripMs}ms
            </>
          )}
          {" · "}
          {bn ? "প্রতি ৬০ সেকেন্ডে স্বয়ংক্রিয় যাচাই" : "Auto-rechecked every 60 seconds"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> {bn ? "সার্ভিস" : "Services"}
          </h2>
          {healthError ? (
            <div className="text-center py-6">
              <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {bn
                  ? "এই মুহূর্তে স্ট্যাটাস আনা যায়নি। রিফ্রেশ করে আবার চেষ্টা করুন।"
                  : "Could not fetch status right now. Please refresh to try again."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(checks || []).map((c) => {
                const label = serviceLabels[c.key] || { en: c.key, bn: c.key };
                return (
                  <div key={c.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground">{bn ? label.bn : label.en}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{c.ms}ms</span>
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                          c.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {c.ok ? (bn ? "সচল" : "Operational") : bn ? "সমস্যা" : "Issue"}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {degraded && (
            <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary shrink-0" />
              {bn
                ? "আমাদের টিম স্বয়ংক্রিয়ভাবে সতর্কতা পেয়েছে — সহায়তা লাগলে টিকিট খুলুন।"
                : "Our team is alerted automatically — open a ticket if you need help."}
            </p>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> {bn ? "ডেটা সেন্টার" : "Data centers"}
          </h2>
          <p className="text-[10px] text-muted-foreground mb-3">
            {bn
              ? "সাধারণ ল্যাটেন্সি ও গড় লোড (রেফারেন্স তথ্য, লাইভ মনিটরিং নয়)"
              : "Typical latency and average load (reference figures, not live monitoring)"}
          </p>
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
