import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SSLCommerz Sandbox credentials (replace with live credentials via secrets)
const SSLCOMMERZ_STORE_ID = Deno.env.get("SSLCOMMERZ_STORE_ID") || "testbox";
const SSLCOMMERZ_STORE_PASS = Deno.env.get("SSLCOMMERZ_STORE_PASS") || "qwerty";
const SSLCOMMERZ_IS_SANDBOX = !Deno.env.get("SSLCOMMERZ_STORE_ID"); // sandbox if no live credentials
const SSLCOMMERZ_BASE = SSLCOMMERZ_IS_SANDBOX
  ? "https://sandbox.sslcommerz.com"
  : "https://securepay.sslcommerz.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, amount, customer_name, customer_email, customer_phone, description, success_url, fail_url, cancel_url } = await req.json();

    if (!invoice_id || !amount) {
      return new Response(
        JSON.stringify({ error: "invoice_id and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tran_id = `TXN-${invoice_id}-${Date.now()}`;

    // Prepare SSLCommerz session
    const formData = new URLSearchParams();
    formData.append("store_id", SSLCOMMERZ_STORE_ID);
    formData.append("store_passwd", SSLCOMMERZ_STORE_PASS);
    formData.append("total_amount", String(amount));
    formData.append("currency", "BDT");
    formData.append("tran_id", tran_id);
    formData.append("success_url", success_url || `${SUPABASE_URL}/functions/v1/payment-callback`);
    formData.append("fail_url", fail_url || `${SUPABASE_URL}/functions/v1/payment-callback`);
    formData.append("cancel_url", cancel_url || `${SUPABASE_URL}/functions/v1/payment-callback`);
    formData.append("ipn_url", `${SUPABASE_URL}/functions/v1/payment-callback`);
    formData.append("cus_name", customer_name || "Customer");
    formData.append("cus_email", customer_email || "customer@example.com");
    formData.append("cus_phone", customer_phone || "01700000000");
    formData.append("cus_add1", "Dhaka");
    formData.append("cus_city", "Dhaka");
    formData.append("cus_country", "Bangladesh");
    formData.append("shipping_method", "NO");
    formData.append("product_name", description || "Domain Registration");
    formData.append("product_category", "Digital Service");
    formData.append("product_profile", "non-physical-goods");

    const response = await fetch(`${SSLCOMMERZ_BASE}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      // Store transaction reference in invoice
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("invoices").update({
        payment_method: "sslcommerz",
        description: `${description || ""} | TXN: ${tran_id}`,
      }).eq("id", invoice_id);

      return new Response(
        JSON.stringify({
          success: true,
          gateway_url: data.GatewayPageURL,
          tran_id,
          sessionkey: data.sessionkey,
          is_sandbox: SSLCOMMERZ_IS_SANDBOX,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: data.failedreason || "Failed to create payment session", details: data }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("SSLCommerz init error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
