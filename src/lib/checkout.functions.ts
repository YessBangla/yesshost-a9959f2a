import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cartItemSchema = z.object({
  type: z.enum(["domain", "hosting", "theme"]),
  domain: z.string().max(253).optional(),
  ext: z.string().max(30).optional(),
  plan_id: z.string().max(100).optional(),
  billing_cycle: z.string().max(20).optional(),
  theme_id: z.string().uuid().optional(),
  theme_slug: z.string().max(120).optional(),
  include_hosting: z.boolean().optional(),
});

export const createSecureOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    items: z.array(cartItemSchema).min(1).max(30),
    couponCode: z.string().trim().max(30).nullable().optional(),
    paymentMethod: z.enum(["wallet", "sslcommerz", "bkash", "nagad", "bank"]),
    orderNote: z.string().trim().max(500).nullable().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("create_order_secure", {
      _items: data.items,
      _coupon_code: data.couponCode ?? null,
      _payment_method: data.paymentMethod,
      _order_note: data.orderNote ?? null,
    });
    if (error) throw new Error(error.message);
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("Order creation failed");
    return { ...result, userId: context.userId } as {
      order_id: string;
      order_number: string;
      invoice_id: string;
      invoice_number: string;
      subtotal_bdt: number;
      discount_bdt: number;
      total_bdt: number;
      userId: string;
    };
  });