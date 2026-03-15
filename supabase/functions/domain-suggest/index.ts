import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { domain, lang } = await req.json();

    if (!domain || typeof domain !== "string") {
      return new Response(
        JSON.stringify({ error: "Domain name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\.\w+(\.\w+)?$/, "").replace(/\/.*$/, "");

    if (!name || name.length < 1) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ suggestions: generateFallbackSuggestions(name) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a domain name suggestion tool. Given the domain name "${name}", suggest 8 creative, catchy, and brandable alternative domain names. 
Rules:
- Return ONLY a JSON array of strings (just the name part without extensions), e.g. ["name1","name2"]
- Names should be short (1-15 chars), easy to spell, and memorable
- Include variations like: synonyms, prefixes (get/my/go/try), suffixes (hub/app/pro/ly/io), creative misspellings, compound words
- Do NOT include the original name "${name}" itself
- Do NOT include any domain extensions
- Return valid JSON only, no explanation`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ suggestions: generateFallbackSuggestions(name) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content?.trim() || "";
    
    let suggestions: string[] = [];
    try {
      // Extract JSON array from response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        suggestions = JSON.parse(match[0]);
      }
    } catch {
      console.error("Failed to parse AI suggestions:", content);
      suggestions = generateFallbackSuggestions(name);
    }

    // Clean and validate
    suggestions = suggestions
      .filter((s: any) => typeof s === "string" && s.length > 0 && s.length <= 20)
      .map((s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter((s: string) => s.length > 0 && s !== name)
      .slice(0, 8);

    if (suggestions.length < 4) {
      suggestions = [...new Set([...suggestions, ...generateFallbackSuggestions(name)])].slice(0, 8);
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Domain suggest error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackSuggestions(name: string): string[] {
  const prefixes = ["get", "my", "go", "try", "the"];
  const suffixes = ["hub", "app", "pro", "zone", "spot", "nest", "base", "lab"];
  const suggestions: string[] = [];
  
  for (const p of prefixes) {
    suggestions.push(`${p}${name}`);
  }
  for (const s of suffixes) {
    suggestions.push(`${name}${s}`);
  }
  
  return suggestions.slice(0, 8);
}
