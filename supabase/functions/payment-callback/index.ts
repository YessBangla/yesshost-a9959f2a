import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SSLCOMMERZ_STORE_ID = Deno.env.get("SSLCOMMERZ_STORE_ID") || "testbox";
const SSLCOMMERZ_STORE_PASS = Deno.env.get("SSLCOMMERZ_STORE_PASS") || "qwerty";
const SSLCOMMERZ_IS_SANDBOX = !Deno.env.get("SSLCOMMERZ_STORE_ID");
const SSLCOMMERZ_BASE = SSLCOMMERZ_IS_SANDBOX
  ? "https://sandbox.sslcommerz.com"
  : "https://securepay.sslcommerz.com";

const BKASH_APP_KEY = Deno.env.get("BKASH_APP_KEY") || "";
const BKASH_APP_SECRET = Deno.env.get("BKASH_APP_SECRET") || "";
const BKASH_USERNAME = Deno.env.get("BKASH_USERNAME") || "";
const BKASH_PASSWORD = Deno.env.get("BKASH_PASSWORD") || "";
const BKASH_IS_SANDBOX = !Deno.env.get("BKASH_APP_KEY");
const BKASH_BASE = BKASH_IS_SANDBOX
  ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
  : "https://tokenized.pay.bka.sh/v1.2.0-beta";

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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function md5Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("MD5", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SSLCommerz signs every IPN/callback with verify_sign (md5 over the
 * verify_key fields plus the md5 of the store password). A payload whose
 * signature does not match was not produced by SSLCommerz.
 */
async function verifySslcommerzSignature(body: Record<string, string>): Promise<boolean> {
  const { verify_sign, verify_key } = body;
  if (!verify_sign || !verify_key) return false;
  const keys = verify_key.split(",").map((k) => k.trim()).filter(Boolean).sort();
  const parts = keys.map((k) => `${k}=${body[k] ?? ""}`);
  parts.push(`store_passwd=${await md5Hex(SSLCOMMERZ_STORE_PASS)}`);
  parts.sort();
  const expected = await md5Hex(parts.join("&"));
  return expected === verify_sign.toLowerCase();
}

/**
 * Records the gateway result. The unique (gateway, transaction_id) index makes
 * this the idempotency gate: a duplicate callback returns alreadyProcessed and
 * the invoice is never settled twice.
 */
async function recordPaymentEvent(
  supabase: any,
  event: {
    invoiceId: string | null;
    userId: string | null;
    gateway: string;
    transactionId: string;
    amount: number | null;
    status: string;
    verified: boolean;
    message: string;
    payload: Record<string, string>;
  },
): Promise<{ alreadyProcessed: boolean; eventId: string | null }> {
  const { data, error } = await supabase
    .from("payment_events")
    .insert({
      invoice_id: event.invoiceId,
      user_id: event.userId,
      gateway: event.gateway,
      transaction_id: event.transactionId,
      amount_bdt: event.amount,
      status: event.status,
      verified: event.verified,
      message: event.message,
      payload: event.payload,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique violation -> this transaction was already handled.
    if (error.code === "23505") {
      console.log(`[payment-callback] duplicate ${event.gateway} txn ${event.transactionId} ignored`);
      return { alreadyProcessed: true, eventId: null };
    }
    console.error("[payment-callback] failed to log payment event:", error);
    return { alreadyProcessed: false, eventId: null };
  }
  return { alreadyProcessed: false, eventId: data?.id ?? null };
}

async function createPaymentNotification(
  supabase: any,
  userId: string,
  success: boolean,
  amount: string,
  transactionId: string,
  gateway: string,
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

/**
 * Marks the invoice paid, stores the payment-history row, updates the linked
 * order, activates/extends the service. Safe to call only once per payment —
 * recordPaymentEvent guards that.
 */
async function settlePaidInvoice(
  supabase: any,
  invoiceId: string,
  method: string,
  transactionId: string,
) {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, user_id, invoice_number, amount_bdt, description, service_id, status")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return;

  const paidAt = new Date().toISOString();

  if (invoice.status !== "paid") {
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: paidAt, payment_method: method })
      .eq("id", invoiceId);
  }

  const { data: existing } = await supabase
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", invoice.user_id)
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("wallet_transactions").insert({
      user_id: invoice.user_id,
      type: "payment",
      amount_bdt: Number(invoice.amount_bdt || 0),
      status: "completed",
      payment_method: method,
      transaction_id: transactionId,
      description: `Invoice ${invoice.invoice_number} paid via ${method}`,
    });
  }

  const { data: linkedOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("invoice_id", invoiceId)
    .in("status", ["pending", "confirmed"]);

  for (const order of linkedOrders ?? []) {
    await supabase
      .from("orders")
      .update({ payment_status: "paid", paid_at: paidAt, payment_method: method, status: "processing" })
      .eq("id", order.id);
  }

  const desc: string = invoice.description || "";
  const isRenewal = desc.toLowerCase().includes("domain renewal");

  if (invoice.service_id && isRenewal) {
    const yearsMatch = desc.match(/(\d+)y @/);
    const years = yearsMatch ? Number(yearsMatch[1]) : 1;
    const { data: service } = await supabase
      .from("services")
      .select("id, expiry_date")
      .eq("id", invoice.service_id)
      .single();
    if (service) {
      const base = service.expiry_date && new Date(service.expiry_date) > new Date()
        ? new Date(service.expiry_date)
        : new Date();
      base.setFullYear(base.getFullYear() + years);
      await supabase
        .from("services")
        .update({ status: "active", expiry_date: base.toISOString() })
        .eq("id", service.id);
    }
  } else if (invoice.service_id) {
    await supabase
      .from("services")
      .update({ status: "active", start_date: paidAt })
      .eq("id", invoice.service_id)
      .eq("status", "pending");
  }

  await supabase
    .from("payment_events")
    .update({ settled: true })
    .eq("transaction_id", transactionId);

  console.log(`[payment-callback] invoice ${invoice.invoice_number} settled via ${method} (${transactionId})`);
}

async function loadInvoice(supabase: any, invoiceId: string | null) {
  if (!invoiceId) return null;
  const { data } = await supabase
    .from("invoices")
    .select("id, user_id, amount_bdt, invoice_number")
    .eq("id", invoiceId)
    .maybeSingle();
  return data;
}

/* ------------------------------------------------------------------ */
/* SSLCommerz                                                          */
/* ------------------------------------------------------------------ */

async function handleSSLCommerz(body: Record<string, string>, supabase: any) {
  const { tran_id, val_id, status, amount } = body;

  if (!tran_id) return redirectToFrontend("fail", "Missing transaction ID");

  const parts = tran_id.split("-");
  const invoiceId = parts.length >= 2 ? parts[1] : null;
  const invoice = await loadInvoice(supabase, invoiceId);

  let verified = false;
  let message = "";

  if (status === "VALID" || status === "VALIDATED") {
    const signatureOk = await verifySslcommerzSignature(body);
    if (!signatureOk) {
      message = "Signature verification failed";
    } else if (!val_id) {
      message = "Missing val_id";
    } else {
      try {
        const verifyRes = await fetch(
          `${SSLCOMMERZ_BASE}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${SSLCOMMERZ_STORE_ID}&store_passwd=${SSLCOMMERZ_STORE_PASS}&format=json`,
        );
        const verifyData = await verifyRes.json();
        const statusOk = verifyData.status === "VALID" || verifyData.status === "VALIDATED";
        const paid = Number(verifyData.amount ?? amount ?? 0);
        const due = Number(invoice?.amount_bdt ?? 0);
        const amountOk = !due || paid + 0.5 >= due;
        verified = statusOk && amountOk;
        message = verified ? "Verified by SSLCommerz validator" : statusOk ? "Amount mismatch" : "Validator rejected";
      } catch (err) {
        console.error("SSLCommerz verification failed:", err);
        message = "Validator unreachable";
      }
    }
  } else if (status === "FAILED") {
    message = "Payment failed at gateway";
  } else {
    message = "Payment cancelled";
  }

  const { alreadyProcessed } = await recordPaymentEvent(supabase, {
    invoiceId: invoice?.id ?? null,
    userId: invoice?.user_id ?? null,
    gateway: "sslcommerz",
    transactionId: tran_id,
    amount: amount ? Number(amount) : (invoice?.amount_bdt ?? null),
    status: status || "unknown",
    verified,
    message,
    payload: body,
  });

  if (alreadyProcessed) {
    return redirectToFrontend(verified ? "success" : "fail", tran_id);
  }

  if (verified && invoice) {
    await settlePaidInvoice(supabase, invoice.id, "sslcommerz", tran_id);
    await createPaymentNotification(supabase, invoice.user_id, true, amount || String(invoice.amount_bdt), tran_id, "sslcommerz");
    return redirectToFrontend("success", tran_id);
  }

  if (invoice && status === "FAILED") {
    await createPaymentNotification(supabase, invoice.user_id, false, amount || String(invoice.amount_bdt), tran_id, "sslcommerz");
  }

  if (status === "VALID" || status === "VALIDATED" || status === "FAILED") {
    return redirectToFrontend("fail", message || "Payment failed");
  }
  return redirectToFrontend("cancel", "Payment cancelled");
}

/* ------------------------------------------------------------------ */
/* bKash                                                               */
/* ------------------------------------------------------------------ */

async function getBkashToken(): Promise<string | null> {
  if (!BKASH_APP_KEY || !BKASH_APP_SECRET) return null;
  try {
    const res = await fetch(`${BKASH_BASE}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
      },
      body: JSON.stringify({ app_key: BKASH_APP_KEY, app_secret: BKASH_APP_SECRET }),
    });
    const data = await res.json();
    return data.id_token ?? null;
  } catch (err) {
    console.error("bKash token error:", err);
    return null;
  }
}

async function handleBkash(body: Record<string, string>, supabase: any) {
  const { paymentID, status } = body;
  if (!paymentID) return redirectToFrontend("fail", "Missing payment ID");

  let verified = false;
  let message = "";
  let invoiceId: string | null = null;
  let trxId = paymentID;
  let paidAmount: number | null = null;

  if (status && status !== "success") {
    message = `bKash reported ${status}`;
  } else {
    const token = await getBkashToken();
    if (!token) {
      message = "bKash credentials not configured — payment not confirmed";
    } else {
      try {
        // Executing the payment server-side is bKash's verification step:
        // only bKash can turn a paymentID into a completed transaction.
        const res = await fetch(`${BKASH_BASE}/tokenized/checkout/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
            "X-APP-Key": BKASH_APP_KEY,
          },
          body: JSON.stringify({ paymentID }),
        });
        const data = await res.json();
        verified = data.transactionStatus === "Completed" || data.statusCode === "0000";
        invoiceId = data.merchantInvoiceNumber ? null : null;
        trxId = data.trxID || paymentID;
        paidAmount = data.amount ? Number(data.amount) : null;
        message = verified ? "Verified by bKash execute" : `bKash execute returned ${data.statusMessage || "failure"}`;
        if (data.payerReference) invoiceId = null;
        if (data.merchantInvoiceNumber) {
          const { data: inv } = await supabase
            .from("invoices")
            .select("id")
            .eq("invoice_number", data.merchantInvoiceNumber)
            .maybeSingle();
          invoiceId = inv?.id ?? null;
        }
      } catch (err) {
        console.error("bKash execute failed:", err);
        message = "bKash unreachable";
      }
    }
  }

  const invoice = await loadInvoice(supabase, invoiceId);
  if (invoice && paidAmount && Number(invoice.amount_bdt) - paidAmount > 0.5) {
    verified = false;
    message = "Amount mismatch";
  }

  const { alreadyProcessed } = await recordPaymentEvent(supabase, {
    invoiceId: invoice?.id ?? null,
    userId: invoice?.user_id ?? null,
    gateway: "bkash",
    transactionId: trxId,
    amount: paidAmount,
    status: status || (verified ? "success" : "unknown"),
    verified,
    message,
    payload: body,
  });

  if (alreadyProcessed) return redirectToFrontend(verified ? "success" : "fail", trxId);

  if (verified && invoice) {
    await settlePaidInvoice(supabase, invoice.id, "bkash", trxId);
    await createPaymentNotification(supabase, invoice.user_id, true, String(invoice.amount_bdt), trxId, "bkash");
    return redirectToFrontend("success", trxId);
  }

  if (invoice) {
    await createPaymentNotification(supabase, invoice.user_id, false, String(invoice.amount_bdt), trxId, "bkash");
  }
  return redirectToFrontend(verified ? "success" : "fail", message || "bKash payment failed");
}

