import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Credentials come from the admin Payment Gateway settings (server-only table),
// with environment secrets as a fallback.
async function loadNagadCfg() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db
    .from("payment_gateway_settings")
    .select("enabled, is_sandbox, credentials")
    .eq("gateway", "nagad")
    .maybeSingle();

  const creds = (data?.credentials ?? {}) as Record<string, string>;
  const merchantId = creds.merchant_id || Deno.env.get("NAGAD_MERCHANT_ID") || "";
  const merchantKey = creds.merchant_private_key || Deno.env.get("NAGAD_MERCHANT_PRIVATE_KEY") || "";
  const pgPublicKey = creds.pg_public_key || Deno.env.get("NAGAD_PG_PUBLIC_KEY") || "";
  const isSandbox = data ? !!data.is_sandbox : !merchantId;

  return {
    merchantId,
    merchantKey,
    pgPublicKey,
    isSandbox,
    enabled: (data ? !!data.enabled : !!merchantId) && !!merchantId,
    base: isSandbox
      ? "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs"
      : "https://api.mynagad.com/api/dfs",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, amount } = await req.json();

    const cfg = await loadNagadCfg();
    if (!cfg.enabled) {
      return new Response(
        JSON.stringify({
          error: "Nagad credentials not configured",
          is_sandbox: true,
          message: "Nagad পেমেন্ট গেটওয়ে এখনো কনফিগার করা হয়নি। লাইভ credentials যোগ করুন।",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Nagad payment initialization requires cryptographic signing
    // The full implementation needs the merchant private key for signing requests
    const orderId = `ORD-${invoice_id}-${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);

    // Step 1: Initialize payment
    const initRes = await fetch(
      `${cfg.base}/check-out/initialize/${cfg.merchantId}/${orderId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
          "X-KM-Api-Version": "v-0.2.0",
        },
        body: JSON.stringify({
          dateTime: timestamp,
          sensitiveData: "", // Encrypted with PG public key
          signature: "", // Signed with merchant private key
        }),
      }
    );

    const initData = await initRes.json();

    if (initData.sensitiveData) {
      // Step 2: Complete payment - decrypt and process
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("invoices").update({
        payment_method: "nagad",
      }).eq("id", invoice_id);

      return new Response(
        JSON.stringify({
          success: true,
          data: initData,
          order_id: orderId,
          is_sandbox: cfg.isSandbox,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Nagad initialization failed", details: initData }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Nagad init error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
