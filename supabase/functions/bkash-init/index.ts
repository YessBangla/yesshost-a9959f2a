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
async function loadBkashCfg() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db
    .from("payment_gateway_settings")
    .select("enabled, is_sandbox, credentials")
    .eq("gateway", "bkash")
    .maybeSingle();

  const creds = (data?.credentials ?? {}) as Record<string, string>;
  const appKey = creds.app_key || Deno.env.get("BKASH_APP_KEY") || "";
  const appSecret = creds.app_secret || Deno.env.get("BKASH_APP_SECRET") || "";
  const username = creds.username || Deno.env.get("BKASH_USERNAME") || "";
  const password = creds.password || Deno.env.get("BKASH_PASSWORD") || "";
  const isSandbox = data ? !!data.is_sandbox : !appKey;

  return {
    appKey,
    appSecret,
    username,
    password,
    isSandbox,
    enabled: (data ? !!data.enabled : !!appKey) && !!appKey && !!appSecret,
    base: isSandbox
      ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
      : "https://tokenized.pay.bka.sh/v1.2.0-beta",
  };
}

async function getToken(cfg: Awaited<ReturnType<typeof loadBkashCfg>>): Promise<string | null> {
  try {
    const res = await fetch(`${cfg.base}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        username: cfg.username,
        password: cfg.password,
      },
      body: JSON.stringify({
        app_key: cfg.appKey,
        app_secret: cfg.appSecret,
      }),
    });
    const data = await res.json();
    return data.id_token || null;
  } catch (err) {
    console.error("bKash token error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, amount, payer_reference, callback_url } = await req.json();

    const cfg = await loadBkashCfg();
    if (!cfg.enabled) {
      return new Response(
        JSON.stringify({
          error: "bKash credentials not configured",
          is_sandbox: true,
          message: "bKash পেমেন্ট গেটওয়ে এখনো চালু হয়নি। অ্যাডমিন প্যানেলের পেমেন্ট গেটওয়ে সেটিংসে তথ্য দিন।",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await getToken(cfg);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Failed to get bKash token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentRes = await fetch(`${cfg.base}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "X-APP-Key": cfg.appKey,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: payer_reference || invoice_id,
        callbackURL: callback_url || `${SUPABASE_URL}/functions/v1/payment-callback?gateway=bkash`,
        amount: String(amount),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: invoice_id,
      }),
    });

    const paymentData = await paymentRes.json();

    if (paymentData.bkashURL) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("invoices").update({
        payment_method: "bkash",
      }).eq("id", invoice_id);

      return new Response(
        JSON.stringify({
          success: true,
          bkash_url: paymentData.bkashURL,
          payment_id: paymentData.paymentID,
          is_sandbox: cfg.isSandbox,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: paymentData.statusMessage || "bKash payment creation failed", details: paymentData }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bKash init error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
