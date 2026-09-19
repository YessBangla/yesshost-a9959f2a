import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateSupportPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { randomInt } = await import("crypto");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pin = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.rpc("set_support_pin_for_user", {
      _user_id: context.userId,
      _pin: pin,
      _expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);
    return { pin, expiresAt };
  });