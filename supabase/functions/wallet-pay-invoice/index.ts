import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Get invoice
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .eq("user_id", user.id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status !== "unpaid" && invoice.status !== "overdue") {
      return new Response(JSON.stringify({ error: "Invoice already paid or cancelled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = Number(invoice.amount_bdt);

    // Calculate wallet balance
    const { data: txns } = await admin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const balance = (txns || []).reduce((sum: number, t: any) => {
      const isCredit = t.type === "deposit" || t.type === "refund";
      return isCredit ? sum + Number(t.amount_bdt) : sum - Number(t.amount_bdt);
    }, 0);

    if (balance < amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance", balance, required: amount }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct from wallet
    const { error: walletErr } = await admin.from("wallet_transactions").insert({
      user_id: user.id,
      type: "payment",
      amount_bdt: amount,
      status: "completed",
      payment_method: "wallet",
      description: `Invoice payment: ${invoice.invoice_number}`,
      transaction_id: `WP-${invoice.invoice_number}-${Date.now()}`,
    });

    if (walletErr) {
      return new Response(JSON.stringify({ error: "Failed to process wallet payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invoice as paid
    await admin.from("invoices").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: "wallet",
    }).eq("id", invoice_id);

    // Check if invoice linked to an order, update order too
    const { data: orders } = await admin
      .from("orders")
      .select("id")
      .eq("invoice_id", invoice_id)
      .eq("user_id", user.id);

    if (orders && orders.length > 0) {
      for (const order of orders) {
        await admin.from("orders").update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "wallet",
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        }).eq("id", order.id);
      }
    }

    // Domain renewal invoices extend the linked domain automatically
    const desc: string = invoice.description || "";
    if (invoice.service_id && desc.toLowerCase().includes("domain renewal")) {
      const yearsMatch = desc.match(/(\d+)y @/);
      const years = yearsMatch ? Number(yearsMatch[1]) : 1;
      const { data: service } = await admin
        .from("services")
        .select("id, expiry_date")
        .eq("id", invoice.service_id)
        .single();
      if (service) {
        const base = service.expiry_date && new Date(service.expiry_date) > new Date()
          ? new Date(service.expiry_date)
          : new Date();
        base.setFullYear(base.getFullYear() + years);
        await admin
          .from("services")
          .update({ status: "active", expiry_date: base.toISOString() })
          .eq("id", service.id);
      }
    }

    // Send notification
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Payment Successful",
      message: `Invoice ${invoice.invoice_number} paid via wallet (৳${amount})`,
      type: "payment_success",
      metadata: { invoice_id, amount, method: "wallet" },
    });

    return new Response(
      JSON.stringify({ success: true, new_balance: balance - amount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
