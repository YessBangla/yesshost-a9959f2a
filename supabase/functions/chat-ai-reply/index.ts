import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a friendly and professional customer support AI assistant for "Yess Host" — a Bangladeshi web hosting company.

Your knowledge:
- Services: Shared Hosting, Cloud Hosting, VPS, WordPress Hosting, Reseller Hosting, Domain Registration, SSL Certificates, Email Hosting
- Payment methods: bKash, Nagad, SSLCommerz, Bank Transfer
- Support: 24/7 live chat, ticket system, knowledge base
- Website: yesshost.lovable.app

Guidelines:
- Be concise, helpful, and friendly. Use emojis sparingly.
- If the user writes in Bangla, reply in Bangla. If in English, reply in English.
- For billing/account-specific questions, suggest contacting a live agent or creating a support ticket.
- Never make up pricing — say "Please check our pricing page or contact our team for the latest rates."
- If you don't know something, say so honestly and offer to connect them with a human agent.
- Keep responses under 150 words.`;

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

    // Fetch recent conversation history (last 20 messages)
    const { data: history } = await supabase
      .from("live_chat_messages")
      .select("sender_type, message")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.sender_type === "visitor" ? "user" : "assistant",
          content: msg.message,
        });
      }
    } else {
      messages.push({ role: "user", content: message });
    }

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

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
