import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, Search, ShieldCheck, Server, Mail, FileText, Link2, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle, Copy, Trash2, Bug, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getDebugLogs, clearDebugLogs, subscribeDebugLogs, formatLogsForCopy,
  logApiError, friendlyMessage, type DebugLogEntry,
} from "@/lib/errorReporting";

type CheckStatus = "ok" | "warn" | "fail";
interface Check { id: string; status: CheckStatus; values: string[]; note_en: string; note_bn: string; }
interface DiagnoseResult { domain: string; summary: CheckStatus; checks: Check[]; checked_at: string; }

const CHECK_META: Record<string, { icon: typeof Globe; en: string; bn: string }> = {
  ns: { icon: Server, en: "Nameservers (NS)", bn: "নেমসার্ভার (NS)" },
  a: { icon: Globe, en: "A record (IPv4)", bn: "A রেকর্ড (IPv4)" },
  aaaa: { icon: Globe, en: "AAAA record (IPv6)", bn: "AAAA রেকর্ড (IPv6)" },
  cname: { icon: Link2, en: "www CNAME", bn: "www CNAME" },
  mx: { icon: Mail, en: "Mail records (MX)", bn: "মেইল রেকর্ড (MX)" },
  txt: { icon: FileText, en: "TXT / SPF", bn: "TXT / SPF" },
  ssl: { icon: ShieldCheck, en: "SSL / HTTPS", bn: "SSL / HTTPS" },
  redirect: { icon: Link2, en: "HTTP to HTTPS redirect", bn: "HTTP থেকে HTTPS রিডাইরেক্ট" },
};

const STATUS_UI: Record<CheckStatus, { icon: typeof CheckCircle2; cls: string; bg: string }> = {
  ok: { icon: CheckCircle2, cls: "text-success", bg: "bg-success/10" },
  warn: { icon: AlertTriangle, cls: "text-warning", bg: "bg-warning/10" },
  fail: { icon: XCircle, cls: "text-destructive", bg: "bg-destructive/10" },
};

const Troubleshoot = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const [domain, setDomain] = useState("");
  const [expectedIp, setExpectedIp] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<DebugLogEntry[]>(getDebugLogs());
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeDebugLogs(setLogs), []);

  const runDiagnose = async () => {
    const host = domain.trim();
    if (!host) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("domain-diagnose", {
        body: { domain: host, expected_ip: expectedIp.trim() || undefined },
      });
      if (fnError) throw fnError;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as DiagnoseResult);
    } catch (e) {
      const entry = logApiError("domain-diagnose", e, { area: "domain" });
      setError(
        `${friendlyMessage("domain", bn, entry?.status ?? null, entry?.message)}${entry ? ` (${entry.code})` : ""}`,
      );
    } finally {
      setRunning(false);
    }
  };

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(formatLogsForCopy(logs));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const counts = useMemo(() => {
    const c = { ok: 0, warn: 0, fail: 0 };
    (result?.checks || []).forEach((x) => { c[x.status] += 1; });
    return c;
  }, [result]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {bn ? "সমস্যা নির্ণয় (Troubleshoot)" : "Troubleshoot"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {bn
            ? "ডোমেইনের DNS, SSL ও রেকর্ড পরীক্ষা করুন এবং সাম্প্রতিক এরর বিবরণ দেখুন"
            : "Check your domain's DNS, SSL and records, and review recent error details"}
        </p>
      </div>

      {/* Domain checker */}
      <div className="glass-card rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runDiagnose()}
              placeholder={bn ? "yourdomain.com" : "yourdomain.com"}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <input
            value={expectedIp}
            onChange={(e) => setExpectedIp(e.target.value)}
            placeholder={bn ? "প্রত্যাশিত IP (ঐচ্ছিক)" : "Expected IP (optional)"}
            className="sm:w-56 px-4 py-3 min-h-[44px] rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/30 text-sm"
          />
          <button
            onClick={runDiagnose}
            disabled={running || !domain.trim()}
            className="flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-5 py-3 min-h-[44px] rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {bn ? "পরীক্ষা করুন" : "Run check"}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {running && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        )}

        {!result && !running && !error && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {bn ? "এখনো কোনো পরীক্ষা চালানো হয়নি" : "No diagnostics run yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {bn
                ? "উপরে আপনার ডোমেইন লিখে পরীক্ষা শুরু করুন — DNS, SSL ও CNAME যাচাই করা হবে।"
                : "Enter your domain above to check DNS, SSL and CNAME records."}
            </p>
          </div>
        )}

        {result && !running && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-foreground">{result.domain}</span>
              <span className="text-success">{counts.ok} {bn ? "ঠিক আছে" : "passed"}</span>
              <span className="text-warning">{counts.warn} {bn ? "সতর্কতা" : "warnings"}</span>
              <span className="text-destructive">{counts.fail} {bn ? "সমস্যা" : "failed"}</span>
              <span className="text-muted-foreground">
                {new Date(result.checked_at).toLocaleString(bn ? "bn-BD" : "en-US")}
              </span>
            </div>

            {result.checks.map((c, i) => {
              const meta = CHECK_META[c.id] || { icon: Globe, en: c.id, bn: c.id };
              const ui = STATUS_UI[c.status];
              const Icon = meta.icon;
              const StatusIcon = ui.icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ui.bg}`}>
                      <Icon className={`w-4 h-4 ${ui.cls}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{bn ? meta.bn : meta.en}</h3>
                        <StatusIcon className={`w-4 h-4 ${ui.cls}`} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{bn ? c.note_bn : c.note_en}</p>
                      {c.values.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.values.map((v, k) => (
                            <code key={k} className="text-[11px] px-2 py-1 rounded-md bg-secondary/70 text-foreground break-all">
                              {v}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debug logs */}
      <div className="glass-card rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {bn ? "সাম্প্রতিক এরর লগ" : "Recent error log"}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{logs.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogs([...getDebugLogs()])}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {bn ? "রিফ্রেশ" : "Refresh"}
            </button>
            <button
              onClick={copyLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" /> {copied ? (bn ? "কপি হয়েছে" : "Copied") : bn ? "কপি" : "Copy"}
            </button>
            <button
              onClick={() => { clearDebugLogs(); setLogs([]); }}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {bn ? "মুছুন" : "Clear"}
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {bn ? "কোনো এরর রেকর্ড হয়নি — সবকিছু ঠিকভাবে চলছে।" : "No errors recorded — everything is running fine."}
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-[11px] font-semibold text-foreground">{l.code}</code>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">{l.area}</span>
                  {l.status ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">HTTP {l.status}</span>
                  ) : null}
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(l.at).toLocaleString(bn ? "bn-BD" : "en-US")}
                  </span>
                </div>
                <p className="text-xs text-foreground mt-1.5 break-words">
                  {l.context ? <span className="text-muted-foreground">{l.context}: </span> : null}
                  {l.message}
                </p>
                {l.detail && <p className="text-[11px] text-muted-foreground mt-1 break-words">{l.detail}</p>}
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {friendlyMessage(l.area, bn, l.status, l.message)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Troubleshoot;
