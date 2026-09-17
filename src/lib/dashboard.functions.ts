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

export const startLiveChat = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; phone: string; greeting: string }) => {
    const name = (data?.name ?? "").trim();
    const email = (data?.email ?? "").trim();
    const phone = (data?.phone ?? "").trim();
    const greeting = (data?.greeting ?? "").trim();
    if (!name || !email || !phone) throw new Error("name, email and phone are required");
    return { name, email, phone, greeting };
  })
  .handler(async ({ data }): Promise<{ chatId: string }> => {
    const { createVisitorChat } = await import("./live-chat.server");
    return createVisitorChat(data);
  });

export const sendLiveChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { chatId: string; message: string }) => {
    const chatId = (data?.chatId ?? "").trim();
    const message = (data?.message ?? "").trim();
    if (!chatId || !message) throw new Error("chatId and message are required");
    return { chatId, message: message.slice(0, 2000) };
  })
  .handler(async ({ data }): Promise<{ message: ChatMessage }> => {
    const { postVisitorMessage } = await import("./live-chat.server");
    return postVisitorMessage(data);
  });

export const startCallRecordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { chatId: string; callerRole: string; startedAt: string }) => {
    if (!data?.chatId || !data?.callerRole || !data?.startedAt) throw new Error("invalid call data");
    return data;
  })
  .handler(async ({ data }): Promise<{ id: string | null }> => {
    const { startCallRecord } = await import("./live-chat.server");
    return startCallRecord(data);
  });

export const updateCallRecordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status: string; durationSeconds?: number; ended?: boolean }) => {
    if (!data?.id || !data?.status) throw new Error("invalid call update");
    return data;
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { updateCallRecord } = await import("./live-chat.server");
    return updateCallRecord(data);
  });
