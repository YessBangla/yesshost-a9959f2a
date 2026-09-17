import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CheckStatus = "ok" | "warn" | "fail";

interface Check {
  id: string;
  status: CheckStatus;
  values: string[];
  note_en: string;
  note_bn: string;
}

async function resolve(domain: string, type: Parameters<typeof Deno.resolveDns>[1]): Promise<string[]> {
  try {
    const res = await Deno.resolveDns(domain, type);
    return (res as unknown[]).map((r) => {
      if (typeof r === "string") return r;
      const o = r as Record<string, unknown>;
      if (o.exchange) return `${o.preference ?? ""} ${o.exchange}`.trim();
      if (o.target) return String(o.target);
      return JSON.stringify(r);
    });
  } catch {
    return [];
  }
}

async function httpCheck(url: string) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    return {
      reachable: true,
      status: res.status,
      location: res.headers.get("location"),
      server: res.headers.get("server"),
      ms: Date.now() - started,
      error: null as string | null,
    };
  } catch (e) {
    return {
      reachable: false,
      status: 0,
      location: null,
      server: null,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { domain, expected_ip, expected_cname } = await req.json();

    if (!domain || typeof domain !== "string") {
      return new Response(JSON.stringify({ error: "Domain is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const host = domain.trim().toLowerCase().replace(/^(https?:\/\/)?/, "").replace(/\/.*$/, "").replace(/^www\./, "");
    if (!/^[a-z0-9\u0980-\u09FF]([a-z0-9\u0980-\u09FF.-]*[a-z0-9\u0980-\u09FF])?\.[a-z\u0980-\u09FF.]{2,}$/.test(host)) {
      return new Response(JSON.stringify({ error: "Invalid domain name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [a, aaaa, ns, mx, txt, wwwCname, wwwA, https, http] = await Promise.all([
      resolve(host, "A"),
      resolve(host, "AAAA"),
      resolve(host, "NS"),
      resolve(host, "MX"),
      resolve(host, "TXT"),
      resolve(`www.${host}`, "CNAME"),
      resolve(`www.${host}`, "A"),
      httpCheck(`https://${host}/`),
      httpCheck(`http://${host}/`),
    ]);

    const checks: Check[] = [];

    // Nameservers
    const isSubdomain = host.split(".").length > 2 && !/\.(com|net|org|edu|ac|gov)\.bd$/.test(host);
    checks.push({
      id: "ns",
      status: ns.length ? "ok" : isSubdomain || a.length ? "warn" : "fail",
      values: ns,
      note_en: ns.length
        ? "Nameservers are set and answering."
        : isSubdomain
          ? "No nameservers of its own — normal for a subdomain, it inherits them from the root domain."
          : a.length
            ? "No nameservers answered directly, but the domain still resolves. Check the delegation at your registrar."
            : "No nameservers found. The domain may be unregistered, expired, or the registrar delegation is missing.",
      note_bn: ns.length
        ? "নেমসার্ভার ঠিকভাবে সেট আছে ও সাড়া দিচ্ছে।"
        : isSubdomain
          ? "নিজস্ব নেমসার্ভার নেই — সাবডোমেইনের ক্ষেত্রে এটি স্বাভাবিক, মূল ডোমেইন থেকেই নেয়।"
          : a.length
            ? "সরাসরি কোনো নেমসার্ভার সাড়া দেয়নি, তবে ডোমেইনটি কাজ করছে। রেজিস্ট্রারে ডেলিগেশন দেখে নিন।"
            : "কোনো নেমসার্ভার পাওয়া যায়নি। ডোমেইনটি রেজিস্টার করা নেই, মেয়াদ শেষ, অথবা রেজিস্ট্রারে নেমসার্ভার সেট করা হয়নি।",
    });

    // A record
    const ipMatches = expected_ip ? a.includes(expected_ip) : null;
    checks.push({
      id: "a",
      status: !a.length ? "fail" : ipMatches === false ? "warn" : "ok",
      values: a,
      note_en: !a.length
        ? "No A record. The domain does not point to any server yet."
        : ipMatches === false
          ? `A record points to ${a.join(", ")} but should point to ${expected_ip}.`
          : "A record found and resolving.",
      note_bn: !a.length
        ? "কোনো A রেকর্ড নেই। ডোমেইনটি এখনো কোনো সার্ভারে পয়েন্ট করছে না।"
        : ipMatches === false
          ? `A রেকর্ড ${a.join(", ")}-এ যাচ্ছে, কিন্তু ${expected_ip}-এ যাওয়ার কথা।`
          : "A রেকর্ড পাওয়া গেছে এবং কাজ করছে।",
    });

    // AAAA (informational)
    checks.push({
      id: "aaaa",
      status: aaaa.length ? "ok" : "warn",
      values: aaaa,
      note_en: aaaa.length ? "IPv6 (AAAA) record found." : "No IPv6 (AAAA) record. This is optional.",
      note_bn: aaaa.length ? "IPv6 (AAAA) রেকর্ড পাওয়া গেছে।" : "IPv6 (AAAA) রেকর্ড নেই। এটি ঐচ্ছিক।",
    });

    // www CNAME / A
    const cnameMatches = expected_cname ? wwwCname.some((c) => c.replace(/\.$/, "") === expected_cname.replace(/\.$/, "")) : null;
    checks.push({
      id: "cname",
      status: wwwCname.length || wwwA.length ? (cnameMatches === false ? "warn" : "ok") : "fail",
      values: wwwCname.length ? wwwCname : wwwA,
      note_en: wwwCname.length
        ? cnameMatches === false
          ? `www points to ${wwwCname.join(", ")} but should point to ${expected_cname}.`
          : "www CNAME is configured."
        : wwwA.length
          ? "www resolves through an A record (no CNAME). This also works."
          : "www does not resolve. Add a CNAME for www pointing to your root domain.",
      note_bn: wwwCname.length
        ? cnameMatches === false
          ? `www ${wwwCname.join(", ")}-এ যাচ্ছে, কিন্তু ${expected_cname}-এ যাওয়ার কথা।`
          : "www CNAME ঠিকভাবে সেট আছে।"
        : wwwA.length
          ? "www একটি A রেকর্ড দিয়ে কাজ করছে (CNAME নেই)। এটিও চলবে।"
          : "www কাজ করছে না। মূল ডোমেইনে পয়েন্ট করে www-এর জন্য একটি CNAME যোগ করুন।",
    });

    // Mail
    checks.push({
      id: "mx",
      status: mx.length ? "ok" : "warn",
      values: mx,
      note_en: mx.length ? "Mail (MX) records found." : "No MX records — email for this domain will not be delivered.",
      note_bn: mx.length ? "মেইল (MX) রেকর্ড পাওয়া গেছে।" : "MX রেকর্ড নেই — এই ডোমেইনের ইমেইল আসবে না।",
    });

    // TXT / verification
    checks.push({
      id: "txt",
      status: txt.length ? "ok" : "warn",
      values: txt.slice(0, 6),
      note_en: txt.length
        ? "TXT records found (SPF / verification)."
        : "No TXT records. SPF/DKIM is recommended so your emails are not marked as spam.",
      note_bn: txt.length
        ? "TXT রেকর্ড পাওয়া গেছে (SPF / ভেরিফিকেশন)।"
        : "কোনো TXT রেকর্ড নেই। ইমেইল স্প্যামে না যাওয়ার জন্য SPF/DKIM যোগ করা ভালো।",
    });

    // HTTPS / SSL
    checks.push({
      id: "ssl",
      status: https.reachable ? (https.status >= 200 && https.status < 400 ? "ok" : "warn") : "fail",
      values: https.reachable ? [`HTTP ${https.status}`, `${https.ms} ms`, https.server || ""].filter(Boolean) : [https.error || "no response"],
      note_en: https.reachable
        ? https.status >= 200 && https.status < 400
          ? "HTTPS works and the SSL certificate is valid."
          : `HTTPS responds with status ${https.status}. The certificate is fine but the site returns an error.`
        : `HTTPS failed: ${https.error}. The SSL certificate may be missing, expired, or issued for a different name.`,
      note_bn: https.reachable
        ? https.status >= 200 && https.status < 400
          ? "HTTPS কাজ করছে এবং SSL সার্টিফিকেট বৈধ।"
          : `HTTPS ${https.status} স্ট্যাটাস দিচ্ছে। সার্টিফিকেট ঠিক আছে, কিন্তু সাইট এরর দিচ্ছে।`
        : `HTTPS কাজ করছে না: ${https.error}। SSL সার্টিফিকেট নেই, মেয়াদ শেষ, অথবা অন্য নামের জন্য ইস্যু করা।`,
    });

    // HTTP → HTTPS redirect
    const redirectsToHttps = http.reachable && http.status >= 300 && http.status < 400 && (http.location || "").startsWith("https://");
    checks.push({
      id: "redirect",
      status: redirectsToHttps ? "ok" : http.reachable ? "warn" : "fail",
      values: [http.reachable ? `HTTP ${http.status}` : http.error || "no response", http.location || ""].filter(Boolean),
      note_en: redirectsToHttps
        ? "HTTP traffic is redirected to HTTPS."
        : http.reachable
          ? "HTTP does not redirect to HTTPS. Visitors may load the insecure version."
          : "The site did not answer on plain HTTP.",
      note_bn: redirectsToHttps
        ? "HTTP থেকে HTTPS-এ রিডাইরেক্ট হচ্ছে।"
        : http.reachable
          ? "HTTP থেকে HTTPS-এ রিডাইরেক্ট হচ্ছে না। দর্শক অনিরাপদ সংস্করণ দেখতে পারেন।"
          : "সাধারণ HTTP-তে সাইট সাড়া দেয়নি।",
    });

    const summary: CheckStatus = checks.some((c) => c.status === "fail")
      ? "fail"
      : checks.some((c) => c.status === "warn")
        ? "warn"
        : "ok";

    return new Response(
      JSON.stringify({ domain: host, summary, checks, checked_at: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("domain-diagnose error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
