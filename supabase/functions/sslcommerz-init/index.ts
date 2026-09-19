import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Credentials come from the admin Payment Gateway settings (server-only table),
// with environment secrets as a fallback.
async function loadSslCfg() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db
    .from("payment_gateway_settings")
    .select("enabled, is_sandbox, credentials")
    .eq("gateway", "sslcommerz")
    .maybeSingle();

  const creds = (data?.credentials ?? {}) as Record<string, string>;
  const storeId = creds.store_id || Deno.env.get("SSLCOMMERZ_STORE_ID") || "testbox";
  const storePass = creds.store_pass || Deno.env.get("SSLCOMMERZ_STORE_PASS") || "qwerty";
  const configured = !!creds.store_id || !!Deno.env.get("SSLCOMMERZ_STORE_ID");
  const isSandbox = data ? !!data.is_sandbox : !configured;

  return {
    storeId,
    storePass,
    isSandbox,
    enabled: data ? !!data.enabled : configured,
    base: isSandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com",
  };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, customer_name, customer_email, customer_phone, description, is_wallet_deposit, share_token } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const { data: auth } = token ? await authClient.auth.getUser(token) : { data: { user: null } };
    const source = is_wallet_deposit ? "wallet_transactions" : "invoices";
    const fields = is_wallet_deposit
      ? "id,user_id,status,amount_bdt"
      : "id,user_id,status,amount_bdt,share_token_hash,share_expires_at";
    let payableQuery = authClient.from(source).select(fields).eq("id", invoice_id);
    if (auth.user) payableQuery = payableQuery.eq("user_id", auth.user.id);
    payableQuery = is_wallet_deposit ? payableQuery.eq("status", "pending") : payableQuery.in("status", ["unpaid", "overdue"]);
    const { data: payable } = await payableQuery.maybeSingle();
    const shareable = payable as { share_token_hash?: string | null; share_expires_at?: string | null } | null;
    const validShareToken = !is_wallet_deposit && !!share_token && shareable?.share_token_hash === await sha256Hex(String(share_token)) && !!shareable.share_expires_at && new Date(shareable.share_expires_at).getTime() > Date.now();
    if (!auth.user && !validShareToken) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const amount = Number(payable?.amount_bdt);
    if (!payable || !Number.isFinite(amount) || amount <= 0) return new Response(JSON.stringify({ error: "Payable record not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const cfg = await loadSslCfg();
    if (!cfg.enabled) {
      return new Response(
        JSON.stringify({
          error: "SSLCommerz is not enabled",
          message: "SSLCommerz এখনো চালু করা হয়নি। অ্যাডমিন প্যানেলের পেমেন্ট গেটওয়ে সেটিংসে তথ্য দিন।",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tran_id = `TXN-${invoice_id}-${Date.now()}`;

    // Prepare SSLCommerz session
    const formData = new URLSearchParams();
    formData.append("store_id", cfg.storeId);
    formData.append("store_passwd", cfg.storePass);
    formData.append("total_amount", String(amount));
    formData.append("currency", "BDT");
    formData.append("tran_id", tran_id);
    formData.append("success_url", `${SUPABASE_URL}/functions/v1/payment-callback`);
    formData.append("fail_url", `${SUPABASE_URL}/functions/v1/payment-callback`);
    formData.append("cancel_url", `${SUPABASE_URL}/functions/v1/payment-callback`);
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

    const response = await fetch(`${cfg.base}/gwprocess/v4/api.php`, {
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
          is_sandbox: cfg.isSandbox,
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
