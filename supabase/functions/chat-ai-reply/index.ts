import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(context: {
  plans: string;
  domains: string;
  faqs: string;
}) {
  return `You are a friendly and professional customer support AI assistant for "Yess Host" — a Bangladeshi web hosting company.

## LIVE PRICING DATA (from our database — use these EXACT prices when asked)

### Hosting Plans:
${context.plans || "No plans available currently."}

### Domain Pricing:
${context.domains || "No domain pricing available currently."}

## FAQ Knowledge Base:
${context.faqs || "No FAQs available."}

## Company Info:
- Company: Yess Host
- Services: Shared Hosting, Cloud Hosting, VPS, WordPress Hosting, Reseller Hosting, Domain Registration, SSL Certificates, Email Hosting
- Payment methods: bKash, Nagad, SSLCommerz, Bank Transfer
- Support: 24/7 live chat, ticket system, knowledge base
- Website: yesshost.lovable.app

## Guidelines:
- Be concise, helpful, and friendly. Use emojis sparingly.
- If the user writes in Bangla, reply in Bangla. If in English, reply in English.
- Use the EXACT pricing data above when answering pricing questions. Format prices in BDT (৳).
- For billing/account-specific questions (e.g. invoice status, service details), suggest contacting a live agent or creating a support ticket since you don't have access to their account.
- If asked something not covered by the data above, say so honestly and offer to connect with a human agent.
- Keep responses under 200 words.
- When listing plans, format them nicely with bullet points.`;
}

async function fetchContext(supabase: any) {
  // Fetch hosting plans
  const { data: plans } = await supabase
    .from("pricing_plans")
    .select("name, category, price_bdt, annual_price_bdt, subtitle, features")
    .eq("is_active", true)
    .order("sort_order");

  let plansText = "";
  if (plans && plans.length > 0) {
    const grouped: Record<string, any[]> = {};
    for (const p of plans) {
      const cat = p.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }
    for (const [cat, items] of Object.entries(grouped)) {
      plansText += `\n**${cat.replace(/_/g, " ").toUpperCase()}:**\n`;
      for (const p of items) {
        const features = Array.isArray(p.features) 
          ? p.features.map((f: any) => typeof f === "string" ? f : f?.text || f?.name || "").filter(Boolean).slice(0, 5).join(", ")
          : "";
        plansText += `- ${p.name}: ৳${p.price_bdt}/mo${p.annual_price_bdt ? ` (৳${p.annual_price_bdt}/yr)` : ""}${p.subtitle ? ` — ${p.subtitle}` : ""}${features ? ` | Features: ${features}` : ""}\n`;
      }
    }
  }

  // Fetch domain pricing
  const { data: domains } = await supabase
    .from("domain_pricing")
    .select("ext, registration_bdt, renewal_bdt, transfer_bdt, is_popular")
    .eq("is_active", true)
    .order("sort_order")
    .limit(20);

  let domainsText = "";
  if (domains && domains.length > 0) {
    for (const d of domains) {
      domainsText += `- ${d.ext}: Registration ৳${d.registration_bdt}, Renewal ৳${d.renewal_bdt}, Transfer ৳${d.transfer_bdt}${d.is_popular ? " ⭐" : ""}\n`;
    }
  }

  // Fetch FAQs
  const { data: faqs } = await supabase
    .from("faqs")
    .select("question_en, answer_en, question_bn, answer_bn")
    .eq("is_active", true)
    .order("sort_order")
    .limit(15);

  let faqsText = "";
  if (faqs && faqs.length > 0) {
    for (const f of faqs) {
      faqsText += `Q: ${f.question_en} / ${f.question_bn}\nA: ${f.answer_en}\n\n`;
    }
  }

  return { plans: plansText, domains: domainsText, faqs: faqsText };
}

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

    // Fetch real data context + conversation history in parallel
    const [context, historyResult] = await Promise.all([
      fetchContext(supabase),
      supabase
        .from("live_chat_messages")
        .select("sender_type, message")
        .eq("chat_id", chat_id)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

    const systemPrompt = buildSystemPrompt(context);

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    const history = historyResult.data;
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.sender_type === "visitor" ? "user" : "assistant",
          content: msg.message,
        });
      }
    }

    // Always ensure the latest user message is at the end
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== message) {
      messages.push({ role: "user", content: message });
    }

    console.log("Sending to AI, messages count:", messages.length, "system prompt length:", systemPrompt.length);

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    console.log("AI response status:", aiResponse.status);

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI error:", aiResponse.status);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error("AI response data:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No reply generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save AI reply as admin message
    const { error: insertError } = await supabase
      .from("live_chat_messages")
      .insert({
        chat_id,
        sender_type: "admin",
        message: reply,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save reply" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat AI error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
