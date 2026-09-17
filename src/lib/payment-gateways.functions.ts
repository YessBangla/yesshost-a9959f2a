import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GatewayId, GatewayStatus } from "./payment-gateways";

export const getPaymentGateways = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ gateways: GatewayStatus[] }> => {
    const { assertAdmin, listGatewayStatus } = await import("./payment-gateways.server");
    await assertAdmin(context.supabase, context.userId);
    return listGatewayStatus();
  });

export const savePaymentGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    gateway: GatewayId;
    enabled: boolean;
    isSandbox: boolean;
    credentials: Record<string, string>;
    cleared?: string[];
  }) => {
    if (!data?.gateway) throw new Error("gateway is required");
    return {
      gateway: data.gateway,
      enabled: !!data.enabled,
      isSandbox: !!data.isSandbox,
      credentials: data.credentials ?? {},
      cleared: data.cleared ?? [],
    };
  })
  .handler(async ({ data, context }) => {
    const { assertAdmin, saveGateway } = await import("./payment-gateways.server");
    await assertAdmin(context.supabase, context.userId);
    return saveGateway(data, context.userId);
  });
