import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AccountStatusResult } from "./client-accounts.server";

export const updateClientAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["pending", "approved", "suspended"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<AccountStatusResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin access required");

    const { setAccountStatus } = await import("./client-accounts.server");
    return setAccountStatus(context.userId, data.userId, data.status, data.note);
  });
