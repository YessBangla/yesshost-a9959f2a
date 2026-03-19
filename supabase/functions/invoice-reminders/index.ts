import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();

    // Get unpaid/overdue invoices with due dates
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("id, user_id, invoice_number, amount_bdt, due_date, status")
      .in("status", ["unpaid", "overdue"])
      .not("due_date", "is", null);

    if (error) {
      console.error("Error fetching invoices:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!invoices || invoices.length === 0) {
      return new Response(JSON.stringify({ message: "No pending invoices found", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const inv of invoices) {
      const dueDate = new Date(inv.due_date);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Send reminders at: 7 days, 3 days, 1 day before due, and on due date, and overdue
      let shouldNotify = false;
      let titleEn = "";
      let titleBn = "";
      let messageEn = "";
      let messageBn = "";

      if (diffDays === 7) {
        shouldNotify = true;
        titleEn = "Invoice Due in 7 Days";
        titleBn = "ইনভয়েস ৭ দিনের মধ্যে পরিশোধযোগ্য";
        messageEn = `Invoice #${inv.invoice_number} of ৳${Number(inv.amount_bdt).toLocaleString()} is due in 7 days.`;
        messageBn = `ইনভয়েস #${inv.invoice_number} এর ৳${Number(inv.amount_bdt).toLocaleString()} ৭ দিনের মধ্যে পরিশোধযোগ্য।`;
      } else if (diffDays === 3) {
        shouldNotify = true;
        titleEn = "Invoice Due in 3 Days";
        titleBn = "ইনভয়েস ৩ দিনের মধ্যে পরিশোধযোগ্য";
        messageEn = `Invoice #${inv.invoice_number} of ৳${Number(inv.amount_bdt).toLocaleString()} is due in 3 days. Please pay soon.`;
        messageBn = `ইনভয়েস #${inv.invoice_number} এর ৳${Number(inv.amount_bdt).toLocaleString()} ৩ দিনের মধ্যে পরিশোধযোগ্য। অনুগ্রহ করে শীঘ্রই পরিশোধ করুন।`;
      } else if (diffDays === 1) {
        shouldNotify = true;
        titleEn = "Invoice Due Tomorrow!";
        titleBn = "ইনভয়েস আগামীকাল পরিশোধযোগ্য!";
        messageEn = `Invoice #${inv.invoice_number} of ৳${Number(inv.amount_bdt).toLocaleString()} is due tomorrow! Pay now to avoid late fees.`;
        messageBn = `ইনভয়েস #${inv.invoice_number} এর ৳${Number(inv.amount_bdt).toLocaleString()} আগামীকাল পরিশোধযোগ্য! বিলম্ব ফি এড়াতে এখনই পরিশোধ করুন।`;
      } else if (diffDays === 0) {
        shouldNotify = true;
        titleEn = "Invoice Due Today!";
        titleBn = "ইনভয়েস আজ পরিশোধযোগ্য!";
        messageEn = `Invoice #${inv.invoice_number} of ৳${Number(inv.amount_bdt).toLocaleString()} is due today! Please pay immediately.`;
        messageBn = `ইনভয়েস #${inv.invoice_number} এর ৳${Number(inv.amount_bdt).toLocaleString()} আজ পরিশোধযোগ্য! অনুগ্রহ করে এখনই পরিশোধ করুন।`;
      } else if (diffDays < 0 && diffDays >= -1) {
        // Just became overdue - update status and notify
        shouldNotify = true;
        titleEn = "Invoice Overdue!";
        titleBn = "ইনভয়েস মেয়াদোত্তীর্ণ!";
        messageEn = `Invoice #${inv.invoice_number} of ৳${Number(inv.amount_bdt).toLocaleString()} is now overdue! Please pay immediately to avoid service disruption.`;
        messageBn = `ইনভয়েস #${inv.invoice_number} এর ৳${Number(inv.amount_bdt).toLocaleString()} মেয়াদোত্তীর্ণ হয়েছে! সার্ভিস বন্ধ এড়াতে অনুগ্রহ করে এখনই পরিশোধ করুন।`;

        // Update invoice status to overdue if not already
        if (inv.status !== "overdue") {
          await supabase
            .from("invoices")
            .update({ status: "overdue" })
            .eq("id", inv.id);
        }
      }

      if (!shouldNotify) continue;

      // Check if we already sent a notification for this invoice today to avoid duplicates
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", inv.user_id)
        .eq("type", "invoice_reminder")
        .gte("created_at", todayStart.toISOString())
        .contains("metadata", { invoice_id: inv.id })
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert notification
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: inv.user_id,
          title: titleEn,
          message: messageEn,
          type: "invoice_reminder",
          metadata: {
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            amount_bdt: inv.amount_bdt,
            due_date: inv.due_date,
            days_until_due: diffDays,
            title_bn: titleBn,
            message_bn: messageBn,
          },
        });

      if (notifError) {
        errors.push(`Failed for ${inv.invoice_number}: ${notifError.message}`);
      } else {
        sentCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${invoices.length} invoices, sent ${sentCount} reminders`,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
