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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, full_name, phone, roles } = await req.json();

    // Create user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Assign roles
    if (roles && Array.isArray(roles)) {
      const roleInserts = roles.filter((r: string) => r !== "user").map((r: string) => ({ user_id: userId, role: r }));
      if (roleInserts.length > 0) {
        await adminClient.from("user_roles").insert(roleInserts);
      }
    }

    // Create reseller package if reseller role
    if (roles?.includes("reseller")) {
      await adminClient.from("reseller_packages").insert({
        user_id: userId,
        package_name: "Starter Reseller",
        max_disk_mb: 50000,
        max_bandwidth_mb: 500000,
        max_accounts: 25,
        status: "active",
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
