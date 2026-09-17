import { createFileRoute } from "@tanstack/react-router";
import { createPublicClient } from "@/lib/dashboard-data.server";

type CheckResult = { key: string; ok: boolean; ms: number; detail?: string };

async function timed(key: string, fn: () => Promise<void>): Promise<CheckResult> {
  const started = Date.now();
  try {
    await fn();
    return { key, ok: true, ms: Date.now() - started };
  } catch (error) {
    return {
      key,
      ok: false,
      ms: Date.now() - started,
      detail: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createPublicClient();

        const checks = await Promise.all([
          timed("panel", async () => {
            // App server itself answered this request.
          }),
          timed("database", async () => {
            const { error } = await supabase
              .from("domain_pricing")
              .select("ext", { head: true, count: "exact" })
              .limit(1);
            if (error) throw new Error(error.message);
          }),
          timed("web", async () => {
            const { error } = await supabase
              .from("site_content")
              .select("id", { head: true, count: "exact" })
              .eq("is_active", true)
              .limit(1);
            if (error) throw new Error(error.message);
          }),
          timed("support", async () => {
            const { error } = await supabase
              .from("site_content")
              .select("id", { head: true, count: "exact" })
              .limit(1);
            if (error) throw new Error(error.message);
          }),
          timed("dns", async () => {
            const res = await fetch("https://cloudflare-dns.com/dns-query?name=yesshost.com&type=A", {
              headers: { accept: "application/dns-json" },
            });
            if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
          }),
        ]);

        const allOk = checks.every((c) => c.ok);
        return Response.json(
          { ok: allOk, checkedAt: new Date().toISOString(), checks },
          { headers: { "cache-control": "no-store" }, status: 200 },
        );
      },
    },
  },
});
