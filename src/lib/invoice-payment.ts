import { supabase } from "@/integrations/supabase/client";

export type PayMethod = "wallet" | "sslcommerz" | "bkash" | "nagad" | "bank";

export const INVOICE_PAY_METHODS: { id: PayMethod; en: string; bn: string; hintEn: string; hintBn: string }[] = [
  { id: "wallet", en: "Wallet balance", bn: "ওয়ালেট ব্যালেন্স", hintEn: "Instant — invoice is marked paid right away", hintBn: "তাৎক্ষণিক — ইনভয়েস সঙ্গে সঙ্গে পরিশোধিত হবে" },
  { id: "sslcommerz", en: "Card / Mobile banking", bn: "কার্ড / মোবাইল ব্যাংকিং", hintEn: "SSLCommerz — Visa, Mastercard, bKash, Nagad", hintBn: "SSLCommerz — ভিসা, মাস্টারকার্ড, বিকাশ, নগদ" },
  { id: "bkash", en: "bKash", bn: "বিকাশ", hintEn: "Direct bKash payment", hintBn: "সরাসরি বিকাশ পেমেন্ট" },
  { id: "nagad", en: "Nagad", bn: "নগদ", hintEn: "Direct Nagad payment", hintBn: "সরাসরি নগদ পেমেন্ট" },
  { id: "bank", en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার", hintEn: "Manual — we confirm after the transfer arrives", hintBn: "ম্যানুয়াল — ট্রান্সফার পেলে আমরা নিশ্চিত করব" },
];

export type PayInvoiceInput = {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  method: PayMethod;
  callbackUrl: string;
  customerName?: string | null;
  customerEmail?: string | null;
};

export type PayInvoiceResult =
  | { status: "paid" }
  | { status: "redirect"; url: string }
  | { status: "bank" }
  | { status: "error"; code: "not_live" | "failed"; detail?: string };

/**
 * Starts (or completes) payment for an existing invoice.
 * Wallet payments settle on the server immediately; gateway payments return a
 * redirect URL and the invoice is marked paid by the payment-callback function.
 */
export async function payInvoice(input: PayInvoiceInput): Promise<PayInvoiceResult> {
  const { method, invoiceId, invoiceNumber, amount, callbackUrl } = input;

  if (method === "bank") return { status: "bank" };

  if (method === "wallet") {
    const { data, error } = await supabase.functions.invoke("wallet-pay-invoice", {
      body: { invoice_id: invoiceId },
    });
    if (error || !data?.success) {
      return { status: "error", code: "failed", detail: data?.error || error?.message };
    }
    return { status: "paid" };
  }

  if (method === "sslcommerz") {
    const { data, error } = await supabase.functions.invoke("sslcommerz-init", {
      body: {
        amount,
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        customer_name: input.customerName || "Customer",
        customer_email: input.customerEmail || "",
        callback_url: callbackUrl,
      },
    });
    const url = data?.gateway_url || data?.GatewayPageURL;
    if (url) return { status: "redirect", url };
    return { status: "error", code: "not_live", detail: data?.error || error?.message };
  }

  const { data, error } = await supabase.functions.invoke(method === "bkash" ? "bkash-init" : "nagad-init", {
    body: {
      amount,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      payer_reference: input.customerEmail || "",
      callback_url: callbackUrl,
    },
  });
  const url = data?.gateway_url || data?.bkashURL || data?.callBackUrl;
  if (url) return { status: "redirect", url };
  return { status: "error", code: "not_live", detail: data?.error || error?.message };
}
