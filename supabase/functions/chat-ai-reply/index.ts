import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chat_id, message, lang } = await req.json();

    if (!chat_id || !message) {
      return new Response(
        JSON.stringify({ error: "chat_id and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch data context + conversation history in parallel
    const [plansResult, domainsResult, historyResult] = await Promise.all([
      supabase.from("pricing_plans").select("name, category, price_bdt, annual_price_bdt").eq("is_active", true).order("sort_order").limit(15),
      supabase.from("domain_pricing").select("ext, registration_bdt, renewal_bdt").eq("is_active", true).order("sort_order").limit(10),
      supabase.from("live_chat_messages").select("sender_type, message").eq("chat_id", chat_id).order("created_at", { ascending: true }).limit(10),
    ]);

    // Build compact context
    let context = "";
    if (plansResult.data?.length) {
      context += "HOSTING PLANS:\n";
      for (const p of plansResult.data) {
        context += `${p.name} (${p.category}): ৳${p.price_bdt}/mo${p.annual_price_bdt ? `, ৳${p.annual_price_bdt}/yr` : ""}\n`;
      }
    }
    if (domainsResult.data?.length) {
      context += "\nDOMAIN PRICES:\n";
      for (const d of domainsResult.data) {
        context += `${d.ext}: Reg ৳${d.registration_bdt}, Renew ৳${d.renewal_bdt}\n`;
      }
    }

    const systemPrompt = `You are a customer support AI for "Yess Host", a Bangladeshi web hosting company.

REAL PRICING DATA:
${context || "Check yesshost.lovable.app for pricing."}

RULES:
- Reply in the same language the user writes (Bangla or English)
- Use the exact prices above when asked about pricing
- For account-specific questions, suggest creating a support ticket
- Be concise and friendly, keep replies under 120 words
- Payment methods: bKash, Nagad, SSLCommerz, Bank Transfer
- Support: 24/7 chat, tickets, knowledge base`;

    // Build messages array
    const aiMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    const history = historyResult.data;
    if (history?.length) {
      // Only include last 6 messages for context
      const recent = history.slice(-6);
      for (const msg of recent) {
        aiMessages.push({
          role: msg.sender_type === "visitor" ? "user" : "assistant",
          content: msg.message,
        });
      }
    }

    // Ensure current message is the last user message
    const last = aiMessages[aiMessages.length - 1];
    if (!last || last.role !== "user" || last.content !== message) {
      aiMessages.push({ role: "user", content: message });
    }

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error("Empty AI reply:", JSON.stringify(aiData).slice(0, 300));
      // Fallback response
      const fallback = lang === "bn"
        ? "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে একটি সাপোর্ট টিকেট তৈরি করুন অথবা আমাদের সাথে যোগাযোগ করুন।"
        : "Sorry, I couldn't process your request right now. Please create a support ticket or contact us directly.";
      
      await supabase.from("live_chat_messages").insert({ chat_id, sender_type: "admin", message: fallback });
      return new Response(JSON.stringify({ reply: fallback }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save reply
    const { error: insertError } = await supabase.from("live_chat_messages").insert({ chat_id, sender_type: "admin", message: reply });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save reply" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ reply }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Chat AI error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
