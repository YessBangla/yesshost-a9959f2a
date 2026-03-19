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

async function createPaymentNotification(
  supabase: any,
  userId: string,
  success: boolean,
  amount: string,
  transactionId: string,
  gateway: string
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: success ? "পেমেন্ট সফল হয়েছে!" : "পেমেন্ট ব্যর্থ হয়েছে",
      message: success
        ? `৳${amount} সফলভাবে পরিশোধ হয়েছে। Transaction: ${transactionId}`
        : `৳${amount} পেমেন্ট সম্পন্ন হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`,
      type: success ? "payment_success" : "payment_failed",
      metadata: { amount, transaction_id: transactionId, gateway },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

async function handleSSLCommerz(body: Record<string, string>, supabase: any) {
  const { tran_id, val_id, status, amount } = body;

  if (!tran_id) {
    return redirectToFrontend("fail", "Missing transaction ID");
  }

  const parts = tran_id.split("-");
  const invoiceId = parts.length >= 2 ? parts[1] : null;

  if (status === "VALID" || status === "VALIDATED") {
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
      // Get the invoice to find user_id and linked order
      const { data: invoice } = await supabase
        .from("invoices")
        .select("user_id, amount_bdt")
        .eq("id", invoiceId)
        .single();

      await supabase.from("invoices").update({
        status: verified ? "paid" : "unpaid",
        paid_at: verified ? new Date().toISOString() : null,
        payment_method: "sslcommerz",
      }).eq("id", invoiceId);

      if (verified) {
        // Update linked order status to paid/active
        const { data: linkedOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("invoice_id", invoiceId)
          .in("status", ["pending", "confirmed"]);

        if (linkedOrders && linkedOrders.length > 0) {
          for (const order of linkedOrders) {
            await supabase.from("orders").update({
              payment_status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "sslcommerz",
              status: "processing",
            }).eq("id", order.id);
          }
        }

        // Activate pending services linked to this invoice
        await supabase.from("services").update({
          status: "active",
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("status", "pending");
      }

      // Create notification
      if (invoice?.user_id) {
        await createPaymentNotification(
          supabase,
          invoice.user_id,
          verified,
          amount || String(invoice.amount_bdt),
          tran_id,
          "sslcommerz"
        );
      }
    }

    return redirectToFrontend(verified ? "success" : "fail", verified ? tran_id : "Verification failed");
  } else if (status === "FAILED") {
    if (invoiceId) {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("user_id, amount_bdt")
        .eq("id", invoiceId)
        .single();

      await supabase.from("invoices").update({ status: "unpaid" }).eq("id", invoiceId);

      if (invoice?.user_id) {
        await createPaymentNotification(
          supabase,
          invoice.user_id,
          false,
          amount || String(invoice.amount_bdt),
          tran_id,
          "sslcommerz"
        );
      }
    }
    return redirectToFrontend("fail", "Payment failed");
  } else {
    return redirectToFrontend("cancel", "Payment cancelled");
  }
}

async function handleBkash(body: Record<string, string>, supabase: any) {
  const { paymentID, status } = body;

  if (status === "success" && paymentID) {
    return redirectToFrontend("success", paymentID);
  }

  return redirectToFrontend("fail", "bKash payment failed");
}

async function handleNagad(body: Record<string, string>, supabase: any) {
  return redirectToFrontend("success", "nagad-callback");
}

function redirectToFrontend(status: string, ref: string) {
  const redirectUrl = `${FRONTEND_URL}/payment/${status}?ref=${encodeURIComponent(ref)}`;
  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl },
  });
}
