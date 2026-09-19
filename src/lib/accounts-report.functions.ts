import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AccountsReportSettings, SendReportResult } from "./accounts-report.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Admin access required");
}

export const getAccountsReportSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountsReportSettings> => {
    await assertAdmin(context.supabase, context.userId);
    const { getReportSettings } = await import("./accounts-report.server");
    return getReportSettings();
  });

export const saveAccountsReportSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        recipients: z.array(z.string().email()).max(20),
        enabled: z.boolean(),
        includeExpenses: z.boolean(),
        includeCashbank: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<AccountsReportSettings> => {
    await assertAdmin(context.supabase, context.userId);
    const { saveReportSettings } = await import("./accounts-report.server");
    return saveReportSettings(data);
  });

export const sendAccountsReportNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<SendReportResult> => {
    await assertAdmin(context.supabase, context.userId);
    const { sendAccountsReport } = await import("./accounts-report.server");
    return sendAccountsReport(data.month);
  });
