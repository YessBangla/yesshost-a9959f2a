import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  loadBilling,
  loadDomains,
  loadIncome,
  loadServices,
  loadChatMessages,
  type BillingPayload,
  type DomainsPayload,
  type IncomePayload,
  type ServicesPayload,
  type ChatMessage,
} from "./dashboard-data.server";

export const getDashboardBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingPayload> => {
    return loadBilling(context.supabase, context.userId);
  });

export const getDashboardServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServicesPayload> => {
    return loadServices(context.supabase, context.userId);
  });

export const getDashboardDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DomainsPayload> => {
    return loadDomains(context.supabase, context.userId);
  });

export const getDashboardIncome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IncomePayload> => {
    return loadIncome(context.supabase, context.userId);
  });

export const getLiveChatMessages = createServerFn({ method: "GET" })
  .inputValidator((data: { chatId: string }) => {
    if (!data?.chatId || typeof data.chatId !== "string") throw new Error("chatId is required");
    return { chatId: data.chatId };
  })
  .handler(async ({ data }): Promise<{ messages: ChatMessage[] }> => {
    return { messages: await loadChatMessages(data.chatId) };
  });
