import { createFileRoute } from "@tanstack/react-router";
import { createUserClientFromRequest, loadBilling } from "@/lib/dashboard-data.server";

export const Route = createFileRoute("/api/dashboard/billing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await createUserClientFromRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        try {
          const payload = await loadBilling(auth.supabase, auth.userId);
          return Response.json(payload, {
            headers: { "cache-control": "private, no-store" },
          });
        } catch (error) {
          console.error("[api/dashboard/billing]", error);
          return Response.json({ error: "Failed to load billing data" }, { status: 500 });
        }
      },
    },
  },
});
