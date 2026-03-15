import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Static fallback prices
const FALLBACK_PRICES: Record<string, { bdt: string; usd: string }> = {
  ".com": { bdt: "৯৯০", usd: "9.90" },
  ".net": { bdt: "১,০৯০", usd: "10.90" },
  ".org": { bdt: "১,১৯০", usd: "11.90" },
  ".top": { bdt: "১৮০", usd: "1.80" },
  ".xyz": { bdt: "২৯৫", usd: "2.95" },
  ".shop": { bdt: "৩৯০", usd: "3.90" },
  ".fun": { bdt: "৩৮০", usd: "3.80" },
  ".info": { bdt: "৪৯০", usd: "4.90" },
  ".io": { bdt: "৩,৯৯০", usd: "39.90" },
  ".co": { bdt: "২,৪৯০", usd: "24.90" },
  ".com.bd": { bdt: "১,৫০০", usd: "15.00" },
  ".net.bd": { bdt: "১,২০০", usd: "12.00" },
  ".org.bd": { bdt: "১,০০০", usd: "10.00" },
  ".edu.bd": { bdt: "১,০০০", usd: "10.00" },
  ".ac.bd": { bdt: "১,০০০", usd: "10.00" },
  ".বাংলা": { bdt: "১,৫০০", usd: "15.00" },
};

const EXTENSIONS = [".com", ".com.bd", ".net", ".net.bd", ".org", ".org.bd", ".xyz", ".top", ".shop", ".fun", ".info", ".io", ".co", ".edu.bd", ".ac.bd", ".বাংলা"];

interface WhoisInfo {
  registrar?: string;
  creation_date?: string;
  expiry_date?: string;
  updated_date?: string;
  status?: string[];
  nameservers?: string[];
}

async function loadPricesFromDb(): Promise<{ prices: Record<string, { bdt: string; usd: string; renewal_bdt: string }>; sortedExts: string[] }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const client = createClient(supabaseUrl, supabaseKey);
    const { data } = await client.from("domain_pricing").select("ext, registration_bdt, renewal_bdt, sort_order").eq("is_active", true).order("sort_order");
    if (data && data.length > 0) {
      const prices: Record<string, { bdt: string; usd: string; renewal_bdt: string }> = {};
      const sortedExts: string[] = [];
      for (const row of data) {
        prices[row.ext] = { bdt: row.registration_bdt, usd: "N/A", renewal_bdt: row.renewal_bdt };
        sortedExts.push(row.ext);
      }
      return { prices, sortedExts };
    }
  } catch (e) {
    console.error("Failed to load prices from DB:", e);
  }
  const fallback: Record<string, { bdt: string; usd: string; renewal_bdt: string }> = {};
  for (const [ext, p] of Object.entries(FALLBACK_PRICES)) {
    fallback[ext] = { ...p, renewal_bdt: p.bdt };
  }
  return { prices: fallback, sortedExts: EXTENSIONS };
}

async function checkDomainAvailability(domain: string): Promise<boolean> {
  try {
    const records = await Deno.resolveDns(domain, "A");
    return records.length === 0;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound ||
      (error instanceof Error && error.message.includes("no record"))) {
      return true;
    }
    return true;
  }
}

async function fetchWhoisInfo(domain: string): Promise<WhoisInfo | null> {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { "Accept": "application/rdap+json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      await response.text();
      return null;
    }

    const data = await response.json();
    const whois: WhoisInfo = {};

    if (data.entities) {
      const registrarEntity = data.entities.find((e: any) => e.roles?.includes("registrar"));
      if (registrarEntity?.vcardArray?.[1]) {
        const fnEntry = registrarEntity.vcardArray[1].find((v: any) => v[0] === "fn");
        if (fnEntry) whois.registrar = fnEntry[3];
      }
      if (!whois.registrar && registrarEntity?.publicIds?.[0]?.identifier) {
        whois.registrar = registrarEntity.publicIds[0].identifier;
      }
    }

    if (data.events) {
      for (const event of data.events) {
        if (event.eventAction === "registration") whois.creation_date = event.eventDate;
        else if (event.eventAction === "expiration") whois.expiry_date = event.eventDate;
        else if (event.eventAction === "last changed") whois.updated_date = event.eventDate;
      }
    }

    if (data.status) whois.status = data.status.slice(0, 3);
    if (data.nameservers) {
      whois.nameservers = data.nameservers.map((ns: any) => ns.ldhName || ns.unicodeName).filter(Boolean).slice(0, 4);
    }

    return whois;
  } catch (error) {
    console.error(`RDAP lookup failed for ${domain}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, whois: requestWhois } = await req.json();

    if (!domain || typeof domain !== "string") {
      return new Response(
        JSON.stringify({ error: "Domain name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleaned = domain.trim().toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/.*$/, "");

    const parts = cleaned.split(".");
    const name = parts[0];

    if (!name || name.length < 1 || !/^[a-z0-9\u0980-\u09FF]([a-z0-9\u0980-\u09FF-]*[a-z0-9\u0980-\u09FF])?$/.test(name)) {
      return new Response(
        JSON.stringify({ error: "Invalid domain name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If requesting WHOIS for a specific domain
    if (requestWhois && parts.length > 1) {
      const whoisInfo = await fetchWhoisInfo(cleaned);
      return new Response(
        JSON.stringify({ whois: whoisInfo, domain: cleaned }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prices: PRICES, sortedExts } = await loadPricesFromDb();

    // Determine extensions to check (use DB sort order)
    let extensionsToCheck = sortedExts.length > 0 ? sortedExts : EXTENSIONS;
    const userExt = parts.length > 1 ? `.${parts.slice(1).join(".")}` : null;
    if (userExt && extensionsToCheck.includes(userExt)) {
      extensionsToCheck = [userExt, ...extensionsToCheck.filter(e => e !== userExt)];
    }

    const checkList = extensionsToCheck.slice(0, 16);

    const results = await Promise.all(
      checkList.map(async (ext) => {
        const fullDomain = `${name}${ext}`;
        const available = await checkDomainAvailability(fullDomain);
        const price = PRICES[ext] || { bdt: "N/A", usd: "N/A", renewal_bdt: "N/A" };
        return {
          domain: fullDomain,
          ext,
          available,
          price_bdt: price.bdt,
          price_usd: price.usd,
          renewal_bdt: price.renewal_bdt,
        };
      })
    );

    return new Response(
      JSON.stringify({ results, query: name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Domain check error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