/* ------------------------------------------------------------------ */
/* Nagad                                                               */
/* ------------------------------------------------------------------ */

const NAGAD_MERCHANT_ID = Deno.env.get("NAGAD_MERCHANT_ID") || "";
const NAGAD_BASE = NAGAD_MERCHANT_ID
  ? "https://api.mynagad.com/api/dfs"
  : "https://sandbox.mynagad.com/api/dfs";

async function handleNagad(body: Record<string, string>, supabase: any) {
  const paymentRefId = body.payment_ref_id || body.paymentRefId || body.order_id || "";
  if (!paymentRefId) return redirectToFrontend("fail", "Missing payment reference");

  let verified = false;
  let message = "";
  let invoiceId: string | null = null;
  let paidAmount: number | null = null;

  if (!NAGAD_MERCHANT_ID) {
    message = "Nagad credentials not configured — payment not confirmed";
  } else {
    try {
      // Nagad's verification endpoint is the only trustworthy source; the
      // browser redirect itself is never treated as proof of payment.
      const res = await fetch(`${NAGAD_BASE}/verify/payment/${paymentRefId}`);
      const data = await res.json();
      verified = data.status === "Success";
      paidAmount = data.amount ? Number(data.amount) : null;
      message = verified ? "Verified by Nagad" : `Nagad returned ${data.status || "failure"}`;
      if (data.orderId) {
        const { data: inv } = await supabase
          .from("invoices")
          .select("id")
          .eq("invoice_number", data.orderId)
          .maybeSingle();
        invoiceId = inv?.id ?? null;
      }
    } catch (err) {
      console.error("Nagad verification failed:", err);
      message = "Nagad unreachable";
    }
  }

  const invoice = await loadInvoice(supabase, invoiceId);
  if (invoice && paidAmount && Number(invoice.amount_bdt) - paidAmount > 0.5) {
    verified = false;
    message = "Amount mismatch";
  }

  const { alreadyProcessed } = await recordPaymentEvent(supabase, {
    invoiceId: invoice?.id ?? null,
    userId: invoice?.user_id ?? null,
    gateway: "nagad",
    transactionId: paymentRefId,
    amount: paidAmount,
    status: verified ? "success" : "unverified",
    verified,
    message,
    payload: body,
  });

  if (alreadyProcessed) return redirectToFrontend(verified ? "success" : "fail", paymentRefId);

  if (verified && invoice) {
    await settlePaidInvoice(supabase, invoice.id, "nagad", paymentRefId);
    await createPaymentNotification(supabase, invoice.user_id, true, String(invoice.amount_bdt), paymentRefId, "nagad");
    return redirectToFrontend("success", paymentRefId);
  }

  if (invoice) {
    await createPaymentNotification(supabase, invoice.user_id, false, String(invoice.amount_bdt), paymentRefId, "nagad");
  }
  return redirectToFrontend("fail", message || "Nagad payment not verified");
}

function redirectToFrontend(status: string, ref: string) {
  const redirectUrl = `${FRONTEND_URL}/payment/${status}?ref=${encodeURIComponent(ref)}`;
  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl },
  });
}
