import { GATEWAYS, type GatewayId, type GatewayStatus } from "./payment-gateways";

function maskValue(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const v = value.trim();
  if (v.length <= 4) return "••••";
  return `••••${v.slice(-4)}`;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Throws when the caller is not an admin. */
export async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

export async function listGatewayStatus(): Promise<{ gateways: GatewayStatus[] }> {
  const db = await admin();
  const { data } = await db
    .from("payment_gateway_settings")
    .select("gateway, enabled, is_sandbox, credentials, updated_at");

  const rows = (data ?? []) as Array<{
    gateway: string;
    enabled: boolean;
    is_sandbox: boolean;
    credentials: Record<string, unknown> | null;
    updated_at: string | null;
  }>;

  const gateways = GATEWAYS.map((def) => {
    const row = rows.find((r) => r.gateway === def.id);
    const creds = (row?.credentials ?? {}) as Record<string, unknown>;
    const configured: Record<string, string | null> = {};
    for (const f of def.fields) {
      configured[f.key] = f.secret ? maskValue(creds[f.key]) : ((creds[f.key] as string) ?? null) || null;
    }
    return {
      gateway: def.id,
      enabled: !!row?.enabled,
      isSandbox: row ? !!row.is_sandbox : true,
      configured,
      updatedAt: row?.updated_at ?? null,
    } satisfies GatewayStatus;
  });

  return { gateways };
}

export type SaveGatewayInput = {
  gateway: GatewayId;
  enabled: boolean;
  isSandbox: boolean;
  /** Only the fields the admin actually typed. Empty/omitted values keep the stored value. */
  credentials: Record<string, string>;
  /** Field keys the admin explicitly cleared. */
  cleared?: string[];
};

export async function saveGateway(input: SaveGatewayInput, userId: string) {
  const def = GATEWAYS.find((g) => g.id === input.gateway);
  if (!def) throw new Error("Unknown gateway");

  const db = await admin();
  const { data: existing } = await db
    .from("payment_gateway_settings")
    .select("credentials")
    .eq("gateway", input.gateway)
    .maybeSingle();

  const merged: Record<string, string> = {
    ...(((existing as any)?.credentials ?? {}) as Record<string, string>),
  };

  for (const f of def.fields) {
    const incoming = input.credentials?.[f.key];
    if (typeof incoming === "string" && incoming.trim() !== "") merged[f.key] = incoming.trim();
  }
  for (const key of input.cleared ?? []) delete merged[key];

  if (input.enabled) {
    const missing = def.fields.filter((f) => !merged[f.key]);
    if (missing.length) {
      return { ok: false as const, code: "missing_fields", fields: missing.map((f) => f.key) };
    }
  }

  const { error } = await db
    .from("payment_gateway_settings")
    .upsert(
      {
        gateway: input.gateway,
        enabled: input.enabled,
        is_sandbox: input.isSandbox,
        credentials: merged,
        updated_by: userId,
      } as any,
      { onConflict: "gateway" }
    );

  if (error) return { ok: false as const, code: "save_failed", detail: error.message };
  return { ok: true as const };
}
