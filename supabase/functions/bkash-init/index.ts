import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// bKash Sandbox credentials (replace with live credentials via secrets)
const BKASH_APP_KEY = Deno.env.get("BKASH_APP_KEY") || "";
const BKASH_APP_SECRET = Deno.env.get("BKASH_APP_SECRET") || "";
const BKASH_USERNAME = Deno.env.get("BKASH_USERNAME") || "";
const BKASH_PASSWORD = Deno.env.get("BKASH_PASSWORD") || "";
const BKASH_IS_SANDBOX = !Deno.env.get("BKASH_APP_KEY");
const BKASH_BASE = BKASH_IS_SANDBOX
  ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
  : "https://tokenized.pay.bka.sh/v1.2.0-beta";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function getToken(): Promise<string | null> {
  if (!BKASH_APP_KEY || !BKASH_APP_SECRET) return null;

  try {
    const res = await fetch(`${BKASH_BASE}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
      },
      body: JSON.stringify({
        app_key: BKASH_APP_KEY,
        app_secret: BKASH_APP_SECRET,
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

    if (!BKASH_APP_KEY) {
      return new Response(
        JSON.stringify({
          error: "bKash credentials not configured",
          is_sandbox: true,
          message: "bKash পেমেন্ট গেটওয়ে এখনো কনফিগার করা হয়নি। লাইভ credentials যোগ করুন।",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await getToken();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Failed to get bKash token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentRes = await fetch(`${BKASH_BASE}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "X-APP-Key": BKASH_APP_KEY,
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
          is_sandbox: BKASH_IS_SANDBOX,
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
