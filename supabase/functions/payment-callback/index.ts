import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SSLCOMMERZ_STORE_ID = Deno.env.get("SSLCOMMERZ_STORE_ID") || "testbox";
const SSLCOMMERZ_STORE_PASS = Deno.env.get("SSLCOMMERZ_STORE_PASS") || "qwerty";
const SSLCOMMERZ_IS_SANDBOX = !Deno.env.get("SSLCOMMERZ_STORE_ID");
const SSLCOMMERZ_BASE = SSLCOMMERZ_IS_SANDBOX
  ? "https://sandbox.sslcommerz.com"
  : "https://securepay.sslcommerz.com";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://yesshost.lovable.app";

serve(async (req) => {
  const url = new URL(req.url);
  const gateway = url.searchParams.get("gateway") || "sslcommerz";

  try {
    let body: Record<string, string> = {};

    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.text();
        body = Object.fromEntries(new URLSearchParams(formData));
      } else {
        body = await req.json();
      }
    } else {
      body = Object.fromEntries(url.searchParams);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (gateway === "sslcommerz") {
      return await handleSSLCommerz(body, supabase);
    } else if (gateway === "bkash") {
      return await handleBkash(body, supabase);
    } else if (gateway === "nagad") {
      return await handleNagad(body, supabase);
    }

    return redirectToFrontend("fail", "Unknown gateway");
  } catch (error) {
    console.error("Payment callback error:", error);
    return redirectToFrontend("fail", "Processing error");
  }
});

async function handleSSLCommerz(body: Record<string, string>, supabase: any) {
  const { tran_id, val_id, status, amount } = body;

  if (!tran_id) {
    return redirectToFrontend("fail", "Missing transaction ID");
  }

  // Extract invoice_id from tran_id format: TXN-{invoice_id}-{timestamp}
  const parts = tran_id.split("-");
  const invoiceId = parts.length >= 2 ? parts[1] : null;

  if (status === "VALID" || status === "VALIDATED") {
    // Verify with SSLCommerz
    let verified = false;
    if (val_id) {
      try {
        const verifyRes = await fetch(
          `${SSLCOMMERZ_BASE}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${SSLCOMMERZ_STORE_ID}&store_passwd=${SSLCOMMERZ_STORE_PASS}&format=json`
        );
        const verifyData = await verifyRes.json();
        verified = verifyData.status === "VALID" || verifyData.status === "VALIDATED";
      } catch (err) {
        console.error("SSLCommerz verification failed:", err);
      }
    }

    if (invoiceId) {
      await supabase.from("invoices").update({
        status: verified ? "paid" : "unpaid",
        paid_at: verified ? new Date().toISOString() : null,
        payment_method: "sslcommerz",
      }).eq("id", invoiceId);

      // Also update associated services
      if (verified) {
        await supabase.from("services").update({
          status: "active",
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("status", "pending");
      }
    }

    return redirectToFrontend(verified ? "success" : "fail", verified ? tran_id : "Verification failed");
  } else if (status === "FAILED") {
    if (invoiceId) {
      await supabase.from("invoices").update({ status: "unpaid" }).eq("id", invoiceId);
    }
    return redirectToFrontend("fail", "Payment failed");
  } else {
    // Cancelled
    return redirectToFrontend("cancel", "Payment cancelled");
  }
}

async function handleBkash(body: Record<string, string>, supabase: any) {
  const { paymentID, status } = body;

  if (status === "success" && paymentID) {
    // In production, execute the payment here using bKash API
    return redirectToFrontend("success", paymentID);
  }

  return redirectToFrontend("fail", "bKash payment failed");
}

async function handleNagad(body: Record<string, string>, supabase: any) {
  // Handle Nagad callback
  return redirectToFrontend("success", "nagad-callback");
}

function redirectToFrontend(status: string, ref: string) {
  const redirectUrl = `${FRONTEND_URL}/payment/${status}?ref=${encodeURIComponent(ref)}`;
  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl },
  });
}
