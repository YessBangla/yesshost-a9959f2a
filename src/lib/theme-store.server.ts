import type { DashboardClient } from "./dashboard-data.server";

export type ThemePurchaseResult = {
  orderId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
};

export class ThemeStoreError extends Error {
  constructor(public code: string, detail?: string) {
    super(detail ?? code);
  }
}

/** Creates an unpaid invoice + pending theme order. Price is resolved server-side. */
export async function purchaseTheme(
  supabase: DashboardClient,
  userId: string,
  themeId: string,
  includeHosting: boolean,
): Promise<ThemePurchaseResult> {
  const { data: theme, error } = await supabase
    .from("themes")
    .select("id, name, price_bdt, discount_price_bdt, hosting_bundle_price_bdt, is_active, approval_status")
    .eq("id", themeId)
    .maybeSingle();
  if (error) throw new ThemeStoreError("server_error", error.message);
  if (!theme || theme.is_active === false || theme.approval_status !== "approved") {
    throw new ThemeStoreError("theme_unavailable");
  }

  const base = Number(theme.discount_price_bdt ?? 0) > 0
    ? Number(theme.discount_price_bdt)
    : Number(theme.price_bdt);
  const amount = includeHosting && theme.hosting_bundle_price_bdt
    ? Number(theme.hosting_bundle_price_bdt)
    : base;
  if (!amount || amount <= 0) throw new ThemeStoreError("price_unknown");

  const { data: existing } = await supabase
    .from("theme_orders")
    .select("id, invoice_id, status")
    .eq("user_id", userId)
    .eq("theme_id", themeId)
    .in("status", ["paid", "completed"])
    .maybeSingle();
  if (existing) throw new ThemeStoreError("already_owned");

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      amount_bdt: amount,
      status: "unpaid",
      due_date: dueDate,
      description: `Theme purchase — ${theme.name}${includeHosting ? " (with hosting bundle)" : ""}`,
    })
    .select("id, invoice_number, due_date")
    .single();
  if (invErr || !invoice) throw new ThemeStoreError("server_error", invErr?.message);

  const { data: order, error: ordErr } = await supabase
    .from("theme_orders")
    .insert({
      user_id: userId,
      theme_id: themeId,
      amount_bdt: amount,
      include_hosting: includeHosting,
      status: "pending",
      invoice_id: invoice.id,
    })
    .select("id")
    .single();
  if (ordErr || !order) throw new ThemeStoreError("server_error", ordErr?.message);

  return {
    orderId: order.id,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    amount,
    dueDate: invoice.due_date ?? dueDate,
  };
}

export type SellerProfileInput = {
  displayName: string;
  slug: string;
  logoUrl?: string | null;
  bioBn?: string | null;
  bioEn?: string | null;
  website?: string | null;
  isPublic: boolean;
};

export async function saveSellerProfile(
  supabase: DashboardClient,
  userId: string,
  input: SellerProfileInput,
) {
  const { data: clash } = await supabase
    .from("theme_seller_profiles")
    .select("user_id")
    .eq("slug", input.slug)
    .maybeSingle();
  if (clash && clash.user_id !== userId) throw new ThemeStoreError("slug_taken");

  const { data, error } = await supabase
    .from("theme_seller_profiles")
    .upsert(
      {
        user_id: userId,
        display_name: input.displayName,
        slug: input.slug,
        logo_url: input.logoUrl ?? null,
        bio_bn: input.bioBn ?? null,
        bio_en: input.bioEn ?? null,
        website: input.website ?? null,
        is_public: input.isPublic,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) throw new ThemeStoreError("server_error", error.message);
  return data;
}
