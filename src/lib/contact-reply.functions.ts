import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  sendContactReply,
  listContactReplies,
  type ContactReplyResult,
  type ContactReplyRow,
} from "./contact-reply.server";

async function assertStaff(supabase: any, userId: string) {
  const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "call_center" }),
  ]);
  if (!isAdmin && !isStaff) throw new Error("Staff access required");
}

export const replyToContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ messageId: z.string().uuid(), reply: z.string().trim().min(2).max(5000) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ContactReplyResult> => {
    await assertStaff(context.supabase, context.userId);
    return sendContactReply(context.userId, data.messageId, data.reply);
  });

export const getContactReplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ messageId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<ContactReplyRow[]> => {
    await assertStaff(context.supabase, context.userId);
    return listContactReplies(data.messageId);
  });
