import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTENSIONS = [".com", ".net", ".org", ".top", ".xyz", ".shop", ".fun", ".info", ".io", ".co"];

const PRICES: Record<string, { bdt: string; usd: string }> = {
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
};

async function checkDomainAvailability(domain: string): Promise<boolean> {
  try {
    const records = await Deno.resolveDns(domain, "A");
    return records.length === 0;
  } catch (error) {
    // If DNS resolution fails, the domain likely doesn't exist (available)
    if (error instanceof Deno.errors.NotFound || 
        (error instanceof Error && error.message.includes("no record"))) {
      return true;
    }
    // For NXDOMAIN or similar errors, domain is available
    return true;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain || typeof domain !== "string") {
      return new Response(
        JSON.stringify({ error: "Domain name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the input - extract the name part
    const cleaned = domain
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/.*$/, "");

    // Split name and extension
    const parts = cleaned.split(".");
    const name = parts[0];

    if (!name || name.length < 1 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
      return new Response(
        JSON.stringify({ error: "Invalid domain name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which extensions to check
    let extensionsToCheck = EXTENSIONS;
    
    // If user provided a specific extension, check that first
    const userExt = parts.length > 1 ? `.${parts.slice(1).join(".")}` : null;
    if (userExt && EXTENSIONS.includes(userExt)) {
      extensionsToCheck = [userExt, ...EXTENSIONS.filter(e => e !== userExt)];
    }

    // Check availability for each extension (limit to 6 for speed)
    const checkList = extensionsToCheck.slice(0, 6);
    
    const results = await Promise.all(
      checkList.map(async (ext) => {
        const fullDomain = `${name}${ext}`;
        const available = await checkDomainAvailability(fullDomain);
        const price = PRICES[ext] || { bdt: "N/A", usd: "N/A" };
        return {
          domain: fullDomain,
          ext,
          available,
          price_bdt: price.bdt,
          price_usd: price.usd,
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
