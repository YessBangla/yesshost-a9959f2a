import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  purchaseTheme,
  saveSellerProfile,
  type SellerProfileInput,
  type ThemePurchaseResult,
} from "./theme-store.server";

export const buyTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { themeId: string; includeHosting?: boolean }) =>
    z
      .object({ themeId: z.string().uuid(), includeHosting: z.boolean().optional().default(false) })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ThemePurchaseResult> => {
    return purchaseTheme(context.supabase, context.userId, data.themeId, data.includeHosting);
  });

const slugRule = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "slug_invalid");

export const saveThemeSellerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SellerProfileInput) =>
    z
      .object({
        displayName: z.string().trim().min(2).max(80),
        slug: slugRule,
        logoUrl: z.string().url().max(500).nullable().optional(),
        bioBn: z.string().max(1000).nullable().optional(),
        bioEn: z.string().max(1000).nullable().optional(),
        website: z.string().url().max(300).nullable().optional().or(z.literal("")),
        isPublic: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    return saveSellerProfile(context.supabase, context.userId, {
      ...data,
      website: data.website ? data.website : null,
    } as SellerProfileInput);
  });
